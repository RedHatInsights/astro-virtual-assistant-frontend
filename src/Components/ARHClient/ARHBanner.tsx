import React from 'react';
import { Alert, AlertActionCloseButton, AlertProps, Button, Content } from '@patternfly/react-core';
import './ARHBanner.scss';
import { useCreateNewConversation } from '@redhat-cloud-services/ai-react-state';

const privacyMessage = (): AlertProps => ({
  variant: 'info',
  title: 'Important',
  children: (
    <>
      This feature uses AI technology. Do not include personal or sensitive information in your input. Interactions may be used to improve Red
      Hat&apos;s products or services. For more information about Red Hat&apos;s privacy practices, please refer to the{' '}
      <a href="https://www.redhat.com/en/about/privacy-policy" target="_blank" rel="noreferrer">
        Red Hat Privacy Statement
      </a>
      .
    </>
  ),
});

const readOnlyMessage = (createNewConversation: () => void): AlertProps => ({
  variant: 'info',
  title: 'View-only chat',
  children: (
    <>
      Previous chats are view-only. To ask a new question, please start a new chat.{' '}
      <Button onClick={createNewConversation} variant="link" isInline>
        Start a new chat
      </Button>
      .
    </>
  ),
});

const conversationLimitMessage = (): AlertProps => ({
  variant: 'danger',
  title: 'Chat limit reached',
  children: `You've reached the maximum number of chats. You can start up to 50 chats within a 24-hour period. Please try again after your limit resets`,
});

const messages = {
  privacy: privacyMessage,
  readOnly: readOnlyMessage,
  conversationLimit: conversationLimitMessage,
};

const ARHBanner = ({
  isOpen,
  setOpen,
  variant = 'privacy',
}: {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  variant?: 'readOnly' | 'privacy' | 'conversationLimit';
}) => {
  const createNewConversation = useCreateNewConversation();
  if (!isOpen) {
    return null;
  }
  const message = messages[variant](createNewConversation);
  return (
    <div className="pf-v6-u-mb-md va-c-arh-banner__alert ">
      <Alert
        variant={message.variant}
        title={message.title}
        ouiaId="InfoAlert"
        actionClose={<AlertActionCloseButton onClose={() => setOpen(false)} />}
      >
        <Content className="pf-v6-u-mb-md">{message.children}</Content>
        <div>
          <Button size="sm" onClick={() => setOpen(false)} variant="secondary">
            Got it
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default ARHBanner;
