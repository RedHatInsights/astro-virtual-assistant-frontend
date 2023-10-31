import { MessageProps } from './MessageProps';
import React, { FunctionComponent } from 'react';
import { Icon, Label, Split, SplitItem, TextContent } from '@patternfly/react-core';
import RedHatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon';
import { AssistantMessage, MessageOption } from '../../types/Message';
import ReactMarkdown from 'react-markdown';

interface AssistantMessageProps extends MessageProps<AssistantMessage> {
  ask: (option: MessageOption) => unknown;
}

const OPTION_COLORS = ['blue', 'cyan', 'green', 'orange', 'purple', 'grey', 'gold'] as const;

export const AssistantMessageEntry: FunctionComponent<AssistantMessageProps> = ({ message, ask }) => {
  return (
    <>
      {message.content && (
        <Split className="astro-chatbot">
          <SplitItem>
            <Icon size="lg" className="pf-u-mr-sm">
              <RedHatIcon />
            </Icon>
          </SplitItem>
          <SplitItem className="bubble pf-u-background-color-200">
            <TextContent className="pf-u-font-size-sm">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </TextContent>
          </SplitItem>
        </Split>
      )}

      {message.options && (
        <div className="astro-chatbot pf-u-pl-xl">
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
        </div>
      )}
    </>
  );
};
