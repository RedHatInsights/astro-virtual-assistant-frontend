import { ChatbotContent, ChatbotWelcomePrompt, Message, MessageBox, SourcesCard } from '@patternfly/chatbot';
import React, { Fragment, useEffect, useMemo } from 'react';
import { useActiveConversation, useMessages } from '@redhat-cloud-services/ai-react-state';
import ARHBanner from './ARHBanner';
import ARH_BOT_ICON from './Ask_Red_Hat_OFFICIAL-whitebackground.svg';

import './ARHMessages.scss';

type ARHSource = {
  title: string;
  body: string;
  link: string;
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
          <Fragment key={index}>
            <Message
              id={`message-${message.id}`}
              // Don't want users to paste MD and display it
              isMarkdownDisabled={message.role === 'user'}
              isLoading={message.role === 'bot' && message.answer === ''}
              role={message.role}
              avatar={message.role === 'user' ? avatar : ARH_BOT_ICON}
              content={message.answer}
              aria-label={`${message.role === 'user' ? 'Your message' : 'AI response'}: ${message.answer}`}
              sources={
                Array.isArray(message.additionalAttributes?.sources) && message.additionalAttributes.sources.length > 0
                  ? { sources: message.additionalAttributes.sources }
                  : undefined
              }
            />
          </Fragment>
        ))}
        <div ref={scrollToBottomRef}></div>
      </MessageBox>
    </ChatbotContent>
  );
};

export default ARHMessages;
