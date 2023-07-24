import React, { FunctionComponent } from 'react';
import { Icon, Split, SplitItem } from '@patternfly/react-core';
import UserIcon from '@patternfly/react-icons/dist/esm/icons/outlined-user-circle-icon';
import { MessageProps } from './MessageProps';
import { UserMessage } from '../../types/Message';

export const UserAssistantMessageEntry: FunctionComponent<MessageProps<UserMessage>> = ({ message }) => {
  return (
    <>
      <Split className="astro-user">
        <SplitItem className="astro-user-dialog bubble bubble-user">{message.content}</SplitItem>
        <SplitItem className="astro-user-icon">
          <Icon size="lg" className="pf-u-ml-sm">
            <UserIcon />
          </Icon>
        </SplitItem>
      </Split>
    </>
  );
};
