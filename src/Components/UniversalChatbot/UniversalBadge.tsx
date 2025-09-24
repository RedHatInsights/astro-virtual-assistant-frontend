import React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import ChameleonBadge from '../../assets/ChameleonBadge.svg';

import './UniversalBadge.scss';

interface UniversalBadgeProps {
  onClick: () => void;
}

const UniversalBadge: React.FunctionComponent<UniversalBadgeProps> = ({ onClick }) => {
  return (
    <Tooltip position="left" content={<div>AI assistants</div>}>
      <Button variant="plain" className="pf-v6-u-p-0 arh__badge__button" onClick={onClick}>
        <img className="arh__badge__image" src={ChameleonBadge} alt="Launch AI assistant" />
      </Button>
    </Tooltip>
  );
};

export default UniversalBadge;
