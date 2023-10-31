import React, { FunctionComponent } from 'react';
import { Icon, Split, SplitItem } from '@patternfly/react-core';
import RobotIcon from '@patternfly/react-icons/dist/js/icons/robot-icon';

export const LoadingMessageEntry: FunctionComponent<unknown> = () => {
  return (
    <Split className="astro-chatbot">
      <SplitItem>
        <Icon size="lg" className="pf-v5-u-mr-md">
          <RobotIcon />
        </Icon>
      </SplitItem>
      <SplitItem className="bubble pf-v5-u-background-color-200">
        <div className="typing pf-v5-u-display-flex pf-u-align-items-center">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </SplitItem>
    </Split>
  );
};
