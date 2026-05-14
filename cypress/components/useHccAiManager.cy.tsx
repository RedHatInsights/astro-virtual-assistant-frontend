import React from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import { FlagProvider } from '@unleash/proxy-client-react';
import useHccAiManager from '../../src/aiClients/useHccAiManager';
import { Models } from '../../src/aiClients/types';

const mockChromeApi = {
  auth: {
    getToken: () => Promise.resolve('mock-token'),
    getUser: () =>
      Promise.resolve({
        identity: {
          user: {
            username: 'testuser',
            email: 'test@test.com',
            first_name: 'Test',
            last_name: 'User',
            is_internal: false,
            is_active: true,
            is_org_admin: true,
            locale: 'en-US',
          },
          account_number: '123456',
          internal: { account_id: '123456' },
          org_id: 'test-org',
          type: 'User',
        },
        entitlements: {},
      }),
  },
  getEnvironment: () => 'stage',
  isBeta: () => false,
};

const UseHccAiManagerComponent = () => {
  const { manager, loading } = useHccAiManager();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="has-manager">{String(!!manager)}</div>
      <div data-testid="model">{manager?.model}</div>
      <div data-testid="model-name">{manager?.modelName}</div>
      <div data-testid="selection-title">{manager?.selectionTitle}</div>
      <div data-testid="history-management">{String(manager?.historyManagement)}</div>
      <div data-testid="stream-messages">{String(manager?.streamMessages)}</div>
      <div data-testid="has-message-entry">{String(!!manager?.MessageEntryComponent)}</div>
      <div data-testid="has-state-manager">{String(!!manager?.stateManager)}</div>
      <div data-testid="welcome-buttons">
        {JSON.stringify(manager?.welcome?.buttons?.map((b) => b.title) ?? [])}
      </div>
    </div>
  );
};

const mountWithFlags = (toggles: Array<{ name: string; enabled: boolean }>) => {
  cy.intercept('GET', '**/api/frontend**', {
    statusCode: 200,
    body: { toggles },
  }).as('unleashAPI');

  cy.intercept('POST', '**/api/frontend/client/metrics', {
    statusCode: 200,
    body: {},
  }).as('unleashMetrics');

  cy.mount(
    <ScalprumProvider config={{}} api={{ chrome: mockChromeApi }}>
      <FlagProvider
        config={{
          url: 'http://localhost:4242/api/frontend',
          clientKey: 'test-key',
          appName: 'test-app',
        }}
      >
        <UseHccAiManagerComponent />
      </FlagProvider>
    </ScalprumProvider>,
  );
};

describe('useHccAiManager', () => {
  describe('when feature flag is off', () => {
    beforeEach(() => {
      mountWithFlags([]);
    });

    it('should return null manager', () => {
      cy.get('[data-testid="has-manager"]').should('contain', 'false');
    });

    it('should not be loading', () => {
      cy.get('[data-testid="loading"]').should('contain', 'false');
    });
  });

  describe('when feature flag is on', () => {
    beforeEach(() => {
      mountWithFlags([
        { name: 'platform.chatbot.hcc-ai-assistant.enabled', enabled: true },
      ]);
    });

    it('should return HCC AI model', () => {
      cy.get('[data-testid="model"]').should('contain', Models.HCC_AI);
      cy.get('[data-testid="model-name"]').should('contain', 'HCC AI Assistant');
      cy.get('[data-testid="selection-title"]').should('contain', 'HCC AI Assistant');
    });

    it('should have a state manager', () => {
      cy.get('[data-testid="has-state-manager"]').should('contain', 'true');
    });

    it('should not use a custom MessageEntryComponent', () => {
      cy.get('[data-testid="has-message-entry"]').should('contain', 'false');
    });

    it('should provide static welcome buttons', () => {
      cy.get('[data-testid="welcome-buttons"]').should(
        'contain',
        '["What can you help me with?","List the principals in my organization"]',
      );
    });

    it('should not stream messages', () => {
      cy.get('[data-testid="stream-messages"]').should('contain', 'false');
    });

    it('should enable history management', () => {
      cy.get('[data-testid="history-management"]').should('contain', 'true');
    });
  });
});
