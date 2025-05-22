import React, { Dispatch, SetStateAction, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertActionCloseButton, Label, Skeleton } from '@patternfly/react-core';
import { original, produce } from 'immer';
import AngleDownIcon from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import { Banner, From, Message } from '../../types/Message';
import { AssistantMessageEntry } from '../Message/AssistantMessageEntry';
import { SystemMessageEntry } from '../Message/SystemMessageEntry';
import { UserMessageEntry } from '../Message/UserMessageEntry';
import { FeedbackAssistantEntry } from '../Message/FeedbackMessageEntry';
import CompressAltIcon from '@patternfly/react-icons/dist/esm/icons/compress-alt-icon';
import ExpandAltIcon from '@patternfly/react-icons/dist/esm/icons/expand-alt-icon';
import { AskOptions } from './useAstro';
import { BannerEntry } from '../Message/BannerEntry';
import { ThumbsMessageEntry } from '../Message/ThumbsMessageEntry';
import { LoadingMessage, VirtualAssistant, VirtualAssistantAction } from '@patternfly/virtual-assistant';

import ChatbotIcon from '../icon-chatbot-animated';

interface AstroChatProps {
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  ask: (what: string, options?: Partial<AskOptions>) => Promise<void>;
  preview: boolean;
  onClose: () => void;
  blockInput: boolean;
  fullscreen: boolean;
  setFullScreen: (isFullScreen: boolean) => void;
  isLoading: boolean;
}

const findConversationEndBanner = (message: Message) => message.from === From.INTERFACE && message.type === 'finish_conversation_banner';
const findMessageTooLongBanner = (message: Message) => message.from === From.INTERFACE && message.type === 'message_too_long';

export const AstroChat: React.FunctionComponent<AstroChatProps> = ({
  messages,
  setMessages,
  ask,
  preview,
  onClose,
  blockInput,
  fullscreen,
  setFullScreen,
  isLoading,
}) => {
  const astroContainer = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState<string>('');
  const [alertClosed, setAlertClosed] = useState<boolean>(false);

  const askFromOption = useCallback(
    (option: AskOptions) => {
      return ask(option.label, option);
    },
    [ask]
  );

  const switchMessages = useMemo(() => {
    return messages.map((message, index) => {
      if ('isLoading' in message && message.isLoading) {
        return <LoadingMessage icon={ChatbotIcon} key={index} />;
      }
      switch (message.from) {
        case From.ASSISTANT:
          return <AssistantMessageEntry message={message} ask={askFromOption} preview={preview} blockInput={blockInput} key={index} />;
        case From.USER:
          return <UserMessageEntry message={message} key={index} />;
        case From.FEEDBACK:
          return <FeedbackAssistantEntry key={index} />;
        case From.SYSTEM:
          return <SystemMessageEntry message={message} preview={preview} key={index} />;
        case From.INTERFACE:
          return <BannerEntry message={message} key={index} />;
        case From.THUMBS:
          return <ThumbsMessageEntry ask={askFromOption} blockInput={blockInput} />;
      }
    });
  }, [messages]);

  const removeEndConversationBanner = () => {
    setMessages(
      produce((draft) => {
        const index = original(draft)?.findIndex(findConversationEndBanner);
        if (index !== undefined && index !== -1) {
          draft.splice(index, 1);
        }
      })
    );
  };

  const addMessageTooLongBanner = () => {
    const messageTooLong: Banner = {
      from: From.INTERFACE,
      content: 'banner',
      type: 'message_too_long',
    };
    setMessages(
      produce((draft) => {
        draft.push(messageTooLong);
      })
    );
  };

  const removeMessageTooLongBanner = () => {
    setMessages(
      produce((draft) => {
        const index = original(draft)?.findIndex(findMessageTooLongBanner);
        if (index !== undefined && index !== -1) {
          draft.splice(index, 1);
        }
      })
    );
  };

  useLayoutEffect(() => {
    if (astroContainer.current) {
      const messageContainer = astroContainer.current.querySelector('.pf-v5-c-card__body');
      if (messageContainer) {
        messageContainer.scrollTo(0, messageContainer.scrollHeight);
      }
    }
  }, [messages]);

  const onChange = useCallback((_event: unknown, value: string) => {
    removeEndConversationBanner();
    removeMessageTooLongBanner();

    if (value === '\n') {
      return;
    }
    if (value.length > 2048) {
      addMessageTooLongBanner();
      value = value.slice(0, 2048);
    }
    setInput(value);
  }, []);

  const onAskPressed = useCallback(() => {
    void ask(input);
    setInput('');
  }, [ask, input]);

  const content = isLoading ? (
    <Skeleton width="80%" />
  ) : (
    <>
      {!alertClosed && (
        <Alert
          className="astro-v5-c-alert-welcome pf-v5-u-background-color-200 pf-v5-u-mb-md"
          variant="info"
          isInline
          title="You are about to utilize Red Hat's Hybrid Cloud Console virtual assistant chat tool"
          actionClose={<AlertActionCloseButton onClose={() => setAlertClosed(true)} />}
        >
          This feature uses AI technology. Please do not include personal information or other sensitive information in your input. Interactions may
          be used to improve Red Hat&apos;s products or services.
          <div className="pf-v5-u-mt-md">
            <Label className="pf-v5-u-mr-md pf-v5-u-px-md" onClick={() => setAlertClosed(true)}>
              Got it
            </Label>
          </div>
        </Alert>
      )}

      {switchMessages}
    </>
  );

  return (
    <div ref={astroContainer} className={fullscreen ? 'pf-v5-c-card-full-screen' : ''}>
      <VirtualAssistant
        title="Virtual Assistant"
        inputPlaceholder="Send a message..."
        message={input}
        onChangeMessage={onChange}
        onSendMessage={onAskPressed}
        isSendButtonDisabled={isLoading || input.trim() === '' || blockInput}
        icon={ChatbotIcon}
        actions={
          <>
            <VirtualAssistantAction aria-label="Full screen" onClick={() => setFullScreen(!fullscreen)} isDisabled={isLoading}>
              {fullscreen ? <CompressAltIcon /> : <ExpandAltIcon />}
            </VirtualAssistantAction>
            <VirtualAssistantAction aria-label="Close virtual assistant" onClick={onClose} isDisabled={isLoading}>
              <AngleDownIcon />
            </VirtualAssistantAction>
          </>
        }
      >
        {content}
      </VirtualAssistant>
    </div>
  );
};
