import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { IFDClient } from '@redhat-cloud-services/arh-client';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useEffect, useMemo, useState } from 'react';

function useArhClient(baseUrl: string, useArh = false) {
  const [chatbotAccessed, setChatbotAccessed] = useState(false);
  const [arhInitialized, setArhInitialized] = useState(false);
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

  useEffect(() => {
    if (useArh && chatbotAccessed && !arhInitialized) {
      setArhInitialized(true);
      stateManager.init().catch(() => {
        setArhInitialized(false);
      });
    }
  }, [chatbotAccessed, useArh, arhInitialized]);

  return { stateManager, setChatbotAccessed };
}

export default useArhClient;
