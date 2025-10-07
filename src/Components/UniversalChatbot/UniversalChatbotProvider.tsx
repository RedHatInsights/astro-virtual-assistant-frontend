import React, { Dispatch, PropsWithChildren } from 'react';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';

import { Models, StateManagerConfiguration } from '../../aiClients/types';

export type UniversalChatbotContextType = {
  currentModel?: Models;
  setCurrentModel: (model: Models) => void;
  showNewConversationWarning: boolean;
  setConversationsDrawerOpened: Dispatch<React.SetStateAction<boolean>>;
  setShowNewConversationWarning: Dispatch<React.SetStateAction<boolean>>;
  rootElementRef: React.RefObject<HTMLDivElement>;
  managers: StateManagerConfiguration<IAIClient>[] | undefined;
};

export type ChatbotProps = {
  setOpen: (isOpen: boolean) => void;
} & Pick<UniversalChatbotContextType, 'currentModel' | 'managers' | 'setCurrentModel'>;

export const UniversalChatbotContext = React.createContext<UniversalChatbotContextType>({
  showNewConversationWarning: false,
  currentModel: Models.ASK_RED_HAT,
  setCurrentModel: () => undefined,
  setConversationsDrawerOpened: () => undefined,
  rootElementRef: React.createRef<HTMLDivElement>(),
  setShowNewConversationWarning: () => undefined,
  managers: undefined,
});

const UniversalChatbotProvider = ({
  children,
  currentModel,
  setCurrentModel,
  setConversationsDrawerOpened,
  rootElementRef,
  showNewConversationWarning,
  setShowNewConversationWarning,
  managers,
}: PropsWithChildren<UniversalChatbotContextType>) => {
  return (
    <UniversalChatbotContext.Provider
      value={{
        currentModel,
        setCurrentModel,
        setConversationsDrawerOpened,
        rootElementRef,
        showNewConversationWarning,
        setShowNewConversationWarning,
        managers,
      }}
    >
      {children}
    </UniversalChatbotContext.Provider>
  );
};

export default UniversalChatbotProvider;
