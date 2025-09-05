import React from 'react';
import { Banner } from '../../types/Message';
import { Alert } from '@patternfly/react-core';

const ConversationEndBanner = () => {
  return <Alert title="You can start a new conversation at any time by typing below." variant="info" isInline />;
};

const CreateServiceAccBanner = ({ message }: { message: Banner }) => {
  return (
    <>
      {message.additionalContent && (
        <Alert variant="success" title="Service account created successfully.">
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
      )}
    </>
  );
};

const CreateServiceAccFailedBanner = () => {
  return (
    <Alert variant="danger" title="Service account creation failed.">
      There maybe some ongoing issue with the internal API that we use to create service accounts. Please try again later.
    </Alert>
  );
};

const ToggleOrg2FaBanner = ({ message }: { message: Banner }) => {
  const enableOrg2fa: boolean = message.additionalContent?.[0] === 'true' ? true : false;

  const twoFaDocsHref = 'https://docs.redhat.com/en/documentation/red_hat_customer_portal/1/html/using_two-factor_authentication/index';
  return (
    <>
      {message.additionalContent && (
        <Alert variant="success" title={`Two-factor authentication ${enableOrg2fa ? 'enabled' : 'disabled'} successfully`}>
          {enableOrg2fa ? (
            <div>
              <p>
                Two-factor authentication has been enabled successfully. Users will be required to set up two-factor authentication the next time they
                attempt to log in.
              </p>
              <p>
                They can chat with me if they need help setting up two-factor authentication or visit{' '}
                <a href={twoFaDocsHref} target="_blank" rel="noopener noreferrer">
                  our documentation
                </a>
                .
              </p>
            </div>
          ) : (
            <p>The two-factor authentication requirement has been removed successfully.</p>
          )}
        </Alert>
      )}
    </>
  );
};

const ToggleOrg2FaFailedBanner = ({ message }: { message: Banner }) => {
  const enableOrg2fa: boolean = message.additionalContent?.[0] === 'true' ? true : false;
  return (
    <Alert variant="danger" title="Operation failed.">
      You may not have adequate permission to {enableOrg2fa ? 'enable' : 'disable'} two-factor authentication.
    </Alert>
  );
};

const MessageTooLongBanner = () => {
  return <Alert title="Your message cannot exceed 2048 characters." variant="info" isInline />;
};

const RequestErrorBanner = () => {
  return <Alert title="Sorry, something went wrong while talking to the Virtual Assistant." variant="danger" />;
};

const BannerEntry = ({ message }: { message: Banner }) => {
  return (
    <>
      {message.type === 'finish_conversation_banner' && <ConversationEndBanner />}
      {message.type == 'create_service_account' && <CreateServiceAccBanner message={message} />}
      {message.type == 'create_service_account_failed' && <CreateServiceAccFailedBanner />}
      {message.type == 'toggle_org_2fa' && <ToggleOrg2FaBanner message={message} />}
      {message.type == 'toggle_org_2fa_failed' && <ToggleOrg2FaFailedBanner message={message} />}
      {message.type == 'message_too_long' && <MessageTooLongBanner />}
      {message.type == 'request_error' && <RequestErrorBanner />}
    </>
  );
};

export default BannerEntry;
