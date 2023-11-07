import React from 'react';
import { Avatar, Button, ButtonVariant } from '@patternfly/react-core';
import HeaderBackground from '../../assets/header-background-01.svg';

interface AstroAvatarProps {
  onClick: () => void;
}

export const AstroAvatar: React.FunctionComponent<AstroAvatarProps> = ({ onClick }) => {
  return (
    <Button variant={ButtonVariant.plain} onClick={onClick}>
      <Avatar className="astro__avatar" src={HeaderBackground} alt="Launch virtual assistant" />
    </Button>
  );
};
