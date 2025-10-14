import { useEffect, useMemo, useRef, useState } from 'react';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';
import { useRemoteHookManager } from '@scalprum/react-core';
import { matchPath, useLocation } from 'react-router-dom';

import { Models, StateManagerConfiguration, UseManagerHook } from './types';

function useAsyncManagers(): StateManagerConfiguration<IAIClient>[] | undefined {
  const { addHook, hookResults, cleanup } = useRemoteHookManager<UseManagerHook>();
  useEffect(() => {
    addHook({
      scope: 'virtualAssistant',
      module: './useArhChatbot',
    });
    addHook({
      scope: 'virtualAssistant',
      module: './useRhelChatbot',
    });
    addHook({
      scope: 'virtualAssistant',
      module: './useVaChatbot',
    });
    addHook({
      scope: 'assistedInstallerApp',
      module: './useAsyncChatbot',
    });
    return cleanup;
  }, [addHook]);

  return useMemo(() => {
    const passingResults = (hookResults || []).filter((r) => !r.error);

    if (passingResults.some(({ loading }) => loading) || passingResults.some(({ hookResult }) => hookResult?.loading)) {
      return undefined;
    }

    const managers = passingResults
      .filter(({ hookResult }) => !!hookResult?.manager)
      .map(({ hookResult }) => hookResult?.manager as StateManagerConfiguration<IAIClient>);

    // we need at least one manager
    return managers.length ? managers : undefined;
  }, [hookResults]);
}

function useStateManager(isOpen: boolean) {
  const wasOpenRef = useRef(isOpen);
  const managers = useAsyncManagers();
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
