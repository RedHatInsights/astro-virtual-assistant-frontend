import React, { useMemo } from 'react';
import { ChatbotFooter, ChatbotFootnote, MessageBar } from '@patternfly/chatbot';
import { useActiveConversation, useInProgress, useInitLimitation, useSendMessage } from '@redhat-cloud-services/ai-react-state';
import { FooterComponentProps } from '../../aiClients/types';
import { useMessage } from '../../utils/VirtualAssistantStateSingleton';

const UniversalFooter = ({ streamMessages, isCompact }: FooterComponentProps) => {
  const sendMessage = useSendMessage();
  const inProgress = useInProgress();
  const activeConversation = useActiveConversation();
  const initLimitations = useInitLimitation();
  const [defaultMessage, setDefaultMessage] = useMessage();
  const handleSend = (message: string | number) => {
    sendMessage(`${message}`, {
      stream: streamMessages,
    });
    setDefaultMessage(undefined);
  };
  const conversationLock = useMemo(() => {
    return !activeConversation && initLimitations?.reason === 'quota-breached';
  }, [activeConversation, initLimitations]);
  const isDisabled = useMemo(() => {
    return inProgress || activeConversation?.locked || conversationLock;
  }, [inProgress, activeConversation, conversationLock]);

  return (
    <ChatbotFooter isCompact={isCompact}>
      <MessageBar
        id="query-input"
        onSendMessage={handleSend}
        aria-label="Type your message to the AI assistant"
        alwayShowSendButton
        isSendButtonDisabled={isDisabled}
        hasAttachButton={false}
        isCompact={isCompact}
        {...(defaultMessage && { value: defaultMessage })}
      />
      <ChatbotFootnote label="Always review AI generated content prior to use." />
    </ChatbotFooter>
  );
};

export default UniversalFooter;
