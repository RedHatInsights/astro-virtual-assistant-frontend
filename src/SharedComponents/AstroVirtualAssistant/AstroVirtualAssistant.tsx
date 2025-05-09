import React, { FunctionComponent, useEffect, useState } from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Stack, StackItem } from '@patternfly/react-core';
import { Status, useAstro } from '../../Components/AstroChat/useAstro';
import './astro-virtual-assistant.scss';
import { AstroChat } from '../../Components/AstroChat/AstroChat';
import { AstroBadge } from '../../Components/AstroAvatar/AstroBadge';
import { commandMessageProcessor } from './CommandMessageProcessor';
import { createPortal } from 'react-dom';
import { useFlag } from '@unleash/proxy-client-react';
import { AstroVirtualAssistant as AstroVirtualAssistantv2 } from '../../v2/SharedComponents/AstroVirtualAssistant/AstroVirtualAssistant';

const messageProcessors = [commandMessageProcessor];

export const AstroVirtualAssistantv1: FunctionComponent = () => {
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

  return createPortal(
    <div className="virtualAssistant">
      <Stack className="astro-wrapper-stack">
        <StackItem>
          {(status === Status.STARTED || status === Status.LOADING) && isOpen && (
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
              isLoading={status === Status.LOADING}
            />
          )}
        </StackItem>
        <StackItem className="astro-wrapper-stack__badge pf-v5-u-mt-sm pf-v5-u-mt-xl-on-md">
          <AstroBadge onClick={() => setOpen((prev) => !prev)} />
        </StackItem>
      </Stack>
    </div>,
    document.body
  );
};

export const AstroVirtualAssistant: FunctionComponent = () => {
  const isV2APIEnabled = useFlag('platform.virtual-assistant.use_v2_api');
  return isV2APIEnabled ? <AstroVirtualAssistantv2 /> : <AstroVirtualAssistantv1 />;
};

export default AstroVirtualAssistant;
