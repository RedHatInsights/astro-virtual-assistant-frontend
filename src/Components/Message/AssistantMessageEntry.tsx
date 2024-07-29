import { MessageProps } from './MessageProps';
import React, { FunctionComponent } from 'react';
import ChatbotIcon from '../icon-chatbot';
import { AssistantMessageEntry as PFAssistantMessageEntry } from '@patternfly/virtual-assistant';

import { AssistantMessage, MessageOption } from '../../types/Message';
import { TextEntry } from './TextEntry';

interface AssistantMessageProps extends MessageProps<AssistantMessage> {
  ask: (option: MessageOption) => unknown;
  preview: boolean;
  blockInput: boolean;
}

const OPTION_COLORS = ['red'] as const;

export const AssistantMessageEntry: FunctionComponent<AssistantMessageProps> = ({ message, ask, preview, blockInput }) => {
  if (!message.content && !message.options) {
    return null;
  }

  return (
    <PFAssistantMessageEntry
      icon={ChatbotIcon}
      options={message.options?.map((o, index) => ({
        title: o.title ?? '',
        props: {
          color: OPTION_COLORS[index % OPTION_COLORS.length],
          className: blockInput ? 'astro-option-disabled' : '',
          onClick: () => blockInput || ask(o),
        },
      }))}
    >
      <TextEntry content={message.content} preview={preview} />
    </PFAssistantMessageEntry>
  );
};
