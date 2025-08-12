import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Stack, StackItem } from '@patternfly/react-core';
import { useFlag } from '@unleash/proxy-client-react';

import { Status, useAstro } from '../../Components/AstroChat/useAstro';
import './astro-virtual-assistant.scss';
import { AstroChat } from '../../Components/AstroChat/AstroChat';
import { AstroBadge } from '../../Components/AstroAvatar/AstroBadge';
import { commandMessageProcessor } from './CommandMessageProcessor';

import ARHChatbot from '../../Components/ARHClient/ARHChatbot';
import ARHBadge from '../../Components/ARHClient/ARHBadge';
import type { ChromeUser } from '@redhat-cloud-services/types';
import checkARHAuth from '../../Components/ARHClient/checkARHAuth';
import useArhClient from '../../Components/ARHClient/useArhClient';

const messageProcessors = [commandMessageProcessor];

interface AstroVirtualAssistantProps {
  showAssistant: boolean;
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  startInput?: string;
}

const useAstroConfig = (props: AstroVirtualAssistantProps) => {
  // if useOpenConfig is enabled, set showAssistant to true, override parameter isOpen and setOpen
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

export const AstroVirtualAssistantLegacy: FunctionComponent<AstroVirtualAssistantProps> = ({ showAssistant, isOpen, setOpen, startInput }) => {
  const chrome = useChrome();
  const { messages, setMessages, ask, start, status, error, loadingResponse } = useAstro(messageProcessors, {
    isPreview: chrome.isBeta(),
    auth: chrome.auth,
  });
  const [isFullScreen, setFullScreen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');

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
        <StackItem className="astro-wrapper-stack__badge pf-v6-u-mt-sm pf-v6-u-mt-xl-on-md">
          <AstroBadge onClick={() => config.setOpen((prev) => !prev)} />
        </StackItem>
      </Stack>
    </div>,
    document.body
  );
};

const AstroVirtualAssistant = (props: { showAssistant: boolean }) => {
  const useArh = useFlag('platform.arh.enabled');
  const [isOpen, setOpen] = useState<boolean>(false);
  const chrome = useChrome();
  const [showArh, setShowArh] = useState<boolean>(false);
  const [auth, setAuth] = useState<{ user: ChromeUser | undefined }>({ user: undefined });

  const ARHBaseUrl = useMemo(() => {
    // currently we are only allowed to talk to stage
    // we need KC deployed to accept new scope
    // FF is disabled for now in production/dev envs
    if (['prod', 'dev'].includes(chrome.getEnvironment())) {
      return 'https://access.redhat.com';
    }
    return 'https://access.stage.redhat.com';
  }, []);

  async function handleArhSetup() {
    if (!useArh) {
      setShowArh(false);
      setAuth({ user: undefined });
      return;
    }
    const user = await chrome.auth.getUser();
    if (user) {
      const isEntitled = await checkARHAuth(ARHBaseUrl, user, chrome.auth.token);
      setShowArh(isEntitled);
      setAuth({ user });
    } else {
      setShowArh(false);
      setAuth({ user: undefined });
    }
  }

  useEffect(() => {
    handleArhSetup();
  }, [useArh, chrome.auth.token]);
  const { stateManager, setChatbotAccessed } = useArhClient(ARHBaseUrl, showArh);
  const nodes = useMemo(() => {
    if (showArh && props.showAssistant) {
      return (
        <>
          <StackItem>{isOpen ? <ARHChatbot setOpen={setOpen} stateManager={stateManager} user={auth.user!} /> : null}</StackItem>
          <StackItem className="astro-wrapper-stack__badge pf-v6-u-mt-sm pf-v6-u-mt-xl-on-md">
            <ARHBadge
              onClick={() => {
                setChatbotAccessed(true);
                setOpen((prev) => !prev);
              }}
            />
          </StackItem>
        </>
      );
    }

    return (
      <>
        <StackItem>
          <AstroVirtualAssistantLegacy {...props} isOpen={isOpen} setOpen={setOpen} />
        </StackItem>
        <StackItem className="astro-wrapper-stack__badge pf-v6-u-mt-sm pf-v6-u-mt-xl-on-md">
          {props.showAssistant ? <AstroBadge onClick={() => setOpen((prev) => !prev)} /> : null}
        </StackItem>
      </>
    );
  }, [showArh, props.showAssistant, isOpen]);
  return createPortal(
    <div className="virtualAssistant">
      <Stack className="astro-wrapper-stack">{nodes}</Stack>
    </div>,
    document.body
  );
};

export default AstroVirtualAssistant;
