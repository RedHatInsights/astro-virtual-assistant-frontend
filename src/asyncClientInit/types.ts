import { ChromeAPI } from '@redhat-cloud-services/types';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';

import { ClientAuthStatus, StateManagerConfiguration } from '../aiClients/types';

declare class AsyncStateManager<S extends IAIClient> {
  isAuthenticated(chrome: ChromeAPI): Promise<ClientAuthStatus>;
  getStateManager(chrome: ChromeAPI): StateManagerConfiguration<S>;
}

export { AsyncStateManager };
