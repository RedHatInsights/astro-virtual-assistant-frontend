import React, { FunctionComponent } from 'react';
import { MessageProps } from '../Message/MessageProps';
import { Banner } from '../../types/Message';
import { ConversationAlert } from '@patternfly/virtual-assistant';

export const RequestErrorBanner: FunctionComponent<MessageProps<Banner>> = () => {
  return <ConversationAlert title="Sorry, something went wrong while talking to the Virtual Assistant." variant="danger" />;
};
