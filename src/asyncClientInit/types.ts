import { IAIClient } from '@redhat-cloud-services/ai-client-common';

import { AsyncStateManagerConfiguration, ClientAuthStatus } from '../aiClients/types';

type AsyncStateManager<S extends IAIClient> = {
  useIsAuthenticated: () => ClientAuthStatus;
  useStateManager: () => AsyncStateManagerConfiguration<S>;
};

export { type AsyncStateManager };
