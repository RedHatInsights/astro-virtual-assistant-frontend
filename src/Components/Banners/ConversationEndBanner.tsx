import React, { FunctionComponent } from 'react';
import { Alert, TextContent } from '@patternfly/react-core';
import { MessageProps } from '../Message/MessageProps';
import { Banner } from '../../types/Message';

export const ConversationEndBanner: FunctionComponent<MessageProps<Banner>> = () => {
  return (
    <>
      <TextContent className="banner__chat-end">
        <Alert variant="info" isInline title="You can start a new conversation at anytime by typing below." component="h6" className="banner-alert" />
      </TextContent>
    </>
  );
};
