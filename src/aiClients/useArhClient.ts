import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { IFDClient } from '@redhat-cloud-services/arh-client';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useMemo } from 'react';
import ARHChatbot from '../Components/ARHClient/ARHChatbot';
import { Models, StateManagerConfiguration } from './types';

function useArhClient({ baseUrl }: { baseUrl: string }): StateManagerConfiguration<IFDClient> {
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
    selectionDescription: 'Ask Red Hat',
    Component: ARHChatbot,
    stateManager,
  };
  return configuration;
}

export default useArhClient;
