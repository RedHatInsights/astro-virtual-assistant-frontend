import { IAIClient } from '@redhat-cloud-services/ai-client-common';
import { AsyncStateManager } from '../asyncClientInit/types';
import { useEffect, useMemo, useState } from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { RHELLightspeedClient } from '@redhat-cloud-services/rhel-lightspeed-client';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { AsyncStateManagerConfiguration } from '../aiClients/types';

const RhelLightSpeedChatbot: AsyncStateManager<IAIClient> = {
  useStateManager: (): AsyncStateManagerConfiguration<RHELLightspeedClient> => {
    return useMemo(() => {
      const client = new RHELLightspeedClient({
        baseUrl: window.location.origin + '/api/lightspeed/v1',
        fetchFunction: (...args) => fetch(...args),
      });
      const stateManager = createClientStateManager(client);

      const configuration: AsyncStateManagerConfiguration<RHELLightspeedClient> = {
        historyManagement: false,
        streamMessages: false,
        modelName: 'RHEL LightSpeed',
        selectionTitle: 'RHEL LightSpeed',
        selectionDescription:
          'Gen answers to RHEL-related questions, support with troubleshooting, help understanding log files, ask for recommendations, and more.',
        stateManager,
        docsUrl:
          'https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/interacting_with_the_command-line_assistant_powered_by_rhel_lightspeed/introducing-rhel-lightspeed-for-rhel-systems',
      };

      return configuration;
    }, []);
  },

  useIsAuthenticated: () => {
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

    return useMemo(
      () => ({
        loading,
        isAuthenticated,
        error,
      }),
      [loading, isAuthenticated, error]
    );
  },
};

export default RhelLightSpeedChatbot;
