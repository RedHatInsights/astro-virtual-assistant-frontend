import React, { FunctionComponent } from 'react';
import { Button, Split, SplitItem, TextContent } from '@patternfly/react-core';
import ThumbsUpIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-up-icon';
import ThumbsDownIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-down-icon';
import { MessageOption } from '../../types/Message';

interface AssistantMessageProps {
  ask: (option: MessageOption) => unknown;
  blockInput: boolean;
  thumbsUp: string;
  thumbsDown: string;
}

export const ThumbsMessageEntry: FunctionComponent<AssistantMessageProps> = ({ ask, blockInput, thumbsUp, thumbsDown }) => {
  return (
    <div className="pf-v5-u-mb-md">
      <Split>
        <SplitItem className="astro-chatbot pf-v5-u-ml-xl">
          <TextContent className="pf-v5-u-font-size-sm">
            <Button
              variant="plain"
              className="pf-v5-u-pr-xs pf-u-py-0"
              isDisabled={blockInput}
              onClick={() =>
                blockInput ||
                ask({
                  payload: thumbsUp,
                  title: ':thumbsup:',
                })
              }
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              variant="plain"
              className="pf-v5-u-pr-xs pf-u-py-0"
              isDisabled={blockInput}
              onClick={() =>
                blockInput ||
                ask({
                  payload: thumbsDown,
                  title: ':thumbsdown:',
                })
              }
            >
              <ThumbsDownIcon />
            </Button>
          </TextContent>
        </SplitItem>
      </Split>
    </div>
  );
};
