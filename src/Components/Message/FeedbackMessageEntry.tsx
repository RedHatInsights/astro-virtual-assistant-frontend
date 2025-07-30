import React, { FunctionComponent } from 'react';
import { Button, Content, Icon, Split, SplitItem } from '@patternfly/react-core';
import ThumbsUpIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-down-icon';
import ThumbsDownIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-up-icon';
import ChatbotIcon from '../icon-chatbot-animated';

export const FeedbackAssistantEntry: FunctionComponent<unknown> = () => {
  return (
    <>
      <Split className="astro-chatbot">
        <SplitItem>
          <Icon size="lg" className="pf-v6-u-mr-sm pf-v6-u-pt-md">
            <ChatbotIcon />
          </Icon>
        </SplitItem>
        <SplitItem className="bubble pf-v6-u-background-color-200 pf-v6-u-text-nowrap pf-v6-u-font-size-sm">
          <Content className="pf-v6-u-font-size-sm">
            Are these results helpful?
            <Button icon={<ThumbsUpIcon />} variant="plain" className="pf-v6-u-pr-xs pf-u-py-0" />
            <Button icon={<ThumbsDownIcon />} variant="plain" className="pf-v6-u-pl-xs pf-u-py-0" />
          </Content>
        </SplitItem>
      </Split>
    </>
  );
};
