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
import React, { useContext } from 'react';
import { CompressAltIcon, ExpandAltIcon } from '@patternfly/react-icons';
import ARH_ICON from '../../assets/Ask_Red_Hat_OFFICIAL-whitebackground.svg';
import { UniversalChatbotContext } from './UniversalChatbotProvider';

import './UniversalHeader.scss';

function UniversalHeader({
  scrollToBottomRef,
  conversationsDrawerOpened,
  setOpen,
  setDisplayMode,
  displayMode,
  historyManagement,
}: {
  scrollToBottomRef: React.RefObject<HTMLDivElement>;
  setOpen: (open: boolean) => void;
  setDisplayMode: React.Dispatch<React.SetStateAction<ChatbotDisplayMode>>;
  displayMode: ChatbotDisplayMode;
  conversationsDrawerOpened: boolean;
  historyManagement: boolean;
}) {
  const { setConversationsDrawerOpened, availableManagers, model } = useContext(UniversalChatbotContext);
  const modelName = availableManagers.find((m) => m.model === model)?.modelName || '';
  return (
    <ChatbotHeader className="arh__header">
      <ChatbotHeaderMain>
        {historyManagement ? (
          <ChatbotHeaderMenu aria-expanded={conversationsDrawerOpened} onMenuToggle={() => setConversationsDrawerOpened((prev) => !prev)} />
        ) : null}

        <ChatbotHeaderTitle>
          <div className="pf-v6-u-mr-md">
            <Brand src={ARH_ICON} alt="Ask Red Hat" />
          </div>
          <Title headingLevel="h1" size="2xl">
            {modelName}
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

export default UniversalHeader;
