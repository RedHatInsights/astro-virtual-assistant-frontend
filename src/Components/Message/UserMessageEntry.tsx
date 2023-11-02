import React, { FunctionComponent } from 'react';
import { Icon, Split, SplitItem, TextContent } from '@patternfly/react-core';
import OutlinedUserIcon from '@patternfly/react-icons/dist/js/icons/outlined-user-icon';
import { MessageProps } from './MessageProps';
import { UserMessage } from '../../types/Message';

export const UserMessageEntry: FunctionComponent<MessageProps<UserMessage>> = ({ message }) => {
  return (
    <>
      <Split className="astro-user pf-v5-u-mb-lg pf-v5-u-align-items-flex-start pf-v5-u-justify-content-flex-end">
        <SplitItem className="bubble bubble-user">
          <TextContent className="pf-v5-u-color-300 pf-v5-u-font-size-sm">{message.content}</TextContent>
        </SplitItem>
        <SplitItem>
          <Icon size="lg" className="pf-v5-u-ml-sm pf-v5-u-pt-xs">
            <OutlinedUserIcon />
          </Icon>
        </SplitItem>
      </Split>
    </>
  );
};
