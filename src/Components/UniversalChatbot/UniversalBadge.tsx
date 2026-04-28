import React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import ChatbotIcon from '../../assets/rh-icon-ai-chatbot-happy-white.svg';

import './UniversalBadge.scss';

interface UniversalBadgeProps {
  onClick: () => void;
}

const UniversalBadge: React.FunctionComponent<UniversalBadgeProps> = ({ onClick }) => {
  return (
    <Tooltip position="left" content={<div>AI assistants</div>}>
      <Button variant="plain" className="pf-v6-u-p-0 arh__badge__button" onClick={onClick}>
        <img className="arh__badge__image" src={ChatbotIcon} alt="Launch AI assistant" />
      </Button>
    </Tooltip>
  );
};

export default UniversalBadge;
