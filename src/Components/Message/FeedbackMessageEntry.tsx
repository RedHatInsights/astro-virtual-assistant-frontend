import React, { FunctionComponent } from 'react';
import { Button, Icon, Split, SplitItem, TextContent } from '@patternfly/react-core';
import ThumbsUpIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-down-icon';
import ThumbsDownIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-up-icon';
import ChatbotIcon from '../icon-chatbot-animated';

export const FeedbackAssistantEntry: FunctionComponent<unknown> = () => {
  return (
    <>
      <Split className="astro-chatbot">
        <SplitItem>
          <Icon size="lg" className="pf-v5-u-mr-sm pf-v5-u-pt-md">
            <ChatbotIcon />
          </Icon>
        </SplitItem>
        <SplitItem className="bubble pf-v5-u-background-color-200 pf-v5-u-text-nowrap pf-v5-u-font-size-sm">
          <TextContent className="pf-v5-u-font-size-sm">
            Are these results helpful?
            <Button variant="plain" className="pf-v5-u-pr-xs pf-u-py-0">
              <ThumbsUpIcon />
            </Button>
            <Button variant="plain" className="pf-v5-u-pl-xs pf-u-py-0">
              <ThumbsDownIcon />
            </Button>
          </TextContent>
        </SplitItem>
      </Split>
    </>
  );
};
