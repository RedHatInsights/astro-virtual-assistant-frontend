import React, { FunctionComponent, useEffect, useState } from 'react';

import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Stack, StackItem } from '@patternfly/react-core';

import { Status, useAstro } from '../../Components/AstroChat/useAstro';
import './astro-virtual-assistant.scss';
import { AstroChat } from '../../Components/AstroChat/AstroChat';
import { AstroBadge } from '../../Components/AstroAvatar/AstroBadge';
import { AstroChatSkeleton } from '../../Components/AstroChat/AstroChatSkeleton';
import { commandMessageProcessor } from './CommandMessageProcessor';

const messageProcessors = [commandMessageProcessor];

export const AstroVirtualAssistant: FunctionComponent = () => {
  const { messages, ask, start, status } = useAstro(messageProcessors);
  const [isOpen, setOpen] = useState<boolean>(false);
  const chrome = useChrome();

  useEffect(() => {
    if (isOpen) {
      void start();
    }
  }, [isOpen]);

  return (
    <Stack className="astro-wrapper-stack">
      <StackItem className="pf-v5-u-box-shadow-lg">
        {status === Status.STARTED && isOpen && (
          <AstroChat key="astro-chat" messages={messages} ask={ask} preview={chrome.isBeta()} onClose={() => setOpen(false)} />
        )}
        {status === Status.LOADING && isOpen && <AstroChatSkeleton />}
      </StackItem>
      <StackItem className="astro-wrapper-stack__badge">
        <AstroBadge onClick={() => setOpen((prev) => !prev)} />
      </StackItem>
    </Stack>
  );
};

export default AstroVirtualAssistant;
