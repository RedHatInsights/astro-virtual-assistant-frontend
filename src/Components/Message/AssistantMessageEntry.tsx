import { MessageProps } from './MessageProps';
import React, { FunctionComponent } from 'react';
import { Icon, Label, Split, SplitItem } from '@patternfly/react-core';
import RedHatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon';
import { AssistantMessage } from '../../types/Message';

interface AssistantMessageProps extends MessageProps<AssistantMessage> {
  ask: (message: string) => unknown;
}

export const AssistantMessageEntry: FunctionComponent<AssistantMessageProps> = ({ message, ask }) => {
  return (
    <>
      <Split className="astro-chatbot">
        <SplitItem>
          <Icon size="lg" className="pf-u-mr-sm">
            <RedHatIcon />
          </Icon>
        </SplitItem>
        <SplitItem className="bubble pf-u-background-color-200 pf-u-font-size-sm">{message.content}</SplitItem>
      </Split>

      {message.options && (
        <div className="astro-chatbot pf-u-pl-xl">
          {message.options.map((option) => (
            <Label
              className="pf-u-m-xs"
              key={option}
              render={({ className, content, componentRef }) => (
                <a className={className} ref={componentRef} onClick={() => ask(option)}>
                  {content}
                </a>
              )}
            >
              {option}
            </Label>
          ))}
        </div>
      )}
    </>
  );
};
