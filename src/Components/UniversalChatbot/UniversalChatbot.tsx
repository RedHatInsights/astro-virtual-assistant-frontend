import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { useConversations, useInitLimitation, useSetActiveConversation } from '@redhat-cloud-services/ai-react-state';
import { Chatbot, ChatbotConversationHistoryNav, ChatbotDisplayMode } from '@patternfly/chatbot';

import UniversalChatbotProvider, { ChatbotProps } from './UniversalChatbotProvider';
import emptyAvatar from '../../assets/img_avatar.svg';
import useScrollToBottom from './useScrollToBottom';
import UniversalHeader from './UniversalHeader';
import UniversalFooter from './UniversalFooter';
import UniversalMessages from './UniversalMessages';

import '@patternfly/chatbot/dist/css/main.css';
import UniversalAssistantSelection from './UniversalAssistantSelection';
import { MenuItemAction } from '@patternfly/react-core';
import { TrashAltIcon } from '@patternfly/react-icons';
import DeleteConversationModal from './DeleteConversationModal';

function UniversalChatbot({
  user,
  setOpen,
  hasHistory,
  canDeleteHistory,
  streamMessages,
  displayMode,
  isCompact,
  setDisplayMode,
  MessageEntryComponent,
  FooterComponent = UniversalFooter,
  children,
  model,
  setCurrentModel,
  availableManagers,
  handleNewChat,
}: PropsWithChildren<ChatbotProps>) {
  const [isBannerOpen, setIsBannerOpen] = useState(true);
  const [deleteConversation, setDeleteConversation] = React.useState<string>();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(emptyAvatar);

  const rootElementRef = useRef<HTMLDivElement>(null);
  const conversations = useConversations();
  const setActiveConversation = useSetActiveConversation();
  const scrollToBottomRef = useScrollToBottom(isBannerOpen);
  const initLimitations = useInitLimitation();
  const [conversationsDrawerOpened, setConversationsDrawerOpened] = useState(false);
  const [showNewConversationWarning, setShowNewConversationWarning] = useState(false);
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

  const manager = availableManagers.find((m) => m.model === model);

  useEffect(() => {
    if (manager) {
      // notify any subscribed components that the manager has changed and they should re-render
      manager.stateManager.notifyAll();
    }
  }, [manager]);

  const drawerContent = (
    <>
      <UniversalHeader
        hasHistory={hasHistory}
        conversationsDrawerOpened={conversationsDrawerOpened}
        scrollToBottomRef={scrollToBottomRef}
        setOpen={setOpen}
        setDisplayMode={setDisplayMode}
        displayMode={displayMode}
        isCompact={isCompact}
      />
      <UniversalAssistantSelection containerRef={rootElementRef} />
      <UniversalMessages
        isBannerOpen={isBannerOpen}
        avatar={avatar}
        username={username}
        scrollToBottomRef={scrollToBottomRef}
        setIsBannerOpen={setIsBannerOpen}
        MessageEntryComponent={MessageEntryComponent}
        isCompact={isCompact}
      />
      <FooterComponent streamMessages={streamMessages} isCompact={isCompact} />
    </>
  );

  if (!hasHistory) {
    return (
      <UniversalChatbotProvider
        model={model}
        setCurrentModel={setCurrentModel}
        setConversationsDrawerOpened={setConversationsDrawerOpened}
        rootElementRef={rootElementRef}
        setShowNewConversationWarning={setShowNewConversationWarning}
        showNewConversationWarning={showNewConversationWarning}
        availableManagers={availableManagers}
      >
        <div ref={rootElementRef} id="ai-chatbot" aria-label="AI Assistant Chatbot">
          <Chatbot displayMode={displayMode}>{drawerContent}</Chatbot>
          {children}
        </div>
      </UniversalChatbotProvider>
    );
  }

  return (
    <UniversalChatbotProvider
      model={model}
      setCurrentModel={setCurrentModel}
      setConversationsDrawerOpened={setConversationsDrawerOpened}
      rootElementRef={rootElementRef}
      setShowNewConversationWarning={setShowNewConversationWarning}
      showNewConversationWarning={showNewConversationWarning}
      availableManagers={availableManagers}
    >
      <div ref={rootElementRef} id="ai-chatbot" aria-label="AI Assistant Chatbot">
        <Chatbot displayMode={displayMode} isCompact={isCompact}>
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
            onNewChat={
              initLimitations?.reason === 'quota-breached'
                ? undefined
                : () => {
                    // TODO: figure out nice way to handle custom conversation creation flow
                    setShowNewConversationWarning(true);
                    if (handleNewChat) {
                      handleNewChat(setConversationsDrawerOpened);
                    }
                  }
            }
            conversations={conversations.map((conversation) => ({
              id: conversation.id,
              text: conversation.title,
              additionalProps: canDeleteHistory
                ? {
                    actions: (
                      <MenuItemAction
                        icon={<TrashAltIcon />}
                        actionId="delete"
                        onClick={() => setDeleteConversation(conversation.id)}
                        aria-label={`Delete conversation ${conversation.id}`}
                      />
                    ),
                  }
                : undefined,
            }))}
            activeItemId={manager?.stateManager.getActiveConversationId() || undefined}
            drawerContent={drawerContent}
            isCompact={isCompact}
          />
        </Chatbot>
        {children}
      </div>
      {deleteConversation && (
        <DeleteConversationModal
          onClose={() => setDeleteConversation(undefined)}
          onDelete={() => {
            if (manager) {
              return manager.stateManager.deleteConversation(deleteConversation);
            }
            return Promise.resolve(undefined);
          }}
        />
      )}
    </UniversalChatbotProvider>
  );
}

export default UniversalChatbot;
