import React, { FunctionComponent } from 'react';
import { Text, TextContent, TextVariants } from '@patternfly/react-core';
import { MessageProps } from './MessageProps';
import { SystemMessage } from '../../types/Message';

export const SystemMessageEntry: FunctionComponent<MessageProps<SystemMessage>> = ({ message }) => {
  let systemMessageText = '';

  switch (message.type) {
    case 'finish_conversation_message':
      systemMessageText = 'End of conversation';
  }
  return (
    <>
      <TextContent className="system-message">
        <Text component={TextVariants.small} className="system-message-text">
          {systemMessageText}
        </Text>
      </TextContent>
    </>
  );
};
