import { MessageProps } from './MessageProps';
import React, { FunctionComponent } from 'react';
import { Icon, Label, Split, SplitItem, TextContent } from '@patternfly/react-core';
import ChatbotIcon from '../icon-chatbot';

import { AssistantMessage, MessageOption } from '../../types/Message';
import ReactMarkdown from 'react-markdown';

interface AssistantMessageProps extends MessageProps<AssistantMessage> {
  ask: (option: MessageOption) => unknown;
  preview: boolean;
  blockInput: boolean;
}

const OPTION_COLORS = ['red'] as const;

export const AssistantMessageEntry: FunctionComponent<AssistantMessageProps> = ({ message, ask, preview, blockInput }) => {
  return (
    <div className="pf-v5-u-mb-md">
      {message.content && (
        <Split className="astro-chatbot">
          <SplitItem>
            <Icon size="lg" className="pf-v5-u-mr-sm pf-v5-u-pt-md">
              <ChatbotIcon />
            </Icon>
          </SplitItem>
          <SplitItem className="bubble pf-u-background-color-200">
            <TextContent className="pf-v5-u-font-size-sm">
              <ReactMarkdown
                components={{
                  a: ({ ...props }) => {
                    let href = props.href;
                    if (href && href.startsWith('/')) {
                      if (preview) {
                        href = `/preview${href}`;
                      }
                      href = `${window.location.origin}${href}`;
                    }
                    return (
                      <a {...props} href={href} target="_blank" rel="noopener noreferrer">
                        {props.children}
                      </a>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
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
                  <a
                    className={`${className} ${blockInput ? 'astro-option-disabled' : ''}`}
                    ref={componentRef}
                    onClick={() => blockInput || ask(option)}
                  >
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
