import React, { FunctionComponent } from 'react';
import { MessageProps } from '../Message/MessageProps';
import { Banner } from '../../types/Message';
import { ConversationAlert } from '@patternfly/virtual-assistant';

export const ConversationEndBanner: FunctionComponent<MessageProps<Banner>> = () => {
  return <ConversationAlert title="You can start a new conversation at any time by typing below." />;
};
