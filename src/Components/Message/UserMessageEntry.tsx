import React, { FunctionComponent } from 'react';
import OutlinedUserIcon from '@patternfly/react-icons/dist/js/icons/outlined-user-icon';
import { MessageProps } from './MessageProps';
import { UserMessage } from '../../types/Message';
import { UserMessageEntry as PFUserMessageEntry } from '@patternfly/virtual-assistant';

export const UserMessageEntry: FunctionComponent<MessageProps<UserMessage>> = ({ message }) => {
  return <PFUserMessageEntry icon={OutlinedUserIcon}>{message.content}</PFUserMessageEntry>;
};
