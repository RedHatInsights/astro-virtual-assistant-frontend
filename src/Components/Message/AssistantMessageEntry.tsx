import { MessageProps } from './MessageProps';
import React, { FunctionComponent } from 'react';
import { Button, Icon, Label, Split, SplitItem } from '@patternfly/react-core';
import RedHatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon';
import ThumbsUpIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-down-icon';
import ThumbsDownIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-up-icon';
import { AssistantMessage } from '../../types/Message';

interface AssistantMessageProps extends MessageProps<AssistantMessage> {
  ask: (message: string) => unknown;
}

export const AssistantMessageEntry: FunctionComponent<AssistantMessageProps> = ({ message, ask }) => {
  if (message.isLoading) {
    return (
      <Split className="astro-chatbot">
        <SplitItem>
          <Icon size="lg" className="pf-u-mr-sm">
            <RedHatIcon />
          </Icon>
        </SplitItem>
        <SplitItem className="bubble pf-u-background-color-200">
          <div className="typing pf-u-display-flex pf-u-align-items-center">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </SplitItem>
      </Split>
    );
  }

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

      <Split className="astro-chatbot">
        <SplitItem>
          <Icon size="lg" className="pf-u-mr-sm">
            <RedHatIcon />
          </Icon>
        </SplitItem>
        <SplitItem className="bubble pf-u-background-color-200 pf-u-text-nowrap pf-u-font-size-sm">
          Are these results helpful?
          <Button variant="plain" className="pf-u-pr-xs pf-u-py-0">
            <ThumbsUpIcon />
          </Button>
          <Button variant="plain" className="pf-u-pl-xs pf-u-py-0">
            <ThumbsDownIcon />
          </Button>
        </SplitItem>
      </Split>
    </>
  );
};
