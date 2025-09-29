import { useEffect, useMemo, useState } from 'react';
import { ClientAuthStatus, Models, StateManagerConfiguration } from './types';
import { ChromeUser } from '@redhat-cloud-services/types';
import useArhClient, { useArhAuthenticated } from './useArhClient';
import useRhelLightSpeedManager, { useRhelLightSpeedAuthenticated } from './useRhelLightSpeedManager';
import { IToggle, useFlag, useFlags } from '@unleash/proxy-client-react';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { ChatbotProps } from '../Components/UniversalChatbot/UniversalChatbotProvider';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import useVaManager, { useVaAuthenticated } from './useVaManager';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';

import { getModule } from '@scalprum/core';
import { AsyncStateManager } from '../asyncClientInit/types';

// unleash does not expose the function to check if a flag is enabled outside of a React component
// so we need to implement a simple version here
function flagEnabled(flag: string | undefined, flags: IToggle[]): boolean {
  if (!flag) {
    return false;
  }
  const toggle = flags.find((f) => f.name === flag);
  return toggle ? toggle.enabled : false;
}

function useAsyncManagers() {
  const chrome = useChrome();
  const flags = useFlags();
  const [managers, setManagers] = useState<{
    loading: boolean;
    error: Error | null;
    managers: {
      manager: StateManagerConfiguration<IAIClient<Record<string, unknown>>>;
      auth: ClientAuthStatus;
    }[];
  }>({ managers: [], loading: true, error: null });
  const meta: { scope: string; module: string; flag?: string }[] = [
    { scope: 'assistedInstallerApp', module: './AsyncChatbot', flag: 'platform.chatbot.openshift-assisted-installer.enabled' },
  ];
  async function handleInitManagers() {
    const modules = await Promise.all(meta.map((m) => getModule<AsyncStateManager<IAIClient>>(m.scope, m.module)));
    const managers = await Promise.all(
      modules.map((asyncManager, index) => {
        const manager = asyncManager.getStateManager(chrome);
        const auth = asyncManager.isAuthenticated(chrome);
        const flag = meta[index].flag;

        return auth.then((auth) => {
          let internalAuth = auth;
          if (flag && !flagEnabled(flag, flags)) {
            internalAuth = { ...auth, isAuthenticated: false };
          }
          return { manager, auth: internalAuth };
        });
      })
    );
    setManagers({ managers: managers.filter((m) => m !== null), loading: false, error: null });
  }
  useEffect(() => {
    handleInitManagers();
  }, [flags]);

  return managers;
}

type AsyncManagers = ReturnType<typeof useAsyncManagers>;

const emptyEnabledMap: { [key in Models]: ClientAuthStatus } = {
  [Models.ASK_RED_HAT]: { model: Models.ASK_RED_HAT, loading: false, isAuthenticated: false },
  [Models.RHEL_LIGHTSPEED]: { model: Models.RHEL_LIGHTSPEED, loading: false, isAuthenticated: false },
  [Models.VA]: { model: Models.VA, loading: false, isAuthenticated: false },
  [Models.OAI]: { model: Models.OAI, loading: false, isAuthenticated: false },
};

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
  // for convenient access
  const enabledMap = useMemo<Partial<{ [key in Models]: ClientAuthStatus }>>(() => {
    const enabledMap: { [key in Models]?: ClientAuthStatus } = {
      [arhEnabled.model]: arhEnabled,
      [rhelLightspeedEnabled.model]: rhelLightspeedEnabled,
      [vaEnabled.model]: vaEnabled,
    };
    asyncManagers.managers.forEach(({ manager, auth }) => {
      enabledMap[manager.model] = auth;
    });
    return enabledMap;
  }, [asyncManagers, arhEnabled, rhelLightspeedEnabled, vaEnabled]);

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
      enabledMap: emptyEnabledMap,
    };
  }

  if (arhEnabled.loading || rhelLightspeedEnabled.loading || !auth) {
    return {
      initialModel: undefined,
      auth,
      initializing: true,
      enabledMap: emptyEnabledMap,
    };
  }

  return { initialModel: model, auth, initializing, enabledMap };
}

function useStateManager() {
  const asyncManagers = useAsyncManagers();
  const [isOpen, setOpen] = useState<boolean>(false);
  const { initialModel, auth, initializing, enabledMap } = useInitialModel(asyncManagers);
  const [displayMode, setDisplayMode] = useState<ChatbotDisplayMode>(ChatbotDisplayMode.default);
  const arhManager = useArhClient();
  const rhelLightspeedManager = useRhelLightSpeedManager();
  const vaManager = useVaManager();
  const stateManagers = useMemo(() => {
    const managers = [arhManager, rhelLightspeedManager, vaManager, ...asyncManagers.managers.map(({ manager }) => manager)].filter(
      (m) => enabledMap[m.model]?.isAuthenticated
    );
    return managers;
  }, [initializing, asyncManagers, enabledMap]);
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
    return stateManagers.find((m) => m.model === currentModel);
  }, [currentModel, stateManagers]);

  // Handle initialization in useEffect instead of useMemo to avoid side effects in render
  useEffect(() => {
    if (isOpen && currentManager && !currentManager.stateManager.isInitialized() && !currentManager.stateManager.isInitializing()) {
      // Only initialize when chatbot is opened and manager is selected
      try {
        currentManager.stateManager.init();
      } catch (e) {
        console.error('Failed to initialize state manager:', e);
      }
    }
  }, [isOpen, currentManager]);

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
    welcome: currentManager?.welcome,
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
