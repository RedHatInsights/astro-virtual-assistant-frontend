import React, { useEffect, useRef, useState } from 'react';
import { useAstro } from '../../src/Components/AstroChat/useAstro';
import { From, Message } from '../../src/types/Message';

import { ChromeUser } from '@redhat-cloud-services/types';


const UseAstroComponent = () => {
  const user: ChromeUser = {
        identity: {
        user: {
            username: 'test',
            email: '<EMAIL>',
            first_name: 'Test',
            last_name: 'User',
            is_internal: false,
            is_active: true,
            is_org_admin: true,
            locale: 'en-US'
        },
        org_id: '',
        type: ''
        },
        entitlements: {}
    }
  const auth = {
    getUser: async () => Promise.resolve(user),
    getToken: async () => Promise.resolve('token'),
    getOfflineToken: function(): Promise<any> {
      throw new Error('Function not implemented.');
    },
    getRefreshToken: function(): Promise<string> {
      throw new Error('Function not implemented.');
    },
    login: function(): Promise<any> {
      throw new Error('Function not implemented.');
    },
    logout: function(): void {
      throw new Error('Function not implemented.');
    },
    qe: undefined,
    reAuthWithScopes: function(...scopes: string[]): Promise<void> {
      throw new Error('Function not implemented.');
    }
  };
  const {
    ask,
    messages,
    setMessages,
    start,
    stop,
    status,
    error,
    loadingResponse,
  } = useAstro([], {
    isPreview: false,
    auth: auth
  });
  window.insights.chrome.auth = auth;

  useEffect(() => {
    if (status === 'NOT_STARTED') {
      void start();
    }
  }, [status, start]);

  useEffect(() => {
    if (error) {
      console.log(JSON.stringify(error.message));
    }
  }, [error]);

  return <div>UseAstroComponent Mounted
    {error && <div className="error-banner">Error: {error.message}</div>}
    <div>
      Messages:
      <ul data-testid="messages-list">
        {messages.map((msg, index) => (
          <li data-testid={`message-item-${msg.from}`} key={index}>
            {JSON.stringify(msg)}
          </li>
        ))}
      </ul>
    </div>
  </div>;
};

describe('Tests useAstro request error handling', () => {
  it('error displayed', () => {
    cy.intercept('POST', '/api/virtual-assistant-v2/v2/talk', {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('postTalk');
    cy.mount(
      <UseAstroComponent />
    );

    // should have 3 messages: system message, banner, and empty bot response
    cy.get('[data-testid="messages-list"]').children().should('have.length', 3);
    cy.get('[data-testid="message-item-system"]').should('contain', 'request_error');
    cy.get('[data-testid="message-item-interface"]').should('contain', 'request_error');
    cy.get('[data-testid="message-item-assistant"]').should('contain', 'isLoading":true'); // never loaded

    cy.get('.error-banner').should('contain', 'Internal Server Error');
  });
});
