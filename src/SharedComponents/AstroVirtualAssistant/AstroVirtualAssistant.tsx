import React, { FunctionComponent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Stack, StackItem } from '@patternfly/react-core';
import { useFlag } from '@unleash/proxy-client-react';

import { Status, useAstro } from '../../Components/AstroChat/useAstro';
import './astro-virtual-assistant.scss';
import { AstroChat } from '../../Components/AstroChat/AstroChat';
import { AstroBadge } from '../../Components/AstroAvatar/AstroBadge';
import { commandMessageProcessor } from './CommandMessageProcessor';

const messageProcessors = [commandMessageProcessor];

interface AstroVirtualAssistantProps {
  showAssistant: boolean;
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  startInput?: string;
}

const useAstroConfig = (props: AstroVirtualAssistantProps) => {
  const isOpenConfig = useFlag('platform.virtual-assistant.is-open-config');
  const [tempIsOpen, setTempIsOpen] = useState<boolean>(false);

  if (!isOpenConfig) {
    return {
      showAssistant: true,
      isOpen: tempIsOpen,
      setOpen: setTempIsOpen,
    };
  }

  return {
    showAssistant: props.showAssistant,
    isOpen: props.isOpen,
    setOpen: props.setOpen,
  };
};

export const AstroVirtualAssistant: FunctionComponent<AstroVirtualAssistantProps> = ({ showAssistant, isOpen, setOpen, startInput }) => {
  const chrome = useChrome();
  const { messages, setMessages, ask, start, status, error, loadingResponse } = useAstro(messageProcessors, {
    isPreview: chrome.isBeta(),
    auth: chrome.auth,
  });
  const [isFullScreen, setFullScreen] = useState<boolean>(false);

  const [input, setInput] = useState<string>('');

  const isOpenConfig = useFlag('platform.virtual-assistant.is-open-config');
  // if useOpenConfig is enabled, set showAssistant to true, override parameter isOpen and setOpen

  const config = useAstroConfig({ showAssistant, isOpen, setOpen });

  useEffect(() => {
    if (config.isOpen) {
      void start();
    }
  }, [config.isOpen]);

  useEffect(() => {
    if (startInput) {
      setInput(startInput);
    }
  }, [startInput]);

  if (!config.showAssistant) {
    return null;
  }

  return createPortal(
    <div className="virtualAssistant">
      <Stack className="astro-wrapper-stack">
        <StackItem>
          {(status === Status.STARTED || status === Status.LOADING) && config.isOpen && (
            <AstroChat
              key="astro-chat"
              messages={messages}
              setMessages={setMessages}
              input={input}
              setInput={setInput}
              ask={ask}
              blockInput={loadingResponse || error !== null}
              preview={chrome.isBeta()}
              onClose={() => config.setOpen(false)}
              fullscreen={isFullScreen}
              setFullScreen={setFullScreen}
              isLoading={status === Status.LOADING}
            />
          )}
        </StackItem>
        <StackItem className="astro-wrapper-stack__badge pf-v5-u-mt-sm pf-v5-u-mt-xl-on-md">
          <AstroBadge onClick={() => config.setOpen((prev) => !prev)} />
        </StackItem>
      </Stack>
    </div>,
    document.body
  );
};

export default AstroVirtualAssistant;
