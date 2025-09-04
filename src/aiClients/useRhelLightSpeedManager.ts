import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { RHELLightspeedClient } from '@redhat-cloud-services/rhel-lightspeed-client';
import { useEffect, useMemo, useState } from 'react';
import { Models, StateManagerConfiguration } from './types';
import RHELChatBot from '../Components/RhelClient/RhelChatBot';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

export function useRhelLightSpeedAuthenticated(): {
  loading: boolean;
  isAuthenticated: boolean;
  error?: Error;
  model: Models;
} {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const chrome = useChrome();

  async function handleRhelLightSpeedSetup() {
    try {
      const user = await chrome.auth.getUser();
      if (user) {
        // only users with RHEL subs can use RHEL LightSpeed
        // otherwise API will return 403/401
        setIsAuthenticated(!!user.entitlements['rhel']?.is_entitled);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
      if (error instanceof Error) {
        setError(error);
      } else if (typeof error === 'string') {
        setError(new Error(error));
      } else {
        setError(new Error('An unknown error occurred'));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleRhelLightSpeedSetup();
  }, [chrome.auth.token]);

  return {
    loading,
    isAuthenticated,
    error,
    model: Models.RHEL_LIGHTSPEED,
  };
}

function useRhelLightSpeedManager(): StateManagerConfiguration<RHELLightspeedClient> {
  const stateManager = useMemo(() => {
    const client = new RHELLightspeedClient({
      baseUrl: window.location.origin + '/api/lightspeed/v1',
      fetchFunction: (...args) => fetch(...args),
    });
    const stateManager = createClientStateManager(client);
    return stateManager;
  }, []);

  const configuration: StateManagerConfiguration<RHELLightspeedClient> = {
    model: Models.RHEL_LIGHTSPEED,
    historyManagement: false,
    streamMessages: false,
    modelName: 'RHEL LightSpeed',
    selectionTitle: 'RHEL LightSpeed',
    selectionDescription: 'Interact with RHEL LightSpeed',
    Component: RHELChatBot,
    stateManager,
  };

  return configuration;
}

export default useRhelLightSpeedManager;
