import React, { FunctionComponent } from 'react';
import { Icon, Split, SplitItem } from '@patternfly/react-core';
import RedHatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon';

export const LoadingMessageEntry: FunctionComponent<unknown> = () => {
  return (
    <Split className="astro-chatbot">
      <SplitItem>
        <Icon size="lg" className="pf-u-mr-sm">
          <RedHatIcon />
        </Icon>
      </SplitItem>
      <SplitItem className="bubble pf-u-background-color-200">
        <div className="typing pf-u-display-flex pf-u-align-items-center">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </SplitItem>
    </Split>
  );
};
