import React, { useEffect, useRef, useState } from 'react';
import { StateManager } from '@redhat-cloud-services/ai-client-state';
import {
  AIStateProvider,
  useConversations,
  useCreateNewConversation,
  useInitLimitation,
  useIsInitializing,
  useSetActiveConversation,
} from '@redhat-cloud-services/ai-react-state';
import { IFDClient } from '@redhat-cloud-services/arh-client';
import { Chatbot, ChatbotConversationHistoryNav, ChatbotDisplayMode } from '@patternfly/chatbot';
import { Bullseye, Spinner } from '@patternfly/react-core';

import useScrollToBottom from './useScrollToBottom';
import ARHHeader from './ARHHeader';
import ARHMessages from './ARHMessages';
import ARHFooter from './ARHFooter';
import emptyAvatar from './img_avatar.svg';
import type { ChromeUser } from '@redhat-cloud-services/types';

import '@patternfly/chatbot/dist/css/main.css';
import ARHNewChatModal from './ARHNewChatModal';

export const ARHChatbot = ({
  avatar,
  setOpen,
  isBannerOpen,
  setIsBannerOpen,
  username,
}: {
  avatar: string;
  setOpen: (isOpen: boolean) => void;
  isBannerOpen: boolean;
  setIsBannerOpen: (isOpen: boolean) => void;
  username: string;
}) => {
  const rootElementRef = useRef<HTMLDivElement>(null);
  const conversations = useConversations();
  const createNewConversation = useCreateNewConversation();
  const setActiveConversation = useSetActiveConversation();
  const scrollToBottomRef = useScrollToBottom(isBannerOpen);
  const initLimitations = useInitLimitation();
  const initializingMessages = useIsInitializing();
  const [conversationsDrawerOpened, setConversationsDrawerOpened] = useState(false);
  const [displayMode, setDisplayMode] = useState<ChatbotDisplayMode>(ChatbotDisplayMode.default);
  const [showNewConversationWarning, setShowNewConversationWarning] = useState(false);

  async function handleNewChat() {
    if (initializingMessages) {
      return;
    }
    try {
      setShowNewConversationWarning(false);
      await createNewConversation();
      setConversationsDrawerOpened(false);
    } catch (error) {
      setShowNewConversationWarning(false);
      // Some alert handling should be done here
      console.error('Error creating new conversation:', error);
    }
  }

  let drawerContent = null;
  if (initializingMessages) {
    drawerContent = (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  } else {
    drawerContent = (
      <>
        <ARHHeader
          conversationsDrawerOpened={conversationsDrawerOpened}
          setConversationsDrawerOpened={setConversationsDrawerOpened}
          scrollToBottomRef={scrollToBottomRef}
          setOpen={setOpen}
          setDisplayMode={setDisplayMode}
          displayMode={displayMode}
        />
        <ARHMessages
          isBannerOpen={isBannerOpen}
          avatar={avatar}
          username={username}
          scrollToBottomRef={scrollToBottomRef}
          setIsBannerOpen={setIsBannerOpen}
        />
        <ARHFooter />
      </>
    );
  }

  useEffect(() => {
    if (displayMode === ChatbotDisplayMode.fullscreen) {
      setConversationsDrawerOpened(true);
    }

    if (displayMode === ChatbotDisplayMode.default) {
      setConversationsDrawerOpened(false);
    }
  }, [displayMode]);

  return (
    <div ref={rootElementRef} id="ai-chatbot" aria-label="AI Assistant Chatbot">
      <Chatbot displayMode={displayMode}>
        <ChatbotConversationHistoryNav
          displayMode={displayMode}
          isDrawerOpen={conversationsDrawerOpened}
          onDrawerToggle={() => setConversationsDrawerOpened((prev) => !prev)}
          setIsDrawerOpen={setConversationsDrawerOpened}
          onSelectActiveItem={(_e, conversationId) => {
            setActiveConversation(`${conversationId}`);
            if (displayMode === ChatbotDisplayMode.default) {
              setConversationsDrawerOpened(false);
            }
          }}
          // do not allow sending new chats if quota is breached
          onNewChat={initLimitations?.reason === 'quota-breached' ? undefined : () => setShowNewConversationWarning(true)}
          conversations={conversations.map((conversation) => ({
            id: conversation.id,
            text: conversation.title,
          }))}
          drawerContent={drawerContent}
        />
      </Chatbot>
      <ARHNewChatModal
        isOpen={showNewConversationWarning}
        onClose={() => setShowNewConversationWarning(false)}
        createNewChat={handleNewChat}
        parentRef={rootElementRef}
      />
    </div>
  );
};

const ChromeConnector = ({
  setOpen,
  user,
  stateManager,
}: {
  setOpen: (isOpen: boolean) => void;
  user: ChromeUser;
  stateManager: StateManager<Record<string, unknown>, IFDClient>;
}) => {
  const [isBannerOpen, setIsBannerOpen] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [avatar, setAvatar] = useState<string>(emptyAvatar);
  function handleUserSetup() {
    if (user) {
      const url = `https://access.redhat.com/api/users/avatar/${user.identity.user?.username ?? ''}/`;
      // check if the image loads before setting state
      const img = new Image();
      img.src = url;
      img.onload = () => {
        if (img.width === 140) {
          setAvatar(img.src);
        }
      };
      setUsername(user.identity.user?.username ?? '');
    }
  }
  useEffect(() => {
    handleUserSetup();
  }, [user]);

  return (
    <AIStateProvider stateManager={stateManager}>
      <ARHChatbot avatar={avatar} setOpen={setOpen} isBannerOpen={isBannerOpen} setIsBannerOpen={setIsBannerOpen} username={username} />
    </AIStateProvider>
  );
};

export default ChromeConnector;
