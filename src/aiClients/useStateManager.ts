import { useEffect, useMemo, useRef } from 'react';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';
import { useRemoteHookManager } from '@scalprum/react-core';
import { matchPath, useLocation } from 'react-router-dom';
import { useFlag } from '@unleash/proxy-client-react';

import { StateManagerConfiguration, UseManagerHook } from './types';
import { useCurrentModel } from '../utils/VirtualAssistantStateSingleton';
import { ARH_DEFAULT_FLAG, MAO_ONLY_FLAG, VA_ENABLED_FLAG } from './flags';

function useAsyncManagers(): StateManagerConfiguration<IAIClient>[] | undefined {
  const { addHook, hookResults, cleanup } = useRemoteHookManager<UseManagerHook>();
  const arhDefaultFlag = useFlag(ARH_DEFAULT_FLAG);
  const maoOnlyFlag = useFlag(MAO_ONLY_FLAG);
  const vaEnabledFlag = useFlag(VA_ENABLED_FLAG);
  useEffect(() => {
    if (maoOnlyFlag) {
      // MAO-only mode: register only the MAS chatbot, hiding the dropdown
      addHook({
        scope: 'virtualAssistant',
        module: './useMasChatbot',
      });
      return cleanup;
    }

    if (vaEnabledFlag) {
      // VA available — arh-default controls VA vs ARH ordering
      if (arhDefaultFlag) {
        addHook({
          scope: 'virtualAssistant',
          module: './useArhChatbot',
        });
        addHook({
          scope: 'virtualAssistant',
          module: './useVaChatbot',
        });
      } else {
        addHook({
          scope: 'virtualAssistant',
          module: './useVaChatbot',
        });
        addHook({
          scope: 'virtualAssistant',
          module: './useArhChatbot',
        });
      }
    } else {
      // VA disabled — skip VA entirely (no client initialization).
      // Fallback priority: HCC AI, MAS, ARH.
      // arh-default does not override this priority.
      addHook({
        scope: 'virtualAssistant',
        module: './useHccAiChatbot',
      });
      addHook({
        scope: 'virtualAssistant',
        module: './useMasChatbot',
      });
      addHook({
        scope: 'virtualAssistant',
        module: './useArhChatbot',
      });
    }

    if (vaEnabledFlag) {
      // When VA is enabled, add remaining managers after VA/ARH
      addHook({
        scope: 'virtualAssistant',
        module: './useHccAiChatbot',
      });
      addHook({
        scope: 'virtualAssistant',
        module: './useMasChatbot',
      });
    }

    // RHEL Lightspeed always registered last — it is route-only
    // and must not become the general fallback
    addHook({
      scope: 'virtualAssistant',
      module: './useRhelChatbot',
    });
    return cleanup;
  }, [addHook, arhDefaultFlag, maoOnlyFlag, vaEnabledFlag]);

  return useMemo(() => {
    const passingResults = (hookResults || []).filter((r) => !r.error);

    if (passingResults.some(({ loading }) => loading) || passingResults.some(({ hookResult }) => hookResult?.loading)) {
      return undefined;
    }

    const managers = passingResults
      .filter(({ hookResult }) => !!hookResult?.manager)
      .map(({ hookResult }) => hookResult?.manager as StateManagerConfiguration<IAIClient>);

    return managers;
  }, [hookResults]);
}

function useStateManager(isOpen: boolean) {
  const wasOpenRef = useRef(isOpen);
  const managers = useAsyncManagers();
  const [currentModel, setCurrentModel] = useCurrentModel();

  const location = useLocation();

  useEffect(() => {
    if (!managers || managers.length === 0 || (currentModel && wasOpenRef.current)) {
      return;
    }
    if (!wasOpenRef.current && isOpen) {
      wasOpenRef.current = true;
    }

    const matchingManager = managers.find((manager) => manager.routes?.some((r) => matchPath({ path: r, end: true }, location.pathname)));
    const model = (matchingManager || managers[0]).model;
    setCurrentModel(model);
  }, [isOpen, managers, location.pathname]);

  useEffect(() => {
    if (!managers || managers.length === 0 || !currentModel) {
      return;
    }

    // Re-select when a previously-selected model is no longer available
    // (e.g. flag toggled, auth lost). Initial selection is handled above.
    const modelExists = managers.some((m) => m.model === currentModel);

    if (!modelExists) {
      setCurrentModel(managers[0].model);
    }
  }, [currentModel, managers, setCurrentModel]);

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
  }, [isOpen, currentManager]);

  return {
    managers,
    currentModel,
    setCurrentModel,
  };
}

export default useStateManager;
