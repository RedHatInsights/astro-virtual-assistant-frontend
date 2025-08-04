import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import {
  AIStateProvider,
  useConversations,
  useCreateNewConversation,
  useIsInitializing,
  useSetActiveConversation,
} from '@redhat-cloud-services/ai-react-state';
import { IFDClient } from '@redhat-cloud-services/arh-client';
import { Chatbot, ChatbotConversationHistoryNav, ChatbotDisplayMode } from '@patternfly/chatbot';
import { Bullseye, Spinner } from '@patternfly/react-core';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

import useScrollToBottom from './useScrollToBottom';
import ARHHeader from './ARHHeader';
import ARHMessages from './ARHMessages';
import ARHFooter from './ARHFooter';
import emptyAvatar from './img_avatar.svg';
import type { ChromeUser } from '@redhat-cloud-services/types';

import '@patternfly/chatbot/dist/css/main.css';

const ARHProvider = ({ children, baseUrl }: PropsWithChildren<{ baseUrl: string }>) => {
  const chrome = useChrome();
  const stateManager = useMemo(() => {
    const client = new IFDClient({
      // Will change to ARH
      baseUrl,
      fetchFunction: async (input, options) => {
        const token = await chrome.auth.getToken();
        if (!token) {
          throw new Error('User is not authenticated');
        }
        return fetch(input, {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      },
    });
    const stateManager = createClientStateManager(client);
    stateManager.init();
    return stateManager;
  }, [baseUrl]);

  return <AIStateProvider stateManager={stateManager}>{children}</AIStateProvider>;
};

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
  const conversations = useConversations();
  const createNewConversation = useCreateNewConversation();
  const setActiveConversation = useSetActiveConversation();
  const scrollToBottomRef = useScrollToBottom(isBannerOpen);
  const initializingMessages = useIsInitializing();
  const [conversationsDrawerOpened, setConversationsDrawerOpened] = useState(false);
  const [displayMode, setDisplayMode] = useState<ChatbotDisplayMode>(ChatbotDisplayMode.default);

  async function handleNewChat() {
    if (initializingMessages) {
      return;
    }
    try {
      await createNewConversation();
    } catch (error) {
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
    <div id="ai-chatbot" aria-label="AI Assistant Chatbot">
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
          onNewChat={handleNewChat}
          conversations={conversations.map((conversation) => ({
            id: conversation.id,
            text: conversation.title,
          }))}
          drawerContent={drawerContent}
        />
      </Chatbot>
    </div>
  );
};

const ChromeConnector = ({ baseUrl, setOpen, user }: { baseUrl: string; setOpen: (isOpen: boolean) => void; user: ChromeUser }) => {
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
    <ARHProvider baseUrl={baseUrl}>
      <ARHChatbot avatar={avatar} setOpen={setOpen} isBannerOpen={isBannerOpen} setIsBannerOpen={setIsBannerOpen} username={username} />
    </ARHProvider>
  );
};

export default ChromeConnector;
