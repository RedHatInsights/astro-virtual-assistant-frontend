import { useEffect, useMemo, useRef, useState } from 'react';
import { ClientAuthStatus, Models, StateManagerConfiguration } from './types';
import useArhClient, { useArhAuthenticated } from './useArhClient';
import useRhelLightSpeedManager, { useRhelLightSpeedAuthenticated } from './useRhelLightSpeedManager';
import { IToggle, useFlags } from '@unleash/proxy-client-react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import useVaManager, { useVaAuthenticated } from './useVaManager';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';

import { getModule } from '@scalprum/core';
import { AsyncStateManager } from '../asyncClientInit/types';
import { matchPath, useLocation } from 'react-router-dom';

// unleash does not expose the function to check if a flag is enabled outside of a React component
// so we need to implement a simple version here
function flagEnabled(flag: string | undefined, flags: IToggle[]): boolean {
  if (!flag) {
    return false;
  }
  const toggle = flags.find((f) => f.name === flag);
  return toggle ? toggle.enabled : false;
}

type ModelManager = {
  manager: StateManagerConfiguration<IAIClient>;
  auth: ClientAuthStatus;
};

function useAsyncManagers(): [ModelManager[], boolean] {
  const chrome = useChrome();
  const flags = useFlags();
  const [managers, setManagers] = useState<ModelManager[]>([]);
  const [loading, setIsLoading] = useState(true);
  const meta: { scope: string; module: string; flag?: string }[] = [
    { scope: 'assistedInstallerApp', module: './AsyncChatbot', flag: 'platform.chatbot.openshift-assisted-installer.enabled' },
  ];
  async function handleInitManagers() {
    const moduleResults = await Promise.allSettled(meta.map((m) => getModule<AsyncStateManager<IAIClient>>(m.scope, m.module)));
    const modules = moduleResults.reduce((acc, curr, idx) => {
      if (curr.status === 'rejected') {
        // Do not block the whole chatbot, log the error and continue
        console.error('Failed to load module', meta[idx], curr.reason);
        return acc;
      }
      acc.push(curr.value);
      return acc;
    }, [] as AsyncStateManager<IAIClient>[]);

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
    setManagers(managers.filter((m) => m !== null));
    setIsLoading(false);
  }
  useEffect(() => {
    handleInitManagers();
  }, [flags]);

  return [managers, loading];
}

function useStaticManagers(): ModelManager[] {
  const arhManager = useArhClient();
  const arhEnabled = useArhAuthenticated();
  const rhelLightspeedManager = useRhelLightSpeedManager();
  const rhelLightspeedEnabled = useRhelLightSpeedAuthenticated();
  const vaManager = useVaManager();
  const vaEnabled = useVaAuthenticated();

  return useMemo(
    () => [
      {
        manager: arhManager,
        auth: arhEnabled,
      },
      {
        manager: rhelLightspeedManager,
        auth: rhelLightspeedEnabled,
      },
      {
        manager: vaManager,
        auth: vaEnabled,
      },
    ],
    [arhManager, arhEnabled, rhelLightspeedManager, rhelLightspeedEnabled, vaManager, vaEnabled]
  );
}

function useManagers() {
  const [asyncManagers, loading] = useAsyncManagers();
  const staticManagers = useStaticManagers();

  return useMemo(() => {
    const allManagers = [...staticManagers, ...asyncManagers];
    if (loading || allManagers.some((m) => m.auth.loading)) {
      return undefined;
    }

    return allManagers.filter((m) => m.auth.isAuthenticated).map((m) => m.manager);
  }, [loading, asyncManagers, staticManagers]);
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
