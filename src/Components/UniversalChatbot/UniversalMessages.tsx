import { ChatbotContent, ChatbotWelcomePrompt, Message, MessageBox } from '@patternfly/chatbot';
import { Alert, Bullseye, Spinner } from '@patternfly/react-core';
import React, { useEffect, useMemo, useState } from 'react';
import { useActiveConversation, useInitLimitation, useIsInitializing, useMessages, useSendMessage } from '@redhat-cloud-services/ai-react-state';
import { Message as MessageType } from '@redhat-cloud-services/ai-client-state';
import { IFDAdditionalAttributes } from '@redhat-cloud-services/arh-client';

import { WelcomeConfig } from '../../aiClients/types';

import UniversalBanner from './UniversalBanner';
import ARH_BOT_ICON from '../../assets/Ask_Red_Hat_OFFICIAL-whitebackground.svg';
import useArhMessageQuota from '../ARHClient/useArhMessageQuota';
import MASMessageEntry from '../MASClient/MASMessageEntry';
import { ComponentPreviewTarget, MAS_PREVIEW_EVENT, isComponentPreviewEnabled, parsePreviewTarget } from '../MASClient/ComponentPreview';

interface PreviewReply {
  target: ComponentPreviewTarget;
  date: Date;
}

function MessageEntry({ message, avatar, isCompact }: { message: MessageType; avatar: string; isCompact?: boolean }) {
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
        timestamp={messageDate}
        isCompact={isCompact}
      />
      {/* Will require new PF API to add alerts directly to the message layout */}
      {quota && <Alert {...quota} />}
    </>
  );
}

const UniversalMessages = ({
  isBannerOpen,
  avatar,
  setIsBannerOpen,
  username,
  scrollToBottomRef,
  MessageEntryComponent = MessageEntry,
  isCompact,
  welcome,
}: {
  username?: string;
  avatar: string;
  setIsBannerOpen: (isOpen: boolean) => void;
  isBannerOpen: boolean;
  scrollToBottomRef: React.RefObject<HTMLDivElement>;
  MessageEntryComponent?: React.ComponentType<any>;
  isCompact?: boolean;
  welcome?: WelcomeConfig;
}) => {
  const activeConversation = useActiveConversation();
  const initLimitations = useInitLimitation();
  const messages = useMessages<IFDAdditionalAttributes>();
  const initializingMessages = useIsInitializing();
  const sendMessage = useSendMessage();
  const [previews, setPreviews] = useState<PreviewReply[]>([]);

  useEffect(() => {
    if (!isComponentPreviewEnabled()) return;
    const onPreview = (event: Event) => {
      try {
        const target = parsePreviewTarget((event as CustomEvent<unknown>).detail);
        const date = new Date();
        setPreviews((previous) => [...previous, { target, date }]);
      } catch (error) {
        console.error('Invalid MAS component preview:', error);
      }
    };
    window.addEventListener(MAS_PREVIEW_EVENT, onPreview);
    return () => window.removeEventListener(MAS_PREVIEW_EVENT, onPreview);
  }, []);

  const welcomeMessageConfig = useMemo(() => {
    return {
      title: `Hello${username ? `, ${username}` : ''}`,
      description: 'How may I help you today?',
      content: welcome?.content,
    };
  }, [username, welcome?.content]);

  const welcomePrompts = useMemo(() => {
    return welcome?.buttons?.map((button) => ({
      title: button.title,
      message: button.message,
      onClick: () => {
        sendMessage(button.value, { stream: true });
      },
    }));
  }, [welcome?.buttons, sendMessage]);
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

  if (initializingMessages && previews.length === 0) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    // The PF seems to be doing some sort of caching, we have to force reset the elements on conversation change
    <ChatbotContent>
      <MessageBox>
        <UniversalBanner variant={bannerVariant} isOpen={isBannerOpen} setOpen={setIsBannerOpen} />
        <ChatbotWelcomePrompt {...welcomeMessageConfig} className="pf-v6-u-mt-auto" isCompact={isCompact} prompts={welcomePrompts} />
        {welcomeMessageConfig.content && (
          <Message
            timestamp={`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`}
            id="welcome-message"
            role="bot"
            avatar={ARH_BOT_ICON}
            content={welcomeMessageConfig.content}
            isCompact={isCompact}
          />
        )}
        {messages.map((message, index) => (
          <MessageEntryComponent key={index} message={message} avatar={avatar} isCompact={isCompact} conversationId={activeConversation?.id} />
        ))}
        {previews.map(({ target, date }, index) => (
          <MASMessageEntry
            key={`preview-${index}`}
            message={{ id: `preview-${index}`, role: 'bot', answer: 'Local component preview', date }}
            avatar={avatar}
            isCompact={isCompact}
            previewTarget={target}
          />
        ))}
        <div ref={scrollToBottomRef}></div>
      </MessageBox>
    </ChatbotContent>
  );
};

export default UniversalMessages;
