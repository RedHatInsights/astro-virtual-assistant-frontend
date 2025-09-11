import { useEffect, useMemo, useState } from 'react';
import { Models } from './types';
import { ChromeUser } from '@redhat-cloud-services/types';
import useArhClient, { useArhAuthenticated } from './useArhClient';
import useRhelLightSpeedManager, { useRhelLightSpeedAuthenticated } from './useRhelLightSpeedManager';
import { useFlag } from '@unleash/proxy-client-react';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { ChatbotProps } from '../Components/UniversalChatbot/UniversalChatbotProvider';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import useVaManager, { useVaAuthenticated } from './useVaManager';

function useInitialModel() {
  // Use ARH used as a generic "show chatbot" flag
  const useChatBots = useFlag('platform.arh.enabled');
  const arhEnabled = useArhAuthenticated();
  const rhelLightspeedEnabled = useRhelLightSpeedAuthenticated();
  const vaEnabled = useVaAuthenticated();
  const chrome = useChrome();
  const [auth, setAuth] = useState<{ user: ChromeUser | undefined }>({ user: undefined });

  const enabledList = [arhEnabled, rhelLightspeedEnabled, vaEnabled];

  const initializing = enabledList.some((e) => e.loading);
  const model = useMemo<Models | undefined>(() => {
    if (initializing) {
      return undefined;
    }

    // models are ordered in priority order, pick the first one that is authenticated
    return enabledList.find((e) => e.isAuthenticated)?.model;
  }, [initializing]);

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

  if (arhEnabled.loading || rhelLightspeedEnabled.loading || !auth) {
    return { initialModel: undefined, auth, initializing: true };
  }

  return { initialModel: model, auth, initializing };
}

function useStateManager() {
  const [isOpen, setOpen] = useState<boolean>(false);
  const { initialModel, auth, initializing } = useInitialModel();
  const [displayMode, setDisplayMode] = useState<ChatbotDisplayMode>(ChatbotDisplayMode.default);
  const arhManager = useArhClient();
  const rhelLightspeedManager = useRhelLightSpeedManager();
  const vaManager = useVaManager();
  const stateManagers = useMemo(() => {
    const managers = [arhManager, rhelLightspeedManager, vaManager];
    return managers;
  }, [initializing]);
  const [currentModel, setCurrentModel] = useState<Models | undefined>(initialModel);

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
