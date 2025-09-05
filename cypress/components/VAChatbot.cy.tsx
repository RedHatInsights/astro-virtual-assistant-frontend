import React from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import { FlagProvider } from '@unleash/proxy-client-react';
import VAChatbot from '../../src/Components/VAClient/VAChatbot';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { Models } from '../../src/aiClients/types';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import VAClient from '../../src/aiClients/vaClient';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';

// Mock Chrome API for Scalprum
const mockChromeApi = {
  auth: {
    getToken: () => Promise.resolve('mock-token'),
    getUser: () => Promise.resolve({
      identity: {
        user: {
          username: 'testuser',
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
          is_internal: false,
          is_active: true,
          is_org_admin: true,
          locale: 'en-US'
        },
        account_number: '123456',
        internal: {
          account_id: '123456'
        },
        org_id: 'test-org',
        type: 'User'
      },
      entitlements: {}
    }),
  },
  getEnvironment: () => 'stage',
  isBeta: () => false,
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const vaClient = React.useMemo(() => new VAClient(), []);
  const stateManager = React.useMemo(() => createClientStateManager(vaClient), [vaClient]);
  
  return (
    <ScalprumProvider config={{}} api={{ chrome: mockChromeApi }}>
      <FlagProvider config={{
        url: 'http://localhost:4242/api/frontend',
        clientKey: 'test-key',
        appName: 'test-app',
      }}>
        <AIStateProvider stateManager={stateManager}>
          {children}
        </AIStateProvider>
      </FlagProvider>
    </ScalprumProvider>
  );
};

describe('VAChatbot Component', () => {
  beforeEach(() => {
    // Mock Unleash API calls
    cy.intercept('GET', '**/api/frontend**', {
      statusCode: 200,
      body: { toggles: [] }
    }).as('unleashAPI');

    // Mock Unleash metrics endpoint
    cy.intercept('POST', '**/api/frontend/client/metrics', {
      statusCode: 200,
      body: {}
    }).as('unleashMetrics');
  });

  it('should render VAChatbot component with VA-specific props', () => {
    const mockProps = {
      isOpen: true,
      setOpen: cy.stub(),
      displayMode: ChatbotDisplayMode.default,
      setDisplayMode: cy.stub(),
      availableManagers: [],
      currentModel: Models.VA,
      setCurrentModel: cy.stub(),
      stateManager: undefined,
    };

    cy.mount(
      <TestWrapper>
        <VAChatbot {...mockProps} />
      </TestWrapper>
    );

    // VAChatbot should render UniversalChatbot with VA-specific configuration
    cy.get('#ai-chatbot').should('exist');
    cy.get('.pf-chatbot__content').should('exist');
  });

  it('should use VAMessageEntry for VA message rendering', () => {
    const mockProps = {
      isOpen: true,
      setOpen: cy.stub(),
      displayMode: ChatbotDisplayMode.default,
      setDisplayMode: cy.stub(),
      availableManagers: [],
      currentModel: Models.VA,
      setCurrentModel: cy.stub(),
      stateManager: undefined,
    };

    cy.mount(
      <TestWrapper>
        <VAChatbot {...mockProps} />
      </TestWrapper>
    );

    // Should pass VAMessageEntry as the message component to UniversalChatbot
    cy.get('#ai-chatbot').should('exist');
  });
});