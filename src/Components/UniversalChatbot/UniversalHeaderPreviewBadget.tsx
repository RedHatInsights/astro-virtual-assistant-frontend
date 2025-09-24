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
            Preview refers to early access features or functionalities that are under active development and not yet fully supported for production
            environments.
          </p>
          <p>
            This feature is made available to allow users to test new functionalities, provide feedback, and help shape the future development of the
            feature.
          </p>
          <p>
            Preview features have limitations on support compared to fully released features. They are not intended for production workloads and are
            not covered by standard Red Hat Customer Portal case management.
          </p>
          <p>This Preview feature is still in development and may undergo changes, or even be removed, before or during their official release.</p>
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
