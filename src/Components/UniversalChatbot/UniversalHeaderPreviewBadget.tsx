import React, { useContext, useRef } from 'react';

import { Button, Label, Popover } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { UniversalChatbotContext } from './UniversalChatbotProvider';

import './UniversalHeaderPreviewBadge.scss';

const UniversalHeaderPreviewBadge: React.FC = () => {
  const popoverRef = useRef<HTMLButtonElement>(null);
  const { rootElementRef } = useContext(UniversalChatbotContext);

  return (
    <Popover
      className="universal-header__preview-badge"
      triggerRef={popoverRef}
      appendTo={rootElementRef.current || document.body}
      position="left"
      withFocusTrap={false}
      bodyContent={
        <>
          <p>
            This tool is a preview, and while we strive for accuracy, there&apos;s always a possibility of errors. We recommend that you review AI
            generated content prior to use.
          </p>
        </>
      }
    >
      <Button variant="plain" aria-label="More info" ref={popoverRef} className="pf-v6-u-p-0">
        <Label icon={<InfoCircleIcon />} color="orange">
          Preview
        </Label>
      </Button>
    </Popover>
  );
};

export default UniversalHeaderPreviewBadge;
