import React, { FunctionComponent, useEffect, useState } from 'react';

import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Stack, StackItem } from '@patternfly/react-core';

import { Status, useAstro } from '../../Components/AstroChat/useAstro';
import './astro-virtual-assistant.scss';
import './animation.scss';
import { AstroChat } from '../../Components/AstroChat/AstroChat';
import { AstroBadge } from '../../Components/AstroAvatar/AstroBadge';
import { AstroChatSkeleton } from '../../Components/AstroChat/AstroChatSkeleton';
import { commandMessageProcessor } from './CommandMessageProcessor';

const messageProcessors = [commandMessageProcessor];

export const AstroVirtualAssistant: FunctionComponent = () => {
  const chrome = useChrome();
  const { messages, setMessages, ask, start, status, loadingResponse } = useAstro(messageProcessors, {
    isPreview: chrome.isBeta(),
    auth: chrome.auth,
  });
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isFullScreen, setFullScreen] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      void start();
    }
  }, [isOpen]);

  return (
    <Stack className="astro-wrapper-stack">
      <StackItem className="pf-v5-u-box-shadow-lg">
        {status === Status.STARTED && isOpen && (
          <AstroChat
            key="astro-chat"
            messages={messages}
            setMessages={setMessages}
            ask={ask}
            blockInput={loadingResponse}
            preview={chrome.isBeta()}
            onClose={() => setOpen(false)}
            fullscreen={isFullScreen}
            setFullScreen={setFullScreen}
          />
        )}
        {status === Status.LOADING && isOpen && <AstroChatSkeleton />}
      </StackItem>
      <StackItem className="astro-wrapper-stack__badge pf-v5-u-mt-sm pf-v5-u-mt-xl-on-md">
        <AstroBadge onClick={() => setOpen((prev) => !prev)} />
      </StackItem>
    </Stack>
  );
};

export default AstroVirtualAssistant;
