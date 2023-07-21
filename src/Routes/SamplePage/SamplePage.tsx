import React, { FunctionComponent, KeyboardEventHandler, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Main } from '@redhat-cloud-services/frontend-components/Main';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';

import {
  Button,
  Divider,
  Icon,
  InputGroup,
  InputGroupText,
  InputGroupTextVariant,
  Label,
  Spinner,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextInput,
} from '@patternfly/react-core';

import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import PlaneIcon from '@patternfly/react-icons/dist/esm/icons/paper-plane-icon';
import MinimizeIcon from '@patternfly/react-icons/dist/esm/icons/window-minimize-icon';
import UserIcon from '@patternfly/react-icons/dist/esm/icons/outlined-user-circle-icon';
import RedHatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon';
import ThumbsUpIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-down-icon';
import ThumbsDownIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-up-icon';


import './sample-page.scss';
import { postTalk } from '../../api/PostTalk';
import { produce } from 'immer';

enum From {
  ASSISTANT = 'assistant',
  USER = 'user',
}

// Base
interface BaseMessage {
  from: unknown;
  content: string;
}

// Brand Assistant
interface AssistantMessage extends BaseMessage {
  from: From.ASSISTANT;
  options?: Array<string>;
  isLoading: boolean;
}

// Brand User
interface UserMessage extends BaseMessage {
  from: From.USER;
}

type Message = AssistantMessage | UserMessage;

interface MessageProps<Message> {
  message: Message;
}

interface AssistantMessageProps extends MessageProps<AssistantMessage> {
  ask: (message: string) => unknown;
}

const VirtualAssistantMessage: FunctionComponent<AssistantMessageProps> = ({ message, ask }) => {
  return (
    <>
      <Split className="astro-chatbot">
        <SplitItem className="astro-user-icon">
          <Icon size="lg" className="pf-u-mr-sm">
            <RedHatIcon />
          </Icon>
        </SplitItem>
        <SplitItem className="astro-chatbot-dialog bubble">{message.content}</SplitItem>
      </Split>

      {message.options && (
        <div className="astro-options pf-u-pl-xl">
          {message.options.map((option) => (
            <Label
              key={option}
              render={({ className, content, componentRef }) => (
                <a className={className} ref={componentRef} onClick={() => ask(option)}>
                  {content}
                </a>
              )}
            >
              {option}
            </Label>
          ))}
        </div>
      )}

      <Split className="astro-chatbot">
        <SplitItem className="astro-user-icon">
          <Icon size="lg" className="pf-u-mr-sm">
            <RedHatIcon />
          </Icon>
        </SplitItem>
        <SplitItem className="astro-chatbot-dialog bubble pf-u-text-nowrap">
          Are these results helpful?
          <Button variant="plain" className="pf-u-pr-xs pf-u-py-0">
            <ThumbsUpIcon />
          </Button>
          <Button variant="plain" className="pf-u-pl-xs pf-u-py-0">
            <ThumbsDownIcon />
          </Button>
        </SplitItem>
      </Split>

    </>
  );
};

const UserAssistantMessage: FunctionComponent<MessageProps<UserMessage>> = ({ message }) => {
  return (
    <>
      <Split className="astro-user">
        <SplitItem className="astro-user-dialog bubble bubble-user">{message.content}</SplitItem>
        <SplitItem className="astro-user-icon">
          <Icon size="lg" className="pf-u-ml-sm">
            <UserIcon />
          </Icon>
        </SplitItem>
      </Split>
    </>
  );
};

const MESSAGE_CONTAINER = 'virtual-assistant-message-container';

const scrollMessageContainer = () => {
  const messageContainer = document.getElementById(MESSAGE_CONTAINER);

  if (messageContainer) {
    messageContainer.scrollTo(0, messageContainer.scrollHeight);
  }
};

/**
 * A smart component that handles all the api calls and data needed by the dumb components.
 * Smart components are usually classes.
 *
 * https://reactjs.org/docs/components-and-props.html
 * https://medium.com/@thejasonfile/dumb-components-and-smart-components-e7b33a698d43
 */
const SamplePage = () => {
  useEffect(() => {
    insights?.chrome?.appAction?.('sample-page');
  }, []);

  const [messages, setMessages] = useState<Array<Message>>([
    {
      from: From.ASSISTANT,
      content: 'Which set of Hybrid Cloud Console services can I help you with?',
      options: ['OpenShift', 'Ansible', 'RHEL', 'Cloud Native Development', 'Console Services'],
      isLoading: false,
    },
  ]);

  const [input, setInput] = useState<string>('');

  useLayoutEffect(() => {
    scrollMessageContainer();
  }, [messages]);

  const ask = async (optionalMessage?: string) => {
    const message = optionalMessage ?? input;
    if (message) {
      setMessages(
        produce((draft) => {
          draft.push(
            {
              from: From.USER,
              content: message,
            },
            {
              from: From.ASSISTANT,
              content: '',
              isLoading: true,
            }
          );
        })
      );

      setInput('');
      const response = await postTalk(message);
      setMessages(
        produce((draft) => {
          draft.pop();

          draft.push(
            ...response.map((response) => ({
              from: From.ASSISTANT,
              isLoading: false,
              content: response.text,
            }))
          );
        })
      );
    }
  };

  const handleKeyPress: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      ask();
    }
  };

  return (
    <React.Fragment>
      <PageHeader>
        <PageHeaderTitle title="Virtual assistant" />
      </PageHeader>
      <Main>
        <Stack className="astro-l-stack">
          <StackItem className="astro-l-stack__header pf-u-background-color-active-color-100">
            <Split hasGutter>
              <SplitItem isFilled>
                <TextContent className="pf-u-p-md pf-u-color-light-100">
                  <Text>Answer Blaster 3000-Ultra 2.0</Text>
                </TextContent>
              </SplitItem>
              <SplitItem>
                <Button variant="plain" aria-label="Action" className="pf-u-p-md pf-u-pr-0 pf-u-color-light-100">
                  <MinimizeIcon />
                </Button>
                <Button variant="plain" aria-label="Action" className="pf-u-p-md pf-u-pl-sm pf-u-color-light-100">
                  <TimesIcon />
                </Button>
              </SplitItem>
            </Split>
          </StackItem>
          <StackItem id={MESSAGE_CONTAINER} className="astro-l-stack__body pf-u-p-md pf-m-scrollable" isFilled>
            {messages.map((message) => {
              switch (message.from) {
                case From.ASSISTANT:
                  return <VirtualAssistantMessage message={message} ask={ask} />;
                case From.USER:
                  return <UserAssistantMessage message={message} />;
              }
            })}
          </StackItem>
          <StackItem className="astro-l-stack__footer">
            <InputGroup>
              <TextInput
                value={input}
                onChange={setInput}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                name=""
                id=""
                type="text"
                aria-label=""
              />
              <InputGroupText id="username">
                <Button onClick={() => ask()} variant="plain" className="pf-u-px-sm">
                  <PlaneIcon />
                </Button>
              </InputGroupText>
            </InputGroup>
          </StackItem>
        </Stack>
      </Main>
    </React.Fragment>
  );
};

export default SamplePage;
