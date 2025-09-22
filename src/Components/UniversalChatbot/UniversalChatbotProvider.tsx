import React, { Dispatch, PropsWithChildren } from 'react';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { ChromeUser } from '@redhat-cloud-services/types';

import { AsyncManagersMap } from '../../aiClients/useStateManager';

export type UniversalChatbotContextType = {
  model?: string;
  setCurrentModel: (model: string) => void;
  showNewConversationWarning: boolean;
  setConversationsDrawerOpened: Dispatch<React.SetStateAction<boolean>>;
  setShowNewConversationWarning: Dispatch<React.SetStateAction<boolean>>;
  rootElementRef: React.RefObject<HTMLDivElement>;
  availableManagers: AsyncManagersMap;
};

export type ChatbotProps = {
  setOpen: (isOpen: boolean) => void;
  user?: ChromeUser;
  historyManagement: boolean;
  streamMessages: boolean;
  displayMode: ChatbotDisplayMode;
  setDisplayMode: React.Dispatch<React.SetStateAction<ChatbotDisplayMode>>;
  handleNewChat?: (toggleDrawer: (isOpen: boolean) => void) => void;
  MessageEntryComponent?: React.ComponentType<any>;
  FooterComponent?: React.ComponentType<any>;
} & UniversalChatbotContextType;

export const UniversalChatbotContext = React.createContext<UniversalChatbotContextType>({
  showNewConversationWarning: false,
  setCurrentModel: () => undefined,
  setConversationsDrawerOpened: () => undefined,
  rootElementRef: React.createRef<HTMLDivElement>(),
  setShowNewConversationWarning: () => undefined,
  availableManagers: {},
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
