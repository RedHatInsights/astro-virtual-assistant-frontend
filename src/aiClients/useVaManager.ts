import { useMemo } from 'react';
import { ClientAuthStatus, Models, StateManagerConfiguration } from './types';
import VAClient from './vaClient';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import VAMessageEntry from '../Components/VAClient/VAMessageEntry';

export function useVaAuthenticated(): ClientAuthStatus {
  // VA does not have restrictions
  return {
    loading: false,
    isAuthenticated: true,
    model: Models.VA,
  };
}

export default function useVaManager(): StateManagerConfiguration<VAClient> {
  const stateManager = useMemo(() => {
    const client = new VAClient();
    const stateManager = createClientStateManager(client);
    return stateManager;
  }, []);

  return {
    stateManager,
    model: Models.VA,
    historyManagement: false,
    docsUrl:
      'https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/1-latest/html/getting_started_with_the_red_hat_hybrid_cloud_console/hcc-help-options_getting-started#virtual-assistant_getting-started',
    streamMessages: false,
    modelName: 'Virtual Assistant',
    selectionTitle: 'Hybrid Cloud Core console',
    selectionDescription:
      'Update your personal information, request access from your admin, show critical vulnerabilities, get Advisor recommendations, and more.',
    MessageEntryComponent: VAMessageEntry,
  };
}
