import React, { KeyboardEventHandler, useEffect, useLayoutEffect, useState } from 'react';

import { Main } from '@redhat-cloud-services/frontend-components/Main';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';

import { Button, InputGroup, InputGroupText, Split, SplitItem, Stack, StackItem, Text, TextContent, TextInput } from '@patternfly/react-core';

import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import PlaneIcon from '@patternfly/react-icons/dist/esm/icons/paper-plane-icon';
import MinimizeIcon from '@patternfly/react-icons/dist/esm/icons/window-minimize-icon';

import './landing-page.scss';
import { postTalk } from '../../api/PostTalk';
import { produce } from 'immer';
import { From, Message } from '../../types/Message';
import { AssistantMessageEntry } from '../../Components/Message/AssistantMessageEntry';
import { UserMessageEntry } from '../../Components/Message/UserMessageEntry';

const MESSAGE_CONTAINER = 'virtual-assistant-message-container';
const MIN_DELAY_PER_RESPONSE_MS = 750;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
const LandingPage = () => {
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

      const startTime = new Date().getTime();
      const response = await postTalk(message);

      let time = Math.max(MIN_DELAY_PER_RESPONSE_MS - (new Date().getTime() - startTime), 0);

      for (let i = 0; i < response.length; i++) {
        const message = response[i];
        await sleep(time);
        setMessages(
          produce((draft) => {
            const last = draft[draft.length - 1];
            if (last.from === From.ASSISTANT && last.isLoading) {
              draft.pop();
            }

            draft.push({
              from: From.ASSISTANT,
              isLoading: false,
              content: message.text,
            });

            if (i < response.length - 1) {
              draft.push({
                from: From.ASSISTANT,
                isLoading: true,
                content: '',
              });
            }
          })
        );

        time = MIN_DELAY_PER_RESPONSE_MS;
      }
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
                  <Text>Answer Blaster 3000</Text>
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
          <StackItem id={MESSAGE_CONTAINER} className="astro-l-stack__body pf-u-p-md pf-m-scrollable pf-u-background-color-100" isFilled>
            {messages.map((message) => {
              switch (message.from) {
                case From.ASSISTANT:
                  return <AssistantMessageEntry message={message} ask={ask} />;
                case From.USER:
                  return <UserMessageEntry message={message} />;
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

export default LandingPage;
