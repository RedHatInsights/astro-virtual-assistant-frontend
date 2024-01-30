import React, { Dispatch, KeyboardEventHandler, SetStateAction, useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  Button,
  InputGroup,
  InputGroupText,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Text,
  TextArea,
  TextContent,
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { original, produce } from 'immer';
import AngleDownIcon from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import { LoadingMessageEntry } from '../Message/LoadingMessageEntry';
import { From, Message, MessageOption } from '../../types/Message';
import { AssistantMessageEntry } from '../Message/AssistantMessageEntry';
import { SystemMessageEntry } from '../Message/SystemMessageEntry';
import { UserMessageEntry } from '../Message/UserMessageEntry';
import { FeedbackAssistantEntry } from '../Message/FeedbackMessageEntry';
import PlaneIcon from '@patternfly/react-icons/dist/esm/icons/paper-plane-icon';
import CompressAltIcon from '@patternfly/react-icons/dist/esm/icons/compress-alt-icon';
import ExpandAltIcon from '@patternfly/react-icons/dist/esm/icons/expand-alt-icon';
import { AskOptions } from './useAstro';
import { BannerEntry } from '../Message/BannerEntry';
import { ThumbsMessageEntry } from '../Message/ThumbsMessageEntry';

interface AstroChatProps {
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  ask: (what: string, options?: Partial<AskOptions>) => Promise<void>;
  preview: boolean;
  onClose: () => void;
  blockInput: boolean;
  fullscreen: boolean;
  setFullScreen: (isFullScreen: boolean) => void;
}

const findConversationEndBanner = (message: Message) => message.from === From.INTERFACE && message.type === 'finish_conversation_banner';

export const AstroChat: React.FunctionComponent<AstroChatProps> = ({
  messages,
  setMessages,
  ask,
  preview,
  onClose,
  blockInput,
  fullscreen,
  setFullScreen,
}) => {
  const astroContainer = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState<string>('');

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

  useLayoutEffect(() => {
    if (astroContainer.current) {
      const messageContainer = astroContainer.current.querySelector('.astro-l-stack__body');
      if (messageContainer) {
        messageContainer.scrollTo(0, messageContainer.scrollHeight);
      }
    }
  }, [messages]);

  const askFromOption = useCallback(
    (option: MessageOption) => {
      return ask(option.payload, {
        label: option.title,
        hideMessage: !option.title,
      });
    },
    [ask]
  );

  const onChange = useCallback((value: string) => {
    removeEndConversationBanner();
    if (value === '\n') {
      return;
    }
    setInput(value);
  }, []);

  const onAskPressed = useCallback(() => {
    void ask(input);
    setInput('');
  }, [ask, input]);

  const handleKeyPress: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      if (!event.shiftKey) {
        if (blockInput) {
          event.preventDefault();
        } else {
          onAskPressed();
        }
      }
    }
  };

  return (
    <div ref={astroContainer}>
      <Stack className={`astro-l-stack ${fullscreen ? 'astro-l-stack-full-screen' : ''}`}>
        <StackItem className="astro-l-stack__header pf-v5-u-py-md">
          <Split hasGutter>
            <SplitItem isFilled>
              <TextContent className="pf-v5-u-pl-lg pf-u-color-light-100 pf-v5-u-font-size-xl">
                <Text>Virtual Assistant</Text>
              </TextContent>
            </SplitItem>
            <SplitItem>
              <ToolbarGroup variant="icon-button-group">
                <ToolbarItem>
                  <Button variant="plain" aria-label="Full screen" onClick={() => setFullScreen(!fullscreen)} className="pf-v5-u-color-light-100">
                    {fullscreen ? <CompressAltIcon /> : <ExpandAltIcon />}
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="plain" aria-label="Close virtual assistant" onClick={onClose} className="pf-v5-u-color-light-100">
                    <AngleDownIcon />
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
            </SplitItem>
          </Split>
        </StackItem>
        <StackItem className="astro-l-stack__body pf-v5-u-px-md pf-v5-u-pt-xl pf-v5-m-scrollable pf-v5-u-background-color-100" isFilled>
          {messages.map((message, index) => {
            if ('isLoading' in message && message.isLoading) {
              return <LoadingMessageEntry key={index} />;
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
          })}
        </StackItem>
        <StackItem className="astro-l-stack__footer">
          <InputGroup>
            <TextArea
              value={input}
              onChange={onChange}
              onKeyPressCapture={handleKeyPress}
              placeholder="Type a message..."
              name="user-query"
              type="text"
              aria-label="User question"
              className="pf-v5-u-pt-md pf-v5-u-pl-md"
            />
            <InputGroupText id="username">
              <Button onClick={onAskPressed} isDisabled={input.trim() === '' || blockInput} variant="plain" className="pf-v5-u-px-sm">
                <PlaneIcon />
              </Button>
            </InputGroupText>
          </InputGroup>
        </StackItem>
      </Stack>
    </div>
  );
};
