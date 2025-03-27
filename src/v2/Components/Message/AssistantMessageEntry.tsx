import { MessageProps } from './MessageProps';
import React, { FunctionComponent } from 'react';
import ChatbotIcon from '../icon-chatbot-static';
import { AssistantMessageEntry as PFAssistantMessageEntry } from '@patternfly/virtual-assistant';

import { AssistantMessage } from '../../types/Message';
import { TextEntry } from './TextEntry';
import { AskOptions } from '../AstroChat/useAstro';

interface AssistantMessageProps extends MessageProps<AssistantMessage> {
  ask: (option: AskOptions) => unknown;
  preview: boolean;
  blockInput: boolean;
}

const OPTION_COLORS = ['red'] as const;

export const AssistantMessageEntry: FunctionComponent<AssistantMessageProps> = ({ message, ask, preview, blockInput }) => {
  if (!message.content && !message.options) {
    return null;
  }
  if (message.options) {
    return <AssistantButtonEntry message={message} ask={ask} preview={preview} blockInput={blockInput} />;
  }
  return (
    <PFAssistantMessageEntry icon={ChatbotIcon}>
      <TextEntry content={message.content} preview={preview} />
    </PFAssistantMessageEntry>
  );
};
export const AssistantButtonEntry: FunctionComponent<AssistantMessageProps> = ({ message, ask, preview, blockInput }) => {
  return (
    <PFAssistantMessageEntry
      icon={ChatbotIcon}
      options={message.options?.map((o, index) => ({
        title: o.text ?? '',
        props: {
          color: OPTION_COLORS[index % OPTION_COLORS.length],
          className: blockInput ? 'astro-option-disabled' : '',
          onClick: () => blockInput || ask({ label: o.value, hideMessage: !!o.optionId, optionId: o.optionId }),
        },
      }))}
    >
      <TextEntry content={message.content} preview={preview} />
    </PFAssistantMessageEntry>
  );
};
