import React, { useMemo } from 'react';
import { IFDAdditionalAttributes } from '@redhat-cloud-services/arh-client';
import { Message as MessageType } from '@redhat-cloud-services/ai-client-state';
import { useNavigate } from 'react-router-dom';
import { Message, SourcesCardProps } from '@patternfly/chatbot';

import { useMessageFeedback } from './useMessageFeedback';
import useArhMessageQuota from './useArhMessageQuota';
import ARH_BOT_ICON from '../../assets/Ask_Red_Hat_OFFICIAL-whitebackground.svg';
import { Alert } from '@patternfly/react-core';

import './ARHMessages.scss';

const currentUrl = new URL(window.location.href);

function ARHMessageEntry({ message, avatar }: { message: MessageType<IFDAdditionalAttributes>; avatar: string }) {
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
        } catch {
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

export default ARHMessageEntry;
