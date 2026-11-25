import { ChatbotContent, ChatbotWelcomePrompt, Message, MessageBox } from '@patternfly/chatbot';
import { Alert, Bullseye, Spinner } from '@patternfly/react-core';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useActiveConversation, useInitLimitation, useIsInitializing, useMessages, useSendMessage } from '@redhat-cloud-services/ai-react-state';
import { Message as MessageType } from '@redhat-cloud-services/ai-client-state';
import { IFDAdditionalAttributes } from '@redhat-cloud-services/arh-client';

import { WelcomeConfig } from '../../aiClients/types';

import UniversalBanner from './UniversalBanner';
import ARH_BOT_ICON from '../../assets/Ask_Red_Hat_OFFICIAL-whitebackground.svg';
import useArhMessageQuota from '../ARHClient/useArhMessageQuota';
import { MAS_DEBUG_MESSAGE_EVENT, isMASDebugEnabled } from '../MASClient/MASDebug';
import { MASWidget, parseDebugMessage } from '../MASClient/MASWidgets';

interface DebugReply {
  message: MessageType<{ widgets: MASWidget[]; turnId: string }>;
  afterMessageCount: number;
}

// The state manager has no local append API and reloads history on conversation
// switches. Keep debug entries outside it, anchored at the current list boundary.
function mergeDebugReplies(messages: MessageType[], replies: DebugReply[]): MessageType[] {
  const merged: MessageType[] = [];
  for (let index = 0; index <= messages.length; index++) {
    replies.forEach(({ message, afterMessageCount }) => {
      if (Math.min(afterMessageCount, messages.length) === index) merged.push(message);
    });
    if (index < messages.length) merged.push(messages[index]);
  }
  return merged;
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
  isMas = false,
}: {
  username?: string;
  avatar: string;
  setIsBannerOpen: (isOpen: boolean) => void;
  isBannerOpen: boolean;
  scrollToBottomRef: React.RefObject<HTMLDivElement>;
  MessageEntryComponent?: React.ComponentType<any>;
  isCompact?: boolean;
  welcome?: WelcomeConfig;
  isMas?: boolean;
}) => {
  const activeConversation = useActiveConversation();
  const initLimitations = useInitLimitation();
  const messages = useMessages<IFDAdditionalAttributes>();
  const initializingMessages = useIsInitializing();
  const sendMessage = useSendMessage();
  const [debugReplies, setDebugReplies] = useState<Record<string, DebugReply[]>>({});
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!isMASDebugEnabled() || !isMas || !activeConversation?.id) return;
    const conversationId = activeConversation.id;
    const onDebugMessage = (event: Event) => {
      try {
        const { answer, widgets, turnId } = parseDebugMessage((event as CustomEvent<unknown>).detail);
        const date = new Date();
        const afterMessageCount = messagesRef.current.length;
        setDebugReplies((previous) => ({
          ...previous,
          [conversationId]: [
            ...(previous[conversationId] || []),
            {
              afterMessageCount,
              message: {
                id: `debug-${date.getTime()}-${(previous[conversationId] || []).length}`,
                role: 'bot',
                answer,
                date,
                additionalAttributes: { widgets, turnId },
              },
            },
          ],
        }));
      } catch (error) {
        console.error('Invalid MAS debug message:', error);
      }
    };
    window.addEventListener(MAS_DEBUG_MESSAGE_EVENT, onDebugMessage);
    return () => window.removeEventListener(MAS_DEBUG_MESSAGE_EVENT, onDebugMessage);
  }, [isMas, activeConversation?.id]);

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

  if (initializingMessages) {
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
        {mergeDebugReplies(messages, isMas && activeConversation?.id ? debugReplies[activeConversation.id] || [] : []).map((message, index) => (
          <MessageEntryComponent key={index} message={message} avatar={avatar} isCompact={isCompact} conversationId={activeConversation?.id} />
        ))}
        <div ref={scrollToBottomRef}></div>
      </MessageBox>
    </ChatbotContent>
  );
};

export default UniversalMessages;
