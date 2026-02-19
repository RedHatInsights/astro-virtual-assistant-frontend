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
import UniversalHeaderPreviewBadge from './UniversalHeaderPreviewBadget';

function UniversalHeader({
  scrollToBottomRef,
  conversationsDrawerOpened,
  setOpen,
  setDisplayMode,
  displayMode,
  historyManagement,
  isCompact,
}: {
  scrollToBottomRef: React.RefObject<HTMLDivElement>;
  setOpen: (open: boolean) => void;
  setDisplayMode?: React.Dispatch<React.SetStateAction<ChatbotDisplayMode>>;
  displayMode: ChatbotDisplayMode;
  conversationsDrawerOpened: boolean;
  historyManagement: boolean;
  isCompact?: boolean;
}) {
  const { setConversationsDrawerOpened, managers, currentModel } = useContext(UniversalChatbotContext);
  const currentManager = managers?.find((m) => m.model === currentModel);
  const modelName = currentManager?.modelName ?? '';
  return (
    <ChatbotHeader className={isCompact ? 'arh__header pf-v6-u-p-sm' : 'arh__header'}>
      <ChatbotHeaderMain>
        {historyManagement && (
          <ChatbotHeaderMenu
            isCompact={isCompact}
            aria-expanded={conversationsDrawerOpened}
            onMenuToggle={() => setConversationsDrawerOpened((prev) => !prev)}
          />
        )}

        <ChatbotHeaderTitle>
          <div className="pf-v6-u-mr-md">
            <Brand src={ARH_ICON} alt="Ask Red Hat" />
          </div>
          <Title headingLevel="h1" size={isCompact ? 'md' : '2xl'}>
            {modelName}
          </Title>
        </ChatbotHeaderTitle>
      </ChatbotHeaderMain>
      <ChatbotHeaderActions>
        {currentManager?.isPreview ? <UniversalHeaderPreviewBadge /> : null}
        {setDisplayMode && (
          <Button
            variant="plain"
            className={isCompact ? 'pf-chatbot__button--toggle-menu pf-m-compact' : 'pf-chatbot__button--toggle-menu'}
            onClick={() => {
              setDisplayMode((prev) => (prev === ChatbotDisplayMode.default ? ChatbotDisplayMode.fullscreen : ChatbotDisplayMode.default));
            }}
            aria-label={displayMode === ChatbotDisplayMode.default ? 'Switch chatbot to fullscreen mode' : 'Switch to default mode'}
            icon={
              <Icon color="var(--pf-t--global--icon--color--subtle)" size={isCompact ? 'lg' : 'xl'}>
                {displayMode === ChatbotDisplayMode.default ? <ExpandAltIcon /> : <CompressAltIcon />}
              </Icon>
            }
          />
        )}
        <ChatbotHeaderCloseButton
          isCompact={isCompact}
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
