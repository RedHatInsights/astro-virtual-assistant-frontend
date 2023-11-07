import React, { FunctionComponent, useEffect, useState } from 'react';
import { Status, useAstro } from '../../Components/AstroChat/useAstro';
import './astro-virtual-assistant.scss';
import { AstroChat } from '../../Components/AstroChat/AstroChat';
import { AstroAvatar } from '../../Components/AstroAvatar/AstroAvatar';
import { AstroChatSkeleton } from '../../Components/AstroChat/AstroChatSkeleton';

export const AstroVirtualAssistant: FunctionComponent = () => {
  const { messages, ask, start, stop, status } = useAstro();
  const [isOpen, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      void start();
    } else {
      void stop();
    }
  }, [isOpen]);

  switch (status) {
    case Status.STARTED:
      return <AstroChat messages={messages} ask={ask} onClose={() => setOpen(false)} />;
    case Status.NOT_STARTED:
      return <AstroAvatar onClick={() => setOpen((prev) => !prev)} />;
    case Status.LOADING:
      return <AstroChatSkeleton />;
  }
};
