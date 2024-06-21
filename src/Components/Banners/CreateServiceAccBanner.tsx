import React, { FunctionComponent } from 'react';
import { Alert, TextContent } from '@patternfly/react-core';
import { MessageProps } from '../Message/MessageProps';
import { Banner } from '../../types/Message';

export const CreateServiceAccBanner: FunctionComponent<MessageProps<Banner>> = ({ message }) => {
  return (
    <>
      {message.additionalContent && (
        <TextContent className="banner__create-service-account">
          <Alert variant="success" isInline title="Service account created successfully." component="h6" className="banner-alert">
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
          </Alert>
        </TextContent>
      )}
    </>
  );
};

export const CreateServiceAccFailedBanner: FunctionComponent<MessageProps<Banner>> = () => {
  return (
    <>
      <TextContent className="banner__create-service-account">
        <Alert variant="danger" isInline title="Service account creation failed." component="h6" className="banner-alert">
          There maybe some ongoing issue with the internal API that we use to create service accounts. Please try again later.
        </Alert>
      </TextContent>
    </>
  );
};
