import { IAIClient } from '@redhat-cloud-services/ai-client-common';
import { AsyncStateManager } from '../asyncClientInit/types';
import { useMemo } from 'react';
import VAClient from '../aiClients/vaClient';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import VAMessageEntry from '../Components/VAClient/VAMessageEntry';
import { AsyncStateManagerConfiguration } from '../aiClients/types';

const VaChatbot: AsyncStateManager<IAIClient> = {
  useStateManager: (): AsyncStateManagerConfiguration<VAClient> => {
    return useMemo(() => {
      const client = new VAClient();
      const stateManager = createClientStateManager(client);
      return {
        stateManager,
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
    }, []);
  },

  useIsAuthenticated: () => {
    // VA does not have restrictions
    return useMemo(
      () => ({
        loading: false,
        isAuthenticated: true,
      }),
      []
    );
  },
};

export default VaChatbot;
