import React, { FunctionComponent } from 'react';
import { MessageProps } from '../Message/MessageProps';
import { Banner } from '../../types/Message';
import { ConversationAlert } from '@patternfly/virtual-assistant';

export const MessageTooLongBanner: FunctionComponent<MessageProps<Banner>> = () => {
  return <ConversationAlert title="Your message cannot exceed 2048 characters." />;
};
