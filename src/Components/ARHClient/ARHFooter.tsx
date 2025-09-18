import React, { useMemo } from 'react';
import { ChatbotFooter, ChatbotFootnote, MessageBar } from '@patternfly/chatbot';
import { useActiveConversation, useInProgress, useInitLimitation, useMessages, useSendMessage } from '@redhat-cloud-services/ai-react-state';
import { IFDAdditionalAttributes } from '@redhat-cloud-services/arh-client';
import useArhMessageQuota from './useArhMessageQuota';

const ARHFooter = ({ isCompact }: { isCompact?: boolean }) => {
  const sendMessage = useSendMessage();
  const inProgress = useInProgress();
  const activeConversation = useActiveConversation();
  const initLimitations = useInitLimitation();
  const messages = useMessages<IFDAdditionalAttributes>();
  const handleSend = (message: string | number) => {
    sendMessage(`${message}`, {
      stream: true,
    });
  };
  const conversationLock = useMemo(() => {
    return !activeConversation && initLimitations?.reason === 'quota-breached';
  }, [activeConversation, initLimitations]);
  const quotaExceeded = useArhMessageQuota(messages[messages.length - 1]);
  const isDisabled = useMemo(() => {
    return inProgress || activeConversation?.locked || quotaExceeded?.variant === 'danger' || conversationLock;
  }, [inProgress, activeConversation, quotaExceeded, conversationLock]);
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
      />
      <ChatbotFootnote label="Always review AI generated content prior to use." />
    </ChatbotFooter>
  );
};

export default ARHFooter;
