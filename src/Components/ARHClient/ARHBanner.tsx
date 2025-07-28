import React from 'react';
import { Alert, AlertActionCloseButton, Button, Content } from '@patternfly/react-core';
import './ARHBanner.scss';
import { useCreateNewConversation } from '@redhat-cloud-services/ai-react-state';

const privacyMessage = () => ({
  title: 'Important',
  description: (
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

const readOnlyMessage = (createNewConversation: () => void) => ({
  title: 'View-only chat',
  description: (
    <>
      Previous chats are view-only. To ask a new question, please start a new chat.{' '}
      <Button onClick={createNewConversation} variant="link" isInline>
        Start a new chat
      </Button>
      .
    </>
  ),
});

const messages = {
  privacy: privacyMessage,
  readOnly: readOnlyMessage,
};

const ARHBanner = ({
  isOpen,
  setOpen,
  variant = 'privacy',
}: {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  variant?: 'readOnly' | 'privacy';
}) => {
  const createNewConversation = useCreateNewConversation();
  if (!isOpen) {
    return null;
  }
  const message = messages[variant](createNewConversation);
  return (
    <div className="pf-v6-u-mb-md va-c-arh-banner__alert ">
      <Alert variant="info" title={message.title} ouiaId="InfoAlert" actionClose={<AlertActionCloseButton onClose={() => setOpen(false)} />}>
        <Content className="pf-v6-u-mb-md">{message.description}</Content>
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
