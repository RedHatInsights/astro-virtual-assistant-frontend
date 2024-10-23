import React, { FunctionComponent } from 'react';
import { MessageProps } from '../Message/MessageProps';
import { Banner } from '../../types/Message';
import { ConversationAlert } from '@patternfly/virtual-assistant';

export const ToggleOrg2FaBanner: FunctionComponent<MessageProps<Banner>> = ({ message }) => {
  const enableOrg2fa: boolean = message.additionalContent?.[0] === 'true' ? true : false;

  const twoFaDocsHref = 'https://docs.redhat.com/en/documentation/red_hat_customer_portal/1/html/using_two-factor_authentication/index';
  return (
    <>
      {message.additionalContent && (
        <ConversationAlert variant="success" title={`Two-factor authentication ${enableOrg2fa ? 'enabled' : 'disabled'} successfully`}>
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
        </ConversationAlert>
      )}
    </>
  );
};

export const ToggleOrg2FaFailedBanner: FunctionComponent<MessageProps<Banner>> = ({ message }) => {
  const enableOrg2fa: boolean = message.additionalContent?.[0] === 'true' ? true : false;
  return (
    <ConversationAlert variant="danger" title="Operation failed.">
      You may not have adequate permission to {enableOrg2fa ? 'enable' : 'disable'} two-factor authentication.
    </ConversationAlert>
  );
};
