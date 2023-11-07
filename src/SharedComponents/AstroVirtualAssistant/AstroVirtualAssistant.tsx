import React, { FunctionComponent, useEffect, useState } from 'react';
import { Status, useAstro } from '../../Components/AstroChat/useAstro';
import './astro-virtual-assistant.scss';
import { AstroChat } from '../../Components/AstroChat/AstroChat';
import { AstroBadge } from '../../Components/AstroAvatar/AstroBadge';
import { AstroChatSkeleton } from '../../Components/AstroChat/AstroChatSkeleton';
import { Stack, StackItem } from '@patternfly/react-core';

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

  return (
    <Stack className="astro-wrapper-stack">
      <StackItem>
        {status === Status.STARTED && <AstroChat key="astro-chat" messages={messages} ask={ask} onClose={() => setOpen(false)} />}
        {status === Status.LOADING && <AstroChatSkeleton />}
      </StackItem>
      <StackItem className="astro-wrapper-stack__badge">
        <AstroBadge onClick={() => setOpen((prev) => !prev)} />
      </StackItem>
    </Stack>
  );
};
