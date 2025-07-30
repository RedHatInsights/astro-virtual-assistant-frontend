import React from 'react';
import { ChatbotFooter, MessageBar } from '@patternfly/chatbot';
import { useActiveConversation, useInProgress, useSendMessage } from '@redhat-cloud-services/ai-react-state';

const ARHFooter = () => {
  const sendMessage = useSendMessage();
  const inProgress = useInProgress();
  const activeConversation = useActiveConversation();

  const handleSend = (message: string | number) => {
    sendMessage(`${message}`, {
      stream: true,
    });
  };
  return (
    <ChatbotFooter>
      <MessageBar
        id="query-input"
        onSendMessage={handleSend}
        aria-label="Type your message to the AI assistant"
        alwayShowSendButton
        isSendButtonDisabled={inProgress || activeConversation?.locked}
        hasAttachButton={false}
      />
    </ChatbotFooter>
  );
};

export default ARHFooter;
