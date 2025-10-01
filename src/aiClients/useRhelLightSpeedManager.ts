import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { RHELLightspeedClient } from '@redhat-cloud-services/rhel-lightspeed-client';
import { useEffect, useMemo, useState } from 'react';
import { ClientAuthStatus, Models, StateManagerConfiguration } from './types';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';

export function useRhelLightSpeedAuthenticated(): ClientAuthStatus {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const chrome = useChrome();
  const isEnabled = useFlag('platform.chatbot.rhel-lightspeed.enabled');

  async function handleRhelLightSpeedSetup() {
    if (!isEnabled) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    try {
      const user = await chrome.auth.getUser();
      if (user) {
        // only users with RHEL subs can use RHEL Lightspeed
        // otherwise API will return 403/401
        setIsAuthenticated(!!user.entitlements?.['rhel']?.is_entitled);
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
  }, [chrome.auth.token, isEnabled]);

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
    modelName: 'RHEL Lightspeed',
    selectionTitle: 'RHEL Lightspeed',
    selectionDescription:
      'Get answers to RHEL-related questions, support with troubleshooting, help understanding log files, ask for recommendations, and more.',
    stateManager,
    docsUrl:
      'https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/interacting_with_the_command-line_assistant_powered_by_rhel_lightspeed/introducing-rhel-lightspeed-for-rhel-systems',
  };

  return configuration;
}

export default useRhelLightSpeedManager;
