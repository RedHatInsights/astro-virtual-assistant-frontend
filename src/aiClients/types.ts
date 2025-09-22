import { StateManager } from '@redhat-cloud-services/ai-client-state';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';

export type ModelsSelection = {
  activeModel: string;
  setActiveModel: (model: string) => void;
  availableModels: string[];
};

export type AsyncStateManagerConfiguration<S extends IAIClient> = {
  historyManagement: boolean;
  streamMessages: boolean;
  modelName: string;
  docsUrl: string;
  selectionTitle: string;
  selectionDescription: React.ReactNode;
  stateManager: StateManager<Record<string, unknown>, S>;
  handleNewChat?: (toggleDrawer: (isOpen: boolean) => void) => void;
  MessageEntryComponent?: React.ComponentType<any>;
  FooterComponent?: React.ComponentType<any>;
};

export type ClientAuthStatus = {
  loading: boolean;
  isAuthenticated: boolean;
  error?: Error;
};
