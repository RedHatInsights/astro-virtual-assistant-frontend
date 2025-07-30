import {
  ChatbotDisplayMode,
  ChatbotHeader,
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot';
import { Brand, Button, Icon, Title } from '@patternfly/react-core';
import React from 'react';
import { CompressAltIcon, ExpandAltIcon } from '@patternfly/react-icons';
import ARH_ICON from './Ask_Red_Hat_OFFICIAL-whitebackground.svg';

function ARHHeader({
  scrollToBottomRef,
  conversationsDrawerOpened,
  setConversationsDrawerOpened,
  setOpen,
  setDisplayMode,
  displayMode,
}: {
  scrollToBottomRef: React.RefObject<HTMLDivElement>;
  setOpen: (open: boolean) => void;
  setDisplayMode: React.Dispatch<React.SetStateAction<ChatbotDisplayMode>>;
  displayMode: ChatbotDisplayMode;
  conversationsDrawerOpened: boolean;
  setConversationsDrawerOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <ChatbotHeader>
      <ChatbotHeaderMain>
        <ChatbotHeaderMenu aria-expanded={conversationsDrawerOpened} onMenuToggle={() => setConversationsDrawerOpened((prev) => !prev)} />
        <ChatbotHeaderTitle>
          <div className="pf-v6-u-mr-md">
            <Brand src={ARH_ICON} alt="Ask Red Hat" />
          </div>
          <Title headingLevel="h1" size="2xl">
            Ask Red Hat
          </Title>
        </ChatbotHeaderTitle>
      </ChatbotHeaderMain>
      <ChatbotHeaderActions>
        <Button
          variant="plain"
          className="pf-chatbot__button--toggle-menu"
          onClick={() => {
            setDisplayMode((prev) => (prev === ChatbotDisplayMode.default ? ChatbotDisplayMode.fullscreen : ChatbotDisplayMode.default));
          }}
          aria-label={displayMode === ChatbotDisplayMode.default ? 'Switch chatbot to fullscreen mode' : 'Switch to default mode'}
          icon={
            <Icon color="var(--pf-t--global--icon--color--subtle)" size="xl">
              {displayMode === ChatbotDisplayMode.default ? <ExpandAltIcon /> : <CompressAltIcon />}
            </Icon>
          }
        />
        <ChatbotHeaderCloseButton
          onClick={() => {
            setOpen(false);
            if (scrollToBottomRef.current) {
              scrollToBottomRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
      </ChatbotHeaderActions>
    </ChatbotHeader>
  );
}

export default ARHHeader;
