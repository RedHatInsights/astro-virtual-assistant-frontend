import React, { Dispatch, PropsWithChildren } from 'react';
import { IFDClient } from '@redhat-cloud-services/arh-client';
import { RHELLightspeedClient } from '@redhat-cloud-services/rhel-lightspeed-client';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { ChromeUser } from '@redhat-cloud-services/types';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';

import { Models, StateManagerConfiguration, WelcomeConfig } from '../../aiClients/types';

export type ModelToClient = {
  [Models.ASK_RED_HAT]: IFDClient;
  [Models.RHEL_LIGHTSPEED]: RHELLightspeedClient;
};

export type UniversalChatbotContextType = {
  model?: Models;
  setCurrentModel: (model: Models) => void;
  showNewConversationWarning: boolean;
  setConversationsDrawerOpened: Dispatch<React.SetStateAction<boolean>>;
  setShowNewConversationWarning: Dispatch<React.SetStateAction<boolean>>;
  rootElementRef: React.RefObject<HTMLDivElement>;
  availableManagers: StateManagerConfiguration<IAIClient>[];
};

export type ChatbotProps = {
  setOpen: (isOpen: boolean) => void;
  user?: ChromeUser;
  historyManagement: boolean;
  streamMessages: boolean;
  displayMode: ChatbotDisplayMode;
  isCompact?: boolean;
  setDisplayMode: React.Dispatch<React.SetStateAction<ChatbotDisplayMode>>;
  handleNewChat?: (toggleDrawer: (isOpen: boolean) => void) => void;
  MessageEntryComponent?: React.ComponentType<any>;
  FooterComponent?: React.ComponentType<any>;
  welcome?: WelcomeConfig;
} & UniversalChatbotContextType;

export const UniversalChatbotContext = React.createContext<UniversalChatbotContextType>({
  showNewConversationWarning: false,
  model: Models.ASK_RED_HAT,
  setCurrentModel: () => undefined,
  setConversationsDrawerOpened: () => undefined,
  rootElementRef: React.createRef<HTMLDivElement>(),
  setShowNewConversationWarning: () => undefined,
  availableManagers: [],
});

const UniversalChatbotProvider = ({
  children,
  model,
  setCurrentModel,
  setConversationsDrawerOpened,
  rootElementRef,
  showNewConversationWarning,
  setShowNewConversationWarning,
  availableManagers,
}: PropsWithChildren<UniversalChatbotContextType>) => {
  return (
    <UniversalChatbotContext.Provider
      value={{
        model,
        setCurrentModel,
        setConversationsDrawerOpened,
        rootElementRef,
        showNewConversationWarning,
        setShowNewConversationWarning,
        availableManagers,
      }}
    >
      {children}
    </UniversalChatbotContext.Provider>
  );
};

export default UniversalChatbotProvider;
