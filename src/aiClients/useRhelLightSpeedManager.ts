import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { RHELLightspeedClient } from '@redhat-cloud-services/rhel-lightspeed-client';
import { useMemo } from 'react';
import { Models, StateManagerConfiguration } from './types';
import RHELChatBot from '../Components/RhelClient/RhelChatBot';

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
