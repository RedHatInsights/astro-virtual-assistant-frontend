import React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import ARHBadgeIcon from './ARH-Bottom-Right-Toggle.svg';

interface ARHAvatarProps {
  onClick: () => void;
}

const ARHBadge: React.FunctionComponent<ARHAvatarProps> = ({ onClick }) => {
  return (
    <Tooltip position="left" content={<div>Ask Red Hat</div>}>
      <Button variant="plain" className="pf-v6-u-pt-sm" onClick={onClick}>
        <img className="astro__badge" src={ARHBadgeIcon} alt="Launch Ask Red Hat assistant" />
      </Button>
    </Tooltip>
  );
};

export default ARHBadge;
