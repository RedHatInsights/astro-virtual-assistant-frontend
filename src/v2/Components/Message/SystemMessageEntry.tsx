import React, { FunctionComponent } from 'react';
import { MessageProps } from './MessageProps';
import { SystemMessage } from '../../types/Message';
import { TextEntry } from './TextEntry';
import { SystemMessageEntry as PFSystemMessageEntry } from '@patternfly/virtual-assistant';

interface SystemMessageProps extends MessageProps<SystemMessage> {
  preview: boolean;
}

export const SystemMessageEntry: FunctionComponent<SystemMessageProps> = ({ message, preview }) => {
  let systemMessageText = '';

  switch (message.type) {
    case 'finish_conversation_message':
      systemMessageText = 'End of conversation';
      break;
    case 'redirect_message':
      systemMessageText = `Your browser may block pop-ups. Please allow pop-ups or click [here](${message.additionalContent?.[0]}).`;
      break;
  }

  return (
    <PFSystemMessageEntry>
      <TextEntry content={systemMessageText} preview={preview} />
    </PFSystemMessageEntry>
  );
};
