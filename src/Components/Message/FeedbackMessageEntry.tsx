import React, { FunctionComponent } from 'react';
import { Button, Icon, Split, SplitItem, TextContent } from '@patternfly/react-core';
import RobotIcon from '@patternfly/react-icons/dist/js/icons/robot-icon';
import ThumbsUpIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-down-icon';
import ThumbsDownIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-up-icon';

export const FeedbackAssistantEntry: FunctionComponent<unknown> = () => {
  return (
    <>
      <Split className="astro-chatbot">
        <SplitItem>
          <Icon size="lg" className="pf-v5-u-mr-md">
            <RobotIcon />
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
