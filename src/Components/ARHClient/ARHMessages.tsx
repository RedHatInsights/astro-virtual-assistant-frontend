import { ChatbotContent, ChatbotWelcomePrompt, Message, MessageBox, SourcesCardProps } from '@patternfly/chatbot';
import { Alert } from '@patternfly/react-core';
import React, { Fragment, useEffect, useMemo } from 'react';
import { useActiveConversation, useInitLimitation, useMessages } from '@redhat-cloud-services/ai-react-state';
import { Message as MessageType } from '@redhat-cloud-services/ai-client-state';
import { IFDAdditionalAttributes } from '@redhat-cloud-services/arh-client';
import { useNavigate } from 'react-router-dom';

import ARHBanner from './ARHBanner';
import ARH_BOT_ICON from './Ask_Red_Hat_OFFICIAL-whitebackground.svg';
import { useMessageFeedback } from './useMessageFeedback';
import useArhMessageQuota from './useArhMessageQuota';

import './ARHMessages.scss';

const currentUrl = new URL(window.location.href);

function MessageEntry({ message, avatar }: { message: MessageType<IFDAdditionalAttributes>; avatar: string }) {
  const navigate = useNavigate();
  const { messageActions, userFeedbackForm, feedbackCompleted } = useMessageFeedback(message);
  const sources = useMemo(() => {
    if (!message.additionalAttributes?.sources || message.additionalAttributes.sources.length === 0) {
      return undefined;
    }

    const sourceItems = message.additionalAttributes.sources.reduce<SourcesCardProps['sources']>((acc, source) => {
      if (source.title && source.link) {
        let isExternal = true;
        try {
          const linkUrl = new URL(source.link);
          isExternal = linkUrl.origin !== currentUrl.origin;
        } catch (error) {
          isExternal = true;
        }
        acc.push({
          title: source.title,
          link: source.link,
          body: source.snippet,
          isExternal,
          onClick: (event) => {
            // handle internal HCC navigation
            if (!isExternal && source.link?.startsWith('/')) {
              event.preventDefault();
              event.stopPropagation();
              navigate(source.link);
            }
          },
        });
      }
      return acc;
    }, []);
    return { sources: sourceItems };
  }, [message.additionalAttributes, navigate]);
  console.log({ message });

  const messageDate = `${message.date?.toLocaleDateString()} ${message.date?.toLocaleTimeString()}`;

  const quota = useArhMessageQuota(message);
  return (
    <>
      <Message
        id={`message-${message.id}`}
        // Don't want users to paste MD and display it
        isMarkdownDisabled={message.role === 'user'}
        isLoading={message.role === 'bot' && message.answer === ''}
        role={message.role}
        avatar={message.role === 'user' ? avatar : ARH_BOT_ICON}
        content={message.answer}
        aria-label={`${message.role === 'user' ? 'Your message' : 'AI response'}: ${message.answer}`}
        sources={sources}
        actions={messageActions}
        userFeedbackForm={userFeedbackForm}
        userFeedbackComplete={feedbackCompleted}
        timestamp={messageDate}
      />
      {/* Will require new PF API to add alerts directly to the message layout */}
      {quota && <Alert {...quota} />}
    </>
  );
}

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
  const initLimitations = useInitLimitation();
  const messages = useMessages<IFDAdditionalAttributes>();
  const welcomeMessageConfig = useMemo(() => {
    return {
      title: `Hello${username ? `, ${username}` : ''}`,
      description: 'How may I help you today?',
      content: `Hello Hallo Hola Bonjour こんにちは Olá مرحباً Ahoj Ciao 안녕하세요 Hallo 你好\n\nGet answers from our library of support resources.`,
    };
  }, [username]);
  const bannerVariant = useMemo(() => {
    if (initLimitations?.reason === 'quota-breached') {
      return 'conversationLimit';
    }
    return activeConversation?.locked ? 'readOnly' : 'privacy';
  }, [initLimitations, activeConversation]);
  useEffect(() => {
    if (activeConversation?.locked) {
      setIsBannerOpen(true);
    }
  }, [activeConversation?.id, setIsBannerOpen]);

  return (
    // The PF seems to be doing some sort of caching, we have to force reset the elements on conversation change
    <ChatbotContent key={activeConversation?.id || 'no-active-conversation'}>
      <MessageBox>
        <ARHBanner variant={bannerVariant} isOpen={isBannerOpen} setOpen={setIsBannerOpen} />
        {messages.length === 0 && (
          <>
            <ChatbotWelcomePrompt {...welcomeMessageConfig} className="pf-v6-u-mt-auto" />
            <Message
              timestamp={`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`}
              id="welcome-message"
              role="bot"
              avatar={ARH_BOT_ICON}
              content={welcomeMessageConfig.content}
            />
          </>
        )}
        {messages.map((message, index) => (
          <Fragment key={index}>
            <MessageEntry message={message} avatar={avatar} />
          </Fragment>
        ))}
        <div ref={scrollToBottomRef}></div>
      </MessageBox>
    </ChatbotContent>
  );
};

export default ARHMessages;
