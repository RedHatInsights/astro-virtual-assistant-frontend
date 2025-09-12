import { useEffect, useMemo, useState } from 'react';
import { ClientAuthStatus, Models, StateManagerConfiguration } from './types';
import { ChromeUser } from '@redhat-cloud-services/types';
import useArhClient, { useArhAuthenticated } from './useArhClient';
import useRhelLightSpeedManager, { useRhelLightSpeedAuthenticated } from './useRhelLightSpeedManager';
import { useFlag } from '@unleash/proxy-client-react';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { ChatbotProps } from '../Components/UniversalChatbot/UniversalChatbotProvider';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import useVaManager, { useVaAuthenticated } from './useVaManager';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';

import { getModule } from '@scalprum/core';
import { AsyncStateManager } from '../asyncClientInit/types';

function useAsyncManagers() {
  const chrome = useChrome();
  const [managers, setManagers] = useState<{
    loading: boolean;
    error: Error | null;
    managers: {
      manager: StateManagerConfiguration<IAIClient<Record<string, unknown>>>;
      auth: ClientAuthStatus;
    }[];
  }>({ managers: [], loading: true, error: null });
  const meta: { scope: string; module: string }[] = [{ scope: 'virtualAssistant', module: './AsyncLSC' }];
  async function handleInitManagers() {
    const modules = await Promise.all(meta.map((m) => getModule<AsyncStateManager<IAIClient>>(m.scope, m.module)));
    const managers = await Promise.all(
      modules.map((asyncManager) => {
        const manager = asyncManager.getStateManager(chrome);
        const auth = asyncManager.isAuthenticated(chrome);
        return auth.then((auth) => {
          return { manager, auth };
        });
      })
    );
    setManagers({ managers, loading: false, error: null });
  }
  useEffect(() => {
    handleInitManagers();
  }, []);

  return managers;
}

type AsyncManagers = ReturnType<typeof useAsyncManagers>;

function useInitialModel(asyncManagers: AsyncManagers) {
  // Use ARH used as a generic "show chatbot" flag
  const useChatBots = useFlag('platform.arh.enabled');
  const arhEnabled = useArhAuthenticated();
  const rhelLightspeedEnabled = useRhelLightSpeedAuthenticated();
  const vaEnabled = useVaAuthenticated();
  const chrome = useChrome();
  const [auth, setAuth] = useState<{ user: ChromeUser | undefined }>({ user: undefined });

  const enabledList = useMemo(
    () => [arhEnabled, rhelLightspeedEnabled, vaEnabled, ...asyncManagers.managers.map(({ auth }) => auth)],
    [asyncManagers, arhEnabled, rhelLightspeedEnabled, vaEnabled]
  );

  const initializing = enabledList.some((e) => e.loading);
  const model = useMemo<Models | undefined>(() => {
    if (initializing) {
      return undefined;
    }

    // models are ordered in priority order, pick the first one that is authenticated
    return enabledList.find((e) => e.isAuthenticated)?.model;
  }, [initializing, enabledList]);

  useEffect(() => {
    async function getUser() {
      try {
        const user = await chrome.auth.getUser();
        if (user) {
          setAuth({ user });
        }
      } catch {
        setAuth({ user: undefined });
      }
    }
    getUser();
  }, [chrome.auth.token]);
  if (!useChatBots) {
    return {
      initialModel: undefined,
      auth,
      initializing: false,
      enabledList: [{ isAuthenticated: false }, { isAuthenticated: false }, { isAuthenticated: false }],
    };
  }

  if (arhEnabled.loading || rhelLightspeedEnabled.loading || !auth) {
    return {
      initialModel: undefined,
      auth,
      initializing: true,
      enabledList: [{ isAuthenticated: false }, { isAuthenticated: false }, { isAuthenticated: false }],
    };
  }

  return { initialModel: model, auth, initializing, enabledList };
}

function useStateManager() {
  const asyncManagers = useAsyncManagers();
  const [isOpen, setOpen] = useState<boolean>(false);
  const { initialModel, auth, initializing, enabledList } = useInitialModel(asyncManagers);
  const [displayMode, setDisplayMode] = useState<ChatbotDisplayMode>(ChatbotDisplayMode.default);
  const arhManager = useArhClient();
  const rhelLightspeedManager = useRhelLightSpeedManager();
  const vaManager = useVaManager();
  const stateManagers = useMemo(() => {
    const managers = [arhManager, rhelLightspeedManager, vaManager, ...asyncManagers.managers.map(({ manager }) => manager)].filter(
      (_m, index) => enabledList[index].isAuthenticated
    );
    return managers;
  }, [initializing, asyncManagers, enabledList]);
  const [currentModel, setCurrentModel] = useState<Models | undefined>(initialModel);
  const isCompact = true;

  useEffect(() => {
    if (!initialModel) {
      setCurrentModel(undefined);
      return;
    }
    const manager = stateManagers.find((m) => m.model === initialModel);
    if (manager) {
      setCurrentModel(initialModel);
    }
  }, [initialModel, initializing]);

  const currentManager = useMemo(() => {
    if (!currentModel) {
      return undefined;
    }
    const manager = stateManagers.find((m) => m.model === currentModel);

    if (isOpen && manager && !manager.stateManager.isInitialized() && !manager.stateManager.isInitializing()) {
      manager.stateManager.init();
    }

    return manager;
  }, [isOpen, currentModel, stateManagers]);

  const chatbotProps: ChatbotProps = {
    user: auth.user,
    displayMode,
    setDisplayMode,
    setCurrentModel,
    model: currentModel,
    historyManagement: !!currentManager?.historyManagement,
    streamMessages: !!currentManager?.streamMessages,
    rootElementRef: { current: null },
    setConversationsDrawerOpened: () => undefined,
    setShowNewConversationWarning: () => undefined,
    showNewConversationWarning: false,
    setOpen,
    availableManagers: stateManagers,
    isCompact,
    handleNewChat: currentManager?.handleNewChat,
    FooterComponent: currentManager?.FooterComponent,
    MessageEntryComponent: currentManager?.MessageEntryComponent,
  };

  return {
    chatbotProps,
    isOpen,
    setOpen,
    stateManager: currentManager,
    initializing,
    model: currentModel,
  };
}

export default useStateManager;
