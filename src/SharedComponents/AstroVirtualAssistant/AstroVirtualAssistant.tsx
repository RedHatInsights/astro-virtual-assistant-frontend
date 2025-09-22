import React, { FunctionComponent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Stack, StackItem } from '@patternfly/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';

import { Status, useAstro } from '../../Components/AstroChat/useAstro';
import { AstroChat } from '../../Components/AstroChat/AstroChat';
import { AstroBadge } from '../../Components/AstroAvatar/AstroBadge';
import { commandMessageProcessor } from './CommandMessageProcessor';
import UniversalBadge from '../../Components/UniversalChatbot/UniversalBadge';
import useStateManager, { AsyncManagersMap, useAsyncManagers } from '../../aiClients/useStateManager';
import UniversalChatbot from '../../Components/UniversalChatbot/UniversalChatbot';
import { AsyncStateManager } from '../../asyncClientInit/types';

import './astro-virtual-assistant.scss';

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

const AsyncManager = ({
  id,
  manager,
  setAsyncManagers,
}: {
  id: string;
  manager: AsyncStateManager<IAIClient<Record<string, unknown>>>;
  setAsyncManagers: React.Dispatch<React.SetStateAction<AsyncManagersMap>>;
}) => {
  const stateManager = manager.useStateManager();
  const authStatus = manager.useIsAuthenticated();
  React.useEffect(() => {
    setAsyncManagers((v) => {
      return {
        ...v,
        [id]: {
          stateManager,
          authStatus,
        },
      };
    });
  }, [stateManager, authStatus]);
  return null;
};

const LoadAssistants = ({ setAsyncManagers }: { setAsyncManagers: React.Dispatch<React.SetStateAction<AsyncManagersMap>> }) => {
  const { loading, managers } = useAsyncManagers();
  if (loading) {
    return null;
  }
  return (
    <>
      {managers.map((m) => (
        <AsyncManager key={m.id} setAsyncManagers={setAsyncManagers} {...m} />
      ))}
    </>
  );
};

const AstroVirtualAssistant = (props: { showAssistant: boolean }) => {
  const { stateManager, chatbotProps, isOpen, setOpen, setAsyncManagers } = useStateManager();
  const nodes = props.showAssistant ? (
    <>
      {stateManager && (
        <AIStateProvider stateManager={stateManager.stateManager}>
          <StackItem>{isOpen ? <UniversalChatbot {...chatbotProps} /> : null}</StackItem>
          <StackItem className="astro-wrapper-stack__badge pf-v6-u-mt-sm pf-v6-u-mt-xl-on-md">
            <UniversalBadge
              onClick={() => {
                setOpen((prev) => !prev);
              }}
            />
          </StackItem>
        </AIStateProvider>
      )}
      <LoadAssistants setAsyncManagers={setAsyncManagers} />
    </>
  ) : (
    <>
      <StackItem>
        <AstroVirtualAssistantLegacy {...props} isOpen={isOpen} setOpen={setOpen} />
      </StackItem>
      <StackItem className="astro-wrapper-stack__badge pf-v6-u-mt-sm pf-v6-u-mt-xl-on-md">
        {props.showAssistant ? <AstroBadge onClick={() => setOpen((prev) => !prev)} /> : null}
      </StackItem>
    </>
  );
  return createPortal(
    <div className="virtualAssistant">
      <Stack className="astro-wrapper-stack">{nodes}</Stack>
    </div>,
    document.body
  );
};

export default AstroVirtualAssistant;
