import React, { FunctionComponent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';

import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Stack, StackItem } from '@patternfly/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';

import { Status, useAstro } from '../../Components/AstroChat/useAstro';
import { AstroChat } from '../../Components/AstroChat/AstroChat';
import { AstroBadge } from '../../Components/AstroAvatar/AstroBadge';
import { commandMessageProcessor } from './CommandMessageProcessor';
import UniversalBadge from '../../Components/UniversalChatbot/UniversalBadge';
import useStateManager from '../../aiClients/useStateManager';
import UniversalChatbot from '../../Components/UniversalChatbot/UniversalChatbot';

import './astro-virtual-assistant.scss';

const messageProcessors = [commandMessageProcessor];

interface AstroVirtualAssistantProps {
  showAssistant: boolean;
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  startInput?: string;
  className?: string;
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

const AstroVirtualAssistantLegacy: FunctionComponent<AstroVirtualAssistantProps> = ({ showAssistant, isOpen, setOpen, startInput, className }) => {
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

  return (
    <Stack className={classnames('astro-wrapper-stack', className)}>
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
  );
};

const AstroVirtualAssistantUnified = ({
  showAssistant,
  isOpen,
  setOpen,
  className,
}: {
  showAssistant: boolean;
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}) => {
  const { currentModel, managers, setCurrentModel } = useStateManager(isOpen);
  const stateManager = managers && currentModel ? managers.find((m) => m.model === currentModel)?.stateManager : undefined;
  return (
    !!stateManager &&
    !!showAssistant && (
      <AIStateProvider stateManager={stateManager}>
        <Stack className={classnames('astro-wrapper-stack', className)}>
          <StackItem>
            {isOpen ? <UniversalChatbot managers={managers} currentModel={currentModel} setCurrentModel={setCurrentModel} setOpen={setOpen} /> : null}
          </StackItem>
          <StackItem className="astro-wrapper-stack__badge pf-v6-u-mt-sm pf-v6-u-mt-xl-on-md">
            <UniversalBadge
              onClick={() => {
                setOpen((prev) => !prev);
              }}
            />
          </StackItem>
        </Stack>
      </AIStateProvider>
    )
  );
};

const AstroVirtualAssistant = (props: { showAssistant: boolean; startInput?: string; className?: string }) => {
  const useChatBots = useFlag('platform.va.chameleon.enabled');
  const [isOpen, setOpen] = useState<boolean>(false);

  const ChatbotComponent = useChatBots ? AstroVirtualAssistantUnified : AstroVirtualAssistantLegacy;

  return createPortal(
    <div className="virtualAssistant">
      <ChatbotComponent {...props} isOpen={isOpen} setOpen={setOpen} className={props.className} />
    </div>,
    document.body
  );
};

export default AstroVirtualAssistant;
