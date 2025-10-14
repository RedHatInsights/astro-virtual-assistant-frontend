import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { RHELLightspeedClient } from '@redhat-cloud-services/rhel-lightspeed-client';
import { useEffect, useMemo, useState } from 'react';
import { Models, StateManagerConfiguration, UseManagerHook } from './types';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';

export function useRhelLightSpeedAuthenticated() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
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
      console.error('Failed to check RHEL chatbot auth', error);
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
  };
}

function useRhelLightSpeedManager(): UseManagerHook {
  const { loading, isAuthenticated } = useRhelLightSpeedAuthenticated();
  const manager = useMemo(() => {
    const client = new RHELLightspeedClient({
      baseUrl: window.location.origin + '/api/lightspeed/v1',
      fetchFunction: (...args) => fetch(...args),
    });
    const stateManager = createClientStateManager(client);

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
      welcome: {
        buttons: [
          {
            title: 'How do I troubleshoot a RHEL system that is slow to boot?',
            value: 'How do I troubleshoot a RHEL system that is slow to boot?',
          },
          {
            title: 'Teach me tips on how to be more effective on the RHEL command line',
            value: 'Teach me tips on how to be more effective on the RHEL command line',
          },
          {
            title: 'What is an immutable file?',
            value: 'What is an immutable file?',
          },
        ],
      },
    };

    return configuration;
  }, []);

  if (loading) {
    return { manager: null, loading };
  }

  if (!isAuthenticated) {
    return { manager: null, loading: false };
  }

  return { manager, loading: false };
}

export default useRhelLightSpeedManager;
