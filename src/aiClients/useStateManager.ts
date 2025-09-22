import { useEffect, useMemo, useState } from 'react';
import { AsyncStateManagerConfiguration, ClientAuthStatus } from './types';
import { ChromeUser } from '@redhat-cloud-services/types';
import { useFlag } from '@unleash/proxy-client-react';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { ChatbotProps } from '../Components/UniversalChatbot/UniversalChatbotProvider';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';

import { getModule } from '@scalprum/core';
import { AsyncStateManager } from '../asyncClientInit/types';

type AsyncManager = {
  id: string;
  manager: AsyncStateManager<IAIClient<Record<string, unknown>>>;
};

export function useAsyncManagers() {
  const [managers, setManagers] = useState<{
    loading: boolean;
    error: Error | null;
    managers: AsyncManager[];
  }>({ managers: [], loading: true, error: null });
  const meta: { scope: string; module: string }[] = [
    { scope: 'virtualAssistant', module: './ArhChatbot' },
    { scope: 'virtualAssistant', module: './RhelLightSpeedChatbot' },
    { scope: 'virtualAssistant', module: './VaChatbot' },
    { scope: 'assistedInstallerApp', module: './AsyncLSC' },
  ];
  async function handleInitManagers() {
    const modules = await Promise.allSettled(meta.map((m) => getModule<AsyncStateManager<IAIClient>>(m.scope, m.module)));
    const managers = modules.reduce((acc, moduleResult, idx) => {
      if (moduleResult.status === 'fulfilled') {
        acc.push({
          id: `${meta[idx].scope}-${meta[idx].module}`,
          manager: moduleResult.value,
        });
      } else {
        console.log('failed to fetch async manager', meta);
      }
      return acc;
    }, [] as AsyncManager[]);

    setManagers({ managers, loading: false, error: null });
  }
  useEffect(() => {
    handleInitManagers();
  }, []);

  return managers;
}

function useInitialModel(asyncManagers: AsyncManagersMap) {
  // Use ARH used as a generic "show chatbot" flag
  const useChatBots = useFlag('platform.arh.enabled');
  const chrome = useChrome();
  const [auth, setAuth] = useState<{ user: ChromeUser | undefined }>({ user: undefined });

  const initializing = !Object.values(asyncManagers).length || Object.values(asyncManagers).some(({ authStatus }) => authStatus.loading);
  const model = useMemo<string | undefined>(() => {
    if (initializing) {
      return undefined;
    }

    // models are ordered in priority order, pick the first one that is authenticated
    return Object.keys(asyncManagers).find((id) => asyncManagers[id].authStatus.isAuthenticated);
  }, [initializing, asyncManagers]);

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
    return { initialModel: undefined, auth, initializing: false };
  }

  return { initialModel: model, auth, initializing };
}

export type AsyncManagersMap = {
  [key: string]: {
    stateManager: AsyncStateManagerConfiguration<any>;
    authStatus: ClientAuthStatus;
  };
};

function useStateManager() {
  const [asyncManagers, setAsyncManagers] = useState<AsyncManagersMap>({});
  const [isOpen, setOpen] = useState<boolean>(false);
  const { initialModel, auth, initializing } = useInitialModel(asyncManagers);
  const [displayMode, setDisplayMode] = useState<ChatbotDisplayMode>(ChatbotDisplayMode.default);
  const [currentModel, setCurrentModel] = useState<string | undefined>(initialModel);

  useEffect(() => {
    if (!initialModel) {
      setCurrentModel(undefined);
      return;
    }
    const manager = Object.keys(asyncManagers).find((id) => id === initialModel);
    if (manager) {
      setCurrentModel(initialModel);
    }
  }, [initialModel, initializing]);

  const currentManager = useMemo(() => {
    if (!currentModel) {
      return undefined;
    }
    const manager = Object.keys(asyncManagers).find((id) => id === currentModel);

    if (
      isOpen &&
      manager &&
      !asyncManagers[manager].stateManager.stateManager.isInitialized() &&
      !asyncManagers[manager].stateManager.stateManager.isInitializing()
    ) {
      asyncManagers[manager].stateManager.stateManager.init();
    }

    return manager ? asyncManagers[manager].stateManager : undefined;
  }, [isOpen, currentModel, asyncManagers]);

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
    availableManagers: asyncManagers,
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
    setAsyncManagers,
  };
}

export default useStateManager;
