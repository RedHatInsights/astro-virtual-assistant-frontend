import React, { KeyboardEventHandler, useCallback, useEffect, useLayoutEffect } from 'react';

import { Main } from '@redhat-cloud-services/frontend-components/Main';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';

import { Button, InputGroup, InputGroupText, Split, SplitItem, Stack, StackItem, Text, TextArea, TextContent } from '@patternfly/react-core';

import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import PlaneIcon from '@patternfly/react-icons/dist/esm/icons/paper-plane-icon';

import './landing-page.scss';
import { From, MessageOption } from '../../types/Message';
import { AssistantMessageEntry } from '../../Components/Message/AssistantMessageEntry';
import { UserMessageEntry } from '../../Components/Message/UserMessageEntry';
import { LoadingMessageEntry } from '../../Components/Message/LoadingMessageEntry';
import { FeedbackAssistantEntry } from '../../Components/Message/FeedbackMessageEntry';
import { useAstro } from './useAstro';

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
const LandingPage = () => {
  useEffect(() => {
    insights?.chrome?.appAction?.('sample-page');
  }, []);

  const { messages, input, setInput, ask } = useAstro();

  useLayoutEffect(() => {
    scrollMessageContainer();
  }, [messages]);

  useEffect(() => {
    void ask('/intent_core_session_start', {
      hideMessage: true,
    });
  }, []);

  const handleKeyPress: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      if (!event.shiftKey) {
        void ask();
      }
    }
  };

  const askFromOption = useCallback(
    (option: MessageOption) => {
      return ask(option.payload, {
        label: option.title,
      });
    },
    [ask]
  );

  return (
    <React.Fragment>
      <PageHeader className="">
        <PageHeaderTitle title="Virtual assistant" />
      </PageHeader>
      <Main>
        <Stack className="astro-l-stack">
          <StackItem className="astro-l-stack__header pf-v5-pt-md pf-v5-u-pb-md">
            <Split hasGutter>
              <SplitItem isFilled>
                <TextContent className="pf-v5-u-p-md pf-u-color-light-100 pf-v5-u-font-size-3xl">
                  <Text>Virtual Assistant</Text>
                </TextContent>
              </SplitItem>
              <SplitItem>
                <Button variant="plain" aria-label="Action" className="pf-v5-u-p-md pf-v5-u-pl-sm pf-v5-u-color-light-100">
                  <TimesIcon />
                </Button>
              </SplitItem>
            </Split>
          </StackItem>
          <StackItem
            id={MESSAGE_CONTAINER}
            className="astro-l-stack__body pf-v5-u-px-md pf-v5-u-pt-2xl pf-v5-m-scrollable pf-v5-u-background-color-100"
            isFilled
          >
            {messages.map((message, index) => {
              if ('isLoading' in message && message.isLoading) {
                return <LoadingMessageEntry key={index} />;
              }

              switch (message.from) {
                case From.ASSISTANT:
                  return <AssistantMessageEntry message={message} ask={askFromOption} key={index} />;
                case From.USER:
                  return <UserMessageEntry message={message} key={index} />;
                case From.FEEDBACK:
                  return <FeedbackAssistantEntry key={index} />;
              }
            })}
          </StackItem>
          <StackItem className="astro-l-stack__footer">
            <InputGroup>
              <TextArea
                value={input}
                onChange={setInput}
                onKeyPressCapture={handleKeyPress}
                placeholder="Type a message..."
                name="user-query"
                type="text"
                aria-label="User question"
                className="pf-v5-u-pt-md pf-v5-u-pl-md"
              />
              <InputGroupText id="username">
                <Button onClick={() => ask()} variant="plain" className="pf-v5-u-px-sm">
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
