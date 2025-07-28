import { ChatbotContent, ChatbotWelcomePrompt, Message, MessageBox } from '@patternfly/chatbot';
import React, { Fragment, useEffect, useMemo } from 'react';
import { useActiveConversation, useMessages } from '@redhat-cloud-services/ai-react-state';
import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Content, Split, SplitItem } from '@patternfly/react-core';
import { ChevronLeftIcon, ChevronRightIcon } from '@patternfly/react-icons';
import ARHBanner from './ARHBanner';
import { ARH_ICON } from './ARHIcon';

type ARHSource = {
  title: string;
  body: string;
  link: string;
};

const ARHSourceCard = ({ sources }: { sources: ARHSource[] }) => {
  const [activeSourceIndex, setActiveSourceIndex] = React.useState(0);
  const source = sources[activeSourceIndex];
  if (sources.length === 0) {
    return null;
  }

  function handleChangeSource(step: number) {
    const newIndex = activeSourceIndex + step;
    if (newIndex >= 0 && newIndex < sources.length) {
      setActiveSourceIndex(newIndex);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Button variant="link" target="_blank" rel="noopener noreferrer" href={source.link}>
            {source.title}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardBody>{source.body}</CardBody>
      <CardFooter>
        <Split>
          <SplitItem>
            <Button aria-label="Previous source" onClick={() => handleChangeSource(-1)} variant="plain" icon={<ChevronLeftIcon />} />
          </SplitItem>
          <SplitItem isFilled>
            {activeSourceIndex + 1}/{sources.length} &nbsp;
          </SplitItem>
          <SplitItem>
            <Button aria-label="Next source" onClick={() => handleChangeSource(1)} variant="plain" icon={<ChevronRightIcon />} />
          </SplitItem>
        </Split>
      </CardFooter>
    </Card>
  );
};

const ARHMessages = ({
  isBannerOpen,
  avatar,
  setIsBannerOpen,
  username,
  scrollToBottomRef,
}: {
  username?: string;
  avatar: string;
  setIsBannerOpen: (isOpen: boolean) => void;
  isBannerOpen: boolean;
  scrollToBottomRef: React.RefObject<HTMLDivElement>;
}) => {
  const activeConversation = useActiveConversation();
  const messages = useMessages<{ sources: ARHSource[] }>();
  const welcomeMessageConfig = useMemo(() => {
    return { title: `Hello${username ? `, ${username}` : ''}`, description: 'How may I help you today?' };
  }, [username]);
  useEffect(() => {
    if (activeConversation?.locked) {
      setIsBannerOpen(true);
    }
  }, [activeConversation?.id, setIsBannerOpen]);

  return (
    // The PF seems to be doing some sort of caching, we have to force reset the elements on conversation change
    <ChatbotContent key={activeConversation?.id || 'no-active-conversation'}>
      <MessageBox>
        <ARHBanner variant={activeConversation?.locked ? 'readOnly' : 'privacy'} isOpen={isBannerOpen} setOpen={setIsBannerOpen} />
        {messages.length === 0 && <ChatbotWelcomePrompt {...welcomeMessageConfig} className="pf-v6-u-mt-auto" />}
        {messages.map((message, index) => (
          <Fragment key={message.id || index}>
            <Message
              id={`message-${message.id}`}
              isLoading={message.role === 'bot' && message.answer === ''}
              role={message.role}
              avatar={message.role === 'user' ? avatar : ARH_ICON}
              content={message.answer}
              aria-label={`${message.role === 'user' ? 'Your message' : 'AI response'}: ${message.answer}`}
            />
            {message.additionalAttributes?.sources && <ARHSourceCard sources={message.additionalAttributes.sources} />}
          </Fragment>
        ))}
        <div ref={scrollToBottomRef}></div>
      </MessageBox>
    </ChatbotContent>
  );
};

export default ARHMessages;
