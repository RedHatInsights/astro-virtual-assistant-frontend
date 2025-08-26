import { useEffect, useMemo, useState } from 'react';
import { Models } from './types';
import useArhClient from './useArhClient';
import useRhelLightSpeedManager from './useRhelLightSpeedManager';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { ChromeUser } from '@redhat-cloud-services/types';
import { useFlag } from '@unleash/proxy-client-react';
import checkARHAuth from '../Components/ARHClient/checkARHAuth';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { ChatbotProps } from '../Components/UniversalChatbot/UniversalChatbotProvider';

function useInitialModel() {
  // Use ARH used as a generic "show chatbot" flag
  const useArh = useFlag('platform.arh.enabled');
  const [showArh, setShowArh] = useState<boolean>(false);
  const [auth, setAuth] = useState<{ user: ChromeUser | undefined }>({ user: undefined });
  const [initializing, setInitializing] = useState(true);
  const chrome = useChrome();
  const ARHBaseUrl = useMemo(() => {
    // currently we are only allowed to talk to stage
    // we need KC deployed to accept new scope
    // FF is disabled for now in production/dev envs
    if (['prod', 'dev'].includes(chrome.getEnvironment())) {
      return 'https://access.redhat.com';
    }
    return 'https://access.stage.redhat.com';
  }, []);

  async function handleArhSetup() {
    try {
      if (!useArh) {
        setShowArh(false);
        setAuth({ user: undefined });
        return;
      }
      const user = await chrome.auth.getUser();
      if (user) {
        const isEntitled = await checkARHAuth(ARHBaseUrl, user, chrome.auth.token);
        setShowArh(isEntitled);
        setAuth({ user });
      } else {
        setShowArh(false);
        setAuth({ user: undefined });
      }
    } catch (error) {
      setShowArh(false);
    } finally {
      setInitializing(false);
    }
  }

  useEffect(() => {
    handleArhSetup();
  }, [useArh, chrome.auth.token]);
  if (!useArh) {
    return { model: undefined, auth, initializing: false, ARHBaseUrl, showArh: false };
  }

  return { model: showArh ? Models.ASK_RED_HAT : Models.RHEL_LIGHTSPEED, auth, initializing, ARHBaseUrl, showArh };
}

function useStateManager() {
  const [isOpen, setOpen] = useState<boolean>(false);
  const { model, auth, initializing, ARHBaseUrl, showArh } = useInitialModel();
  const [displayMode, setDisplayMode] = useState<ChatbotDisplayMode>(ChatbotDisplayMode.default);
  const arhManager = useArhClient({ baseUrl: ARHBaseUrl });
  const rhelLightspeedManager = useRhelLightSpeedManager();
  const stateManagers = useMemo(() => {
    const managers = [arhManager, rhelLightspeedManager];
    return managers;
  }, [initializing]);
  const [currentModel, setCurrentModel] = useState<Models | undefined>(model);

  useEffect(() => {
    if (!model) {
      return;
    }
    // do not initialize ARH if its not allowed
    if (model === Models.ASK_RED_HAT && !showArh) {
      return;
    }
    const manager = stateManagers.find((m) => m.model === model);
    if (manager) {
      setCurrentModel(model);
      if (!manager.stateManager.isInitialized() && !manager.stateManager.isInitializing()) {
        manager.stateManager.init();
      }
    }
  }, [model, initializing, showArh]);

  const currentManager = useMemo(() => {
    if (!currentModel) {
      return undefined;
    }
    return stateManagers.find((m) => m.model === currentModel);
  }, [currentModel, stateManagers]);

  const chatbotProps: ChatbotProps = {
    user: auth.user!,
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
