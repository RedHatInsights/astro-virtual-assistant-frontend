import { useEffect, useMemo, useRef, useState } from 'react';
import { ClientAuthStatus, Models, StateManagerConfiguration } from './types';
import { useFlag } from '@unleash/proxy-client-react';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';

import { useRemoteHook } from '@scalprum/react-core';
import { matchPath, useLocation } from 'react-router-dom';

type ChatbotHookResult = [StateManagerConfiguration<IAIClient> | undefined, boolean];

const useChatbotManager = (
  managerProps: { scope: string; module: string; importName?: string | undefined },
  authProps: { scope: string; module: string; importName?: string | undefined }
): ChatbotHookResult => {
  const managerHook = useRemoteHook<StateManagerConfiguration<IAIClient>>(managerProps);
  const authHook = useRemoteHook<ClientAuthStatus>(authProps);

  return useMemo(() => {
    if (managerHook.error || authHook.error) {
      console.error('Failed to load chatbot ', managerProps, authProps, managerHook.error || authHook.error);
      return [undefined, false];
    }

    if (managerHook.loading || authHook.loading || !authHook.hookResult || authHook.hookResult.loading) {
      return [undefined, true];
    }

    if (authHook.hookResult.error) {
      console.error('Failed to auth chatbot ', authProps, authHook.hookResult.error);
      return [undefined, false];
    }

    return [authHook.hookResult.isAuthenticated ? managerHook.hookResult : undefined, false];
  }, [managerHook, authHook]);
};

function useManagers() {
  const [arhManager, arhLoading] = useChatbotManager(
    {
      scope: 'virtualAssistant',
      module: './useArhChatbot',
    },
    {
      scope: 'virtualAssistant',
      module: './useArhChatbot',
      importName: 'useArhAuthenticated',
    }
  );

  const [rhelManager, rhelLoading] = useChatbotManager(
    {
      scope: 'virtualAssistant',
      module: './useRhelChatbot',
    },
    {
      scope: 'virtualAssistant',
      module: './useRhelChatbot',
      importName: 'useRhelLightSpeedAuthenticated',
    }
  );

  const [vaManager, vaLoading] = useChatbotManager(
    {
      scope: 'virtualAssistant',
      module: './useVaChatbot',
    },
    {
      scope: 'virtualAssistant',
      module: './useVaChatbot',
      importName: 'useVaAuthenticated',
    }
  );

  const aiEnabled = useFlag('platform.chatbot.openshift-assisted-installer.enabled');
  const [aiManager, aiLoading] = useChatbotManager(
    {
      scope: 'assistedInstallerApp',
      module: './useAsyncChatbot',
    },
    {
      scope: 'assistedInstallerApp',
      module: './useAsyncChatbot',
      importName: 'useIsAuthenticated',
    }
  );

  return useMemo(() => {
    if ((aiEnabled ? aiLoading : false) || arhLoading || rhelLoading || vaLoading) {
      return undefined;
    }

    const managers: StateManagerConfiguration<IAIClient>[] = [];
    if (arhManager) {
      managers.push(arhManager);
    }
    if (rhelManager) {
      managers.push(rhelManager);
    }
    if (vaManager) {
      managers.push(vaManager);
    }
    if (aiEnabled && aiManager) {
      managers.push(aiManager);
    }
    return managers.length ? managers : undefined;
  }, [aiEnabled, aiLoading, aiManager, arhLoading, arhManager, rhelLoading, rhelManager, vaLoading, vaManager]);
}

function useStateManager(isOpen: boolean) {
  const wasOpenRef = useRef(isOpen);
  const managers = useManagers();
  const [currentModel, setCurrentModel] = useState<Models>();

  const location = useLocation();

  useEffect(() => {
    if (!managers || (currentModel && wasOpenRef.current)) {
      return;
    }
    if (!wasOpenRef.current && isOpen) {
      wasOpenRef.current = true;
    }

    const matchingManager = managers.find((manager) => manager.routes?.some((r) => matchPath({ path: r, end: true }, location.pathname)));
    const model = (matchingManager || managers[0]).model;
    setCurrentModel(model);
  }, [isOpen, currentModel, managers, location.pathname]);

  const currentManager = currentModel && managers ? managers.find((m) => m.model === currentModel) : undefined;

  useEffect(() => {
    if (isOpen && currentManager && !currentManager.stateManager.isInitialized() && !currentManager.stateManager.isInitializing()) {
      // Only initialize when chatbot is opened and manager is selected
      try {
        currentManager.stateManager.init();
      } catch (e) {
        console.error('Failed to initialize state manager:', e);
      }
    }
  }, [currentManager]);

  return {
    managers,
    currentModel,
    setCurrentModel,
  };
}

export default useStateManager;
