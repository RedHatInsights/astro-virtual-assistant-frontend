import React, { FunctionComponent } from 'react';
import { MessageProps } from '../Message/MessageProps';
import { Banner } from '../../types/Message';
import { ConversationAlert } from '@patternfly/virtual-assistant';

export const CreateServiceAccBanner: FunctionComponent<MessageProps<Banner>> = ({ message }) => {
  return (
    <>
      {message.additionalContent && (
        <ConversationAlert variant="success" title="Service account created successfully.">
          <p>
            <b>{message.additionalContent[0]}</b>
          </p>
          <p>{message.additionalContent[1]}</p>
          <p>
            Client Id: <b>{message.additionalContent[2]}</b>
          </p>
          <p>
            Secret: <b>{message.additionalContent[3]}</b>
          </p>
          Please copy and store the <b>Client Id</b> and the <b>Secret</b> in a safe place. These information will not be available to you again.
        </ConversationAlert>
      )}
    </>
  );
};

export const CreateServiceAccFailedBanner: FunctionComponent<MessageProps<Banner>> = () => {
  return (
    <ConversationAlert variant="danger" title="Service account creation failed.">
      There maybe some ongoing issue with the internal API that we use to create service accounts. Please try again later.
    </ConversationAlert>
  );
};
