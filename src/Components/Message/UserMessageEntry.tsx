import React, { FunctionComponent } from 'react';
import { Icon, Split, SplitItem, TextContent } from '@patternfly/react-core';
import { OutlinedUserCircleIcon } from '@patternfly/react-icons';
import { MessageProps } from './MessageProps';
import { UserMessage } from '../../types/Message';

export const UserMessageEntry: FunctionComponent<MessageProps<UserMessage>> = ({ message }) => {
  return (
    <>
      <Split className="astro-user pf-u-align-items-flex-end pf-u-justify-content-flex-end">
        <SplitItem className="bubble pf-u-background-color-active-color-100">
          <TextContent className="pf-u-color-light-100 pf-u-font-size-sm">{message.content}</TextContent>
        </SplitItem>
        <SplitItem>
          <Icon size="lg" className="pf-u-ml-sm">
            <OutlinedUserCircleIcon />
          </Icon>
        </SplitItem>
      </Split>
    </>
  );
};
