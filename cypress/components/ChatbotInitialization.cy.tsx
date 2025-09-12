import React from 'react';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { ScalprumProvider } from '@scalprum/react-core';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';

import UniversalChatbotProvider, { UniversalChatbotContext } from '../../src/Components/UniversalChatbot/UniversalChatbotProvider';
import { Models } from '../../src/aiClients/types';
import UniversalChatbot from '../../src/Components/UniversalChatbot/UniversalChatbot';
import useArhClient from '../../src/aiClients/useArhClient';
import useRhelLightSpeedManager from '../../src/aiClients/useRhelLightSpeedManager';

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
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ScalprumProvider config={{}} api={{ chrome: mockChromeApi }}>
    {children}
  </ScalprumProvider>
);

describe('Chatbot Initialization Tests', () => {
  beforeEach(() => {
    // Mock fetch requests
    cy.intercept('GET', '**/api/lightspeed/v1/**', { fixture: 'rhel-response.json' }).as('rhelAPI');
    cy.intercept('POST', '**/api/lightspeed/v1/**', { fixture: 'rhel-response.json' }).as('rhelPost');
    
    // Mock ARH API requests
    cy.intercept('GET', 'https://access.stage.redhat.com/**', { fixture: 'arh-response.json' }).as('arhAPI');
    cy.intercept('POST', 'https://access.stage.redhat.com/**', { fixture: 'arh-response.json' }).as('arhPost');
  });

  describe('ARH State Manager Initialization', () => {
    it('should create ARH state manager with proper configuration', () => {
      const TestComponent = () => {
        const arhManager = useArhClient({ baseUrl: 'https://access.stage.redhat.com' });
        
        return (
          <div data-testid="arh-manager">
            <div data-testid="model">{arhManager.model}</div>
            <div data-testid="model-name">{arhManager.modelName}</div>
            <div data-testid="selection-title">{arhManager.selectionTitle}</div>
            <div data-testid="history-management">{arhManager.historyManagement.toString()}</div>
            <div data-testid="stream-messages">{arhManager.streamMessages.toString()}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Verify ARH manager configuration
      cy.get('[data-testid="model"]').should('contain', Models.ASK_RED_HAT);
      cy.get('[data-testid="model-name"]').should('contain', 'Ask Red Hat');
      cy.get('[data-testid="selection-title"]').should('contain', 'General Red Hat (Default)');
      cy.get('[data-testid="history-management"]').should('contain', 'true');
      cy.get('[data-testid="stream-messages"]').should('contain', 'true');
    });

    it('should initialize ARH state manager methods', () => {
      const TestComponent = () => {
        const arhManager = useArhClient({ baseUrl: 'https://access.stage.redhat.com' });
        
        // Test that state manager has required methods
        const hasInit = typeof arhManager.stateManager.init === 'function';
        const hasIsInitialized = typeof arhManager.stateManager.isInitialized === 'function';
        const hasIsInitializing = typeof arhManager.stateManager.isInitializing === 'function';
        const hasGetState = typeof arhManager.stateManager.getState === 'function';
        
        return (
          <div data-testid="arh-methods">
            <div data-testid="has-init">{hasInit.toString()}</div>
            <div data-testid="has-is-initialized">{hasIsInitialized.toString()}</div>
            <div data-testid="has-is-initializing">{hasIsInitializing.toString()}</div>
            <div data-testid="has-get-state">{hasGetState.toString()}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Verify state manager has all required methods
      cy.get('[data-testid="has-init"]').should('contain', 'true');
      cy.get('[data-testid="has-is-initialized"]').should('contain', 'true');
      cy.get('[data-testid="has-is-initializing"]').should('contain', 'true');
      cy.get('[data-testid="has-get-state"]').should('contain', 'true');
    });
  });

  describe('RHEL LightSpeed State Manager Initialization', () => {
    it('should create RHEL state manager with proper configuration', () => {
      const TestComponent = () => {
        const rhelManager = useRhelLightSpeedManager();
        
        return (
          <div data-testid="rhel-manager">
            <div data-testid="model">{rhelManager.model}</div>
            <div data-testid="model-name">{rhelManager.modelName}</div>
            <div data-testid="selection-title">{rhelManager.selectionTitle}</div>
            <div data-testid="history-management">{rhelManager.historyManagement.toString()}</div>
            <div data-testid="stream-messages">{rhelManager.streamMessages.toString()}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Verify RHEL manager configuration
      cy.get('[data-testid="model"]').should('contain', Models.RHEL_LIGHTSPEED);
      cy.get('[data-testid="model-name"]').should('contain', 'RHEL LightSpeed');
      cy.get('[data-testid="selection-title"]').should('contain', 'RHEL LightSpeed');
      cy.get('[data-testid="history-management"]').should('contain', 'false');
      cy.get('[data-testid="stream-messages"]').should('contain', 'false');
    });

    it('should initialize RHEL state manager methods', () => {
      const TestComponent = () => {
        const rhelManager = useRhelLightSpeedManager();
        
        // Test that state manager has required methods
        const hasInit = typeof rhelManager.stateManager.init === 'function';
        const hasIsInitialized = typeof rhelManager.stateManager.isInitialized === 'function';
        const hasIsInitializing = typeof rhelManager.stateManager.isInitializing === 'function';
        const hasGetState = typeof rhelManager.stateManager.getState === 'function';
        
        return (
          <div data-testid="rhel-methods">
            <div data-testid="has-init">{hasInit.toString()}</div>
            <div data-testid="has-is-initialized">{hasIsInitialized.toString()}</div>
            <div data-testid="has-is-initializing">{hasIsInitializing.toString()}</div>
            <div data-testid="has-get-state">{hasGetState.toString()}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Verify state manager has all required methods
      cy.get('[data-testid="has-init"]').should('contain', 'true');
      cy.get('[data-testid="has-is-initialized"]').should('contain', 'true');
      cy.get('[data-testid="has-is-initializing"]').should('contain', 'true');
      cy.get('[data-testid="has-get-state"]').should('contain', 'true');
    });
  });

  describe('Real Chatbot Components with State Managers', () => {
    it('should render ARH chatbot with real state manager', () => {
      const TestComponent = () => {
        const arhManager = useArhClient({ baseUrl: 'https://access.stage.redhat.com' });
        
        const mockChatbotProps = {
          user: {
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
          },
          displayMode: ChatbotDisplayMode.default,
          setDisplayMode: () => {},
          model: Models.ASK_RED_HAT,
          setCurrentModel: () => {},
          historyManagement: arhManager.historyManagement,
          streamMessages: arhManager.streamMessages,
          rootElementRef: { current: null } as React.RefObject<HTMLDivElement>,
          setConversationsDrawerOpened: () => {},
          setShowNewConversationWarning: () => {},
          showNewConversationWarning: false,
          setOpen: () => {},
          availableManagers: [arhManager],
        };

        return (
          <AIStateProvider stateManager={arhManager.stateManager}>
            <UniversalChatbotProvider {...mockChatbotProps}>
              <UniversalChatbot {...mockChatbotProps} />
            </UniversalChatbotProvider>
          </AIStateProvider>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should render the ARH chatbot with real state manager
      cy.get('.pf-chatbot').should('exist');
      cy.contains('Ask Red Hat').should('be.visible');
      cy.get('.pf-chatbot__footer').should('exist');
    });

    it('should render RHEL chatbot with real state manager', () => {
      const TestComponent = () => {
        const rhelManager = useRhelLightSpeedManager();
        
        const mockChatbotProps = {
          user: {
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
          },
          displayMode: ChatbotDisplayMode.default,
          setDisplayMode: () => {},
          model: Models.RHEL_LIGHTSPEED,
          setCurrentModel: () => {},
          historyManagement: rhelManager.historyManagement,
          streamMessages: rhelManager.streamMessages,
          rootElementRef: { current: null } as React.RefObject<HTMLDivElement>,
          setConversationsDrawerOpened: () => {},
          setShowNewConversationWarning: () => {},
          showNewConversationWarning: false,
          setOpen: () => {},
          availableManagers: [rhelManager],
        };

        return (
          <AIStateProvider stateManager={rhelManager.stateManager}>
            <UniversalChatbotProvider {...mockChatbotProps}>
              <UniversalChatbot {...mockChatbotProps} />
            </UniversalChatbotProvider>
          </AIStateProvider>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should render the RHEL chatbot with real state manager
      cy.get('.pf-chatbot').should('exist');
      cy.contains('RHEL LightSpeed').should('be.visible');
      cy.get('.pf-chatbot__footer').should('exist');
    });

    it('should handle both managers in a multi-model setup', () => {
      const TestComponent = () => {
        const arhManager = useArhClient({ baseUrl: 'https://access.stage.redhat.com' });
        const rhelManager = useRhelLightSpeedManager();
        
        const mockChatbotProps = {
          user: {
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
          },
          displayMode: ChatbotDisplayMode.default,
          setDisplayMode: () => {},
          model: Models.ASK_RED_HAT,
          setCurrentModel: () => {},
          historyManagement: arhManager.historyManagement,
          streamMessages: arhManager.streamMessages,
          rootElementRef: { current: null } as React.RefObject<HTMLDivElement>,
          setConversationsDrawerOpened: () => {},
          setShowNewConversationWarning: () => {},
          showNewConversationWarning: false,
          setOpen: () => {},
          availableManagers: [arhManager, rhelManager],
        };

        return (
          <div>
            <div data-testid="managers-count">{mockChatbotProps.availableManagers.length}</div>
            <div data-testid="arh-model">{arhManager.model}</div>
            <div data-testid="rhel-model">{rhelManager.model}</div>
            <AIStateProvider stateManager={arhManager.stateManager}>
              <UniversalChatbotProvider {...mockChatbotProps}>
                <UniversalChatbot {...mockChatbotProps} />
              </UniversalChatbotProvider>
            </AIStateProvider>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should have both managers available
      cy.get('[data-testid="managers-count"]').should('contain', '2');
      cy.get('[data-testid="arh-model"]').should('contain', Models.ASK_RED_HAT);
      cy.get('[data-testid="rhel-model"]').should('contain', Models.RHEL_LIGHTSPEED);
      
      // Should render the chatbot
      cy.get('.pf-chatbot').should('exist');
      cy.contains('Ask Red Hat').should('be.visible');
    });
  });

  describe('State Manager Initialization Behavior', () => {
    it('should verify state manager initialization status', () => {
      const TestComponent = () => {
        const arhManager = useArhClient({ baseUrl: 'https://access.stage.redhat.com' });
        const rhelManager = useRhelLightSpeedManager();
        
        const arhInitialized = arhManager.stateManager.isInitialized();
        const arhInitializing = arhManager.stateManager.isInitializing();
        const rhelInitialized = rhelManager.stateManager.isInitialized();
        const rhelInitializing = rhelManager.stateManager.isInitializing();
        
        return (
          <div data-testid="initialization-status">
            <div data-testid="arh-initialized">{arhInitialized.toString()}</div>
            <div data-testid="arh-initializing">{arhInitializing.toString()}</div>
            <div data-testid="rhel-initialized">{rhelInitialized.toString()}</div>
            <div data-testid="rhel-initializing">{rhelInitializing.toString()}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Verify initial state (should not be initialized yet)
      cy.get('[data-testid="arh-initialized"]').should('contain', 'false');
      cy.get('[data-testid="rhel-initialized"]').should('contain', 'false');
      
      // Initially should not be initializing either
      cy.get('[data-testid="arh-initializing"]').should('contain', 'false');
      cy.get('[data-testid="rhel-initializing"]').should('contain', 'false');
    });
  });
});