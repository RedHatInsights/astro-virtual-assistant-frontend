import { MessageProps } from './MessageProps';
import React, { FunctionComponent } from 'react';
import { Button, Icon, Label, Spinner, Split, SplitItem } from '@patternfly/react-core';
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
        <SplitItem className="astro-user-icon">
          <Spinner size="sm" />
        </SplitItem>
      </Split>
    );
  }

  return (
    <>
      <Split className="astro-chatbot">
        <SplitItem className="astro-user-icon">
          <Icon size="lg" className="pf-u-mr-sm">
            <RedHatIcon />
          </Icon>
        </SplitItem>
        <SplitItem className="astro-chatbot-dialog bubble">{message.content}</SplitItem>
      </Split>

      {message.options && (
        <div className="astro-options pf-u-pl-xl">
          {message.options.map((option) => (
            <Label
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
        <SplitItem className="astro-user-icon">
          <Icon size="lg" className="pf-u-mr-sm">
            <RedHatIcon />
          </Icon>
        </SplitItem>
        <SplitItem className="astro-chatbot-dialog bubble pf-u-text-nowrap">
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
