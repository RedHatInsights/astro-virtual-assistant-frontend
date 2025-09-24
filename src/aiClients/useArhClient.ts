import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { IFDClient } from '@redhat-cloud-services/arh-client';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useEffect, useMemo, useState } from 'react';

import ARHChatbot from '../Components/ARHClient/ARHChatbot';
import { ClientAuthStatus, Models, StateManagerConfiguration } from './types';
import checkARHAuth from '../Components/ARHClient/checkARHAuth';

function useArhBaseUrl() {
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
  return ARHBaseUrl;
}

export function useArhAuthenticated(): ClientAuthStatus {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const chrome = useChrome();
  const ARHBaseUrl = useArhBaseUrl();

  async function handleArhSetup() {
    try {
      const user = await chrome.auth.getUser();
      if (user) {
        const isEntitled = await checkARHAuth(ARHBaseUrl, user, chrome.auth.token);
        setIsAuthenticated(isEntitled);
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
    handleArhSetup();
  }, [chrome.auth.token]);

  return {
    loading,
    isAuthenticated,
    error,
    model: Models.ASK_RED_HAT,
  };
}

function useArhClient(): StateManagerConfiguration<IFDClient> {
  const baseUrl = useArhBaseUrl();
  const chrome = useChrome();
  const stateManager = useMemo(() => {
    const client = new IFDClient({
      // Will change to ARH
      baseUrl,
      fetchFunction: async (input, options) => {
        const token = await chrome.auth.getToken();
        if (!token) {
          throw new Error('User is not authenticated');
        }
        return fetch(input, {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${token}`,
            'App-Source-ID': 'CPIN-001',
          },
        });
      },
    });
    const stateManager = createClientStateManager(client);
    return stateManager;
  }, [baseUrl]);

  const configuration: StateManagerConfiguration<IFDClient> = {
    model: Models.ASK_RED_HAT,
    historyManagement: true,
    streamMessages: true,
    modelName: 'Ask Red Hat',
    selectionTitle: 'General Red Hat (Default)',
    selectionDescription:
      'Find answers about Red Hat products, error messages, security vulnerabilities, general usage, and other content from product documentation and our knowledge base.',
    Component: ARHChatbot,
    stateManager,
    docsUrl:
      'https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/1-latest/html/getting_started_with_the_red_hat_hybrid_cloud_console/hcc-help-options_getting-started#ask-red-hat_getting-started',
    isPreview: true,
  };
  return configuration;
}

export default useArhClient;
