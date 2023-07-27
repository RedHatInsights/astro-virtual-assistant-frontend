import React, { FunctionComponent } from 'react';
import { Button, Icon, Split, SplitItem } from '@patternfly/react-core';
import RedHatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon';
import ThumbsUpIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-down-icon';
import ThumbsDownIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-up-icon';

export const FeedbackAssistantEntry: FunctionComponent<unknown> = () => {
  return (
    <>
      <Split className="astro-chatbot">
        <SplitItem>
          <Icon size="lg" className="pf-u-mr-sm">
            <RedHatIcon />
          </Icon>
        </SplitItem>
        <SplitItem className="bubble pf-u-background-color-200 pf-u-text-nowrap pf-u-font-size-sm">
          Are these results helpful?
          <Button variant="plain" className="pf-u-pr-xs pf-u-py-0">
            <ThumbsUpIcon />
          </Button>
          <Button variant="plain" className="pf-u-pl-xs pf-u-py-0">
            <ThumbsDownIcon />
          </Button>
        </SplitItem>
      </Split>
    </>
  );
};
