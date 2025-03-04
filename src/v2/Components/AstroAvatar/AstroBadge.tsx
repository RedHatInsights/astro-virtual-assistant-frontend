import React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import BubbleIcon from '../../assets/badge-icon.svg';
import './AstroBadge.scss';

interface AstroAvatarProps {
  onClick: () => void;
}

export const AstroBadge: React.FunctionComponent<AstroAvatarProps> = ({ onClick }) => {
  return (
    <Tooltip position="left" content={<div>Virtual assistant</div>}>
      <Button className="astro-c-button-badge pf-v5-u-box-shadow-lg" onClick={onClick}>
        <img className="astro__badge" src={BubbleIcon} alt="Launch virtual assistant" />
      </Button>
    </Tooltip>
  );
};
