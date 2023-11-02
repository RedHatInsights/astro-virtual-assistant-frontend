import { MessageProps } from './MessageProps';
import React, { FunctionComponent } from 'react';
import { Icon, Label, Split, SplitItem, TextContent } from '@patternfly/react-core';
import ChatbotIcon from '../icon-chatbot';

import { AssistantMessage, MessageOption } from '../../types/Message';
import ReactMarkdown from 'react-markdown';

interface AssistantMessageProps extends MessageProps<AssistantMessage> {
  ask: (option: MessageOption) => unknown;
}

const OPTION_COLORS = ['red'] as const;

export const AssistantMessageEntry: FunctionComponent<AssistantMessageProps> = ({ message, ask }) => {
  return (
    <div className="pf-v5-u-mb-xl">
      {message.content && (
        <Split className="astro-chatbot">
          <SplitItem>
            <Icon size="lg" className="pf-v5-u-mr-sm pf-v5-u-pt-md">
              <ChatbotIcon />
            </Icon>
          </SplitItem>
          <SplitItem className="bubble pf-u-background-color-200">
            <TextContent className="pf-v5-u-font-size-sm">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </TextContent>
          </SplitItem>
        </Split>
      )}

      {message.options && (
        <Split>
          <SplitItem className="astro-chatbot pf-v5-u-ml-xl pf-v5-u-mt-md">
            {message.options.map((option, index) => (
              <Label
                className="pf-u-m-xs"
                key={option.title}
                color={OPTION_COLORS[index % OPTION_COLORS.length]}
                render={({ className, content, componentRef }) => (
                  <a className={className} ref={componentRef} onClick={() => ask(option)}>
                    {content}
                  </a>
                )}
              >
                {option.title}
              </Label>
            ))}
          </SplitItem>
        </Split>
      )}
    </div>
  );
};
