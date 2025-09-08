import { StateManager } from '@redhat-cloud-services/ai-client-state';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';
import { ChatbotProps } from '../Components/UniversalChatbot/UniversalChatbotProvider';

export enum Models {
  ASK_RED_HAT = 'Ask Red Hat',
  RHEL_LIGHTSPEED = 'RHEL LightSpeed',
  VA = 'Virtual Assistant',
  OAI = 'OpenShift assisted Installer',
}

export type ModelsSelection = {
  activeModel: Models;
  setActiveModel: (model: Models) => void;
  availableModels: Models[];
};

export function isModels(value?: string | number): value is Models {
  if (typeof value === 'number') {
    return false;
  }
  return Object.values(Models).includes(value as Models);
}

export type StateManagerConfiguration<S extends IAIClient> = {
  model: Models;
  historyManagement: boolean;
  streamMessages: boolean;
  modelName: string;
  docsUrl: string;
  selectionTitle: string;
  selectionDescription: string;
  stateManager: StateManager<Record<string, unknown>, S>;
  handleNewChat?: (toggleDrawer: (isOpen: boolean) => void) => void;
  MessageEntryComponent?: React.ComponentType<any>;
  FooterComponent?: React.ComponentType<any>;
};

export type ClientAuthStatus = {
  loading: boolean;
  isAuthenticated: boolean;
  error?: Error;
  model: Models;
};
