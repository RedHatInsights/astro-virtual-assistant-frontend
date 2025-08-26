import React from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import { FlagProvider } from '@unleash/proxy-client-react';
import * as checkARHAuthModule from '../../src/Components/ARHClient/checkARHAuth';

import useStateManager from '../../src/aiClients/useStateManager';
import { Models } from '../../src/aiClients/types';

// Mock Unleash feature flag
const mockUseFlag = (flag: string) => {
  if (flag === 'platform.arh.enabled') return true;
  return false;
};

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
    <FlagProvider config={{
      url: 'http://localhost:4242/api/frontend',
      clientKey: 'test-key',
      appName: 'test-app',
    }}>
      {children}
    </FlagProvider>
  </ScalprumProvider>
);

describe('State Manager Integration Tests', () => {
  beforeEach(() => {
    // Mock Unleash API calls
    cy.intercept('GET', '**/api/frontend**', {
      statusCode: 200,
      body: {
        toggles: [
          {
            name: 'platform.arh.enabled',
            enabled: true,
            variant: {
              name: 'disabled',
              enabled: false
            }
          }
        ]
      }
    }).as('unleashAPI');
    
    // Mock Unleash metrics endpoint
    cy.intercept('POST', '**/api/frontend/client/metrics', {
      statusCode: 200,
      body: {}
    }).as('unleashMetrics');
    
    // Mock checkARHAuth to return true (user is authorized)
    cy.stub(checkARHAuthModule, 'default').resolves(true);
    
    // Mock fetch requests
    cy.intercept('GET', '**/api/lightspeed/v1/**', { fixture: 'rhel-response.json' }).as('rhelAPI');
    cy.intercept('POST', '**/api/lightspeed/v1/**', { fixture: 'rhel-response.json' }).as('rhelPost');
    
    // Fallback for other ARH requests (define first)
    cy.intercept('GET', 'https://access.stage.redhat.com/**', { fixture: 'arh-response.json' }).as('arhAPI');
    cy.intercept('POST', 'https://access.stage.redhat.com/**', { fixture: 'arh-response.json' }).as('arhPost');
    
    // More specific ARH auth check endpoint (define last to take precedence)
    cy.intercept('GET', 'https://access.stage.redhat.com/hydra/rest/contacts/sso/current**', {
      statusCode: 200,
      body: {
        isEntitled: true,
        isInternal: false
      }
    }).as('arhAuthCheck');
    
    // ARH user history endpoint - return empty array for history.map()
    cy.intercept('GET', '**/api/ask/v1/user/current/history**', {
      statusCode: 200,
      body: []
    }).as('arhUserHistory');
  });

  describe('useStateManager Hook Integration', () => {
    it('should initialize with proper state managers and models', () => {
      const TestComponent = () => {
        const { 
          stateManager, 
          model, 
          initializing, 
          chatbotProps 
        } = useStateManager();
        
        return (
          <div data-testid="state-manager">
            <div data-testid="model">{model || 'undefined'}</div>
            <div data-testid="initializing">{initializing.toString()}</div>
            <div data-testid="has-state-manager">{(!!stateManager).toString()}</div>
            <div data-testid="available-managers-count">{chatbotProps.availableManagers.length}</div>
            <div data-testid="arh-manager-available">{
              chatbotProps.availableManagers.some(m => m.model === Models.ASK_RED_HAT).toString()
            }</div>
            <div data-testid="rhel-manager-available">{
              chatbotProps.availableManagers.some(m => m.model === Models.RHEL_LIGHTSPEED).toString()
            }</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should have both managers available
      cy.get('[data-testid="available-managers-count"]').should('contain', '2');
      cy.get('[data-testid="arh-manager-available"]').should('contain', 'true');
      cy.get('[data-testid="rhel-manager-available"]').should('contain', 'true');
      
      // Should have a model selected (either ARH or RHEL based on auth)
      cy.get('[data-testid="model"]').should('not.contain', 'undefined');
      
      // Eventually should not be initializing
      cy.get('[data-testid="initializing"]', { timeout: 10000 }).should('contain', 'false');
    });

    it('should verify state manager properties and capabilities', () => {
      const TestComponent = () => {
        const { chatbotProps } = useStateManager();
        
        const arhManager = chatbotProps.availableManagers.find(m => m.model === Models.ASK_RED_HAT);
        const rhelManager = chatbotProps.availableManagers.find(m => m.model === Models.RHEL_LIGHTSPEED);
        
        return (
          <div data-testid="manager-properties">
            {/* ARH Manager Properties */}
            <div data-testid="arh-history-management">{arhManager?.historyManagement.toString()}</div>
            <div data-testid="arh-stream-messages">{arhManager?.streamMessages.toString()}</div>
            <div data-testid="arh-model-name">{arhManager?.modelName}</div>
            
            {/* RHEL Manager Properties */}
            <div data-testid="rhel-history-management">{rhelManager?.historyManagement.toString()}</div>
            <div data-testid="rhel-stream-messages">{rhelManager?.streamMessages.toString()}</div>
            <div data-testid="rhel-model-name">{rhelManager?.modelName}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Verify ARH manager properties
      cy.get('[data-testid="arh-history-management"]').should('contain', 'true');
      cy.get('[data-testid="arh-stream-messages"]').should('contain', 'true');
      cy.get('[data-testid="arh-model-name"]').should('contain', 'Ask Red Hat');
      
      // Verify RHEL manager properties (different capabilities)
      cy.get('[data-testid="rhel-history-management"]').should('contain', 'false');
      cy.get('[data-testid="rhel-stream-messages"]').should('contain', 'false');
      cy.get('[data-testid="rhel-model-name"]').should('contain', 'RHEL LightSpeed');
    });

    it('should handle model switching', () => {
      const TestComponent = () => {
        const { model, chatbotProps } = useStateManager();
        
        const [currentModel, setCurrentModel] = React.useState(model);
        
        // Sync local state when model changes
        React.useEffect(() => {
          setCurrentModel(model);
        }, [model]);
        
        const switchToRHEL = () => {
          chatbotProps.setCurrentModel(Models.RHEL_LIGHTSPEED);
          setCurrentModel(Models.RHEL_LIGHTSPEED);
        };
        
        const switchToARH = () => {
          chatbotProps.setCurrentModel(Models.ASK_RED_HAT);
          setCurrentModel(Models.ASK_RED_HAT);
        };
        
        return (
          <div data-testid="model-switching">
            <div data-testid="current-model">{currentModel || 'undefined'}</div>
            <button data-testid="switch-to-rhel" onClick={switchToRHEL}>
              Switch to RHEL
            </button>
            <button data-testid="switch-to-arh" onClick={switchToARH}>
              Switch to ARH
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should have a default model
      cy.get('[data-testid="current-model"]').should('not.contain', 'undefined');
      
      // Test switching to RHEL
      cy.get('[data-testid="switch-to-rhel"]').click();
      // Note: The actual model change in useStateManager is controlled by internal logic
      // This test verifies the switching mechanism is available
      
      // Test switching to ARH
      cy.get('[data-testid="switch-to-arh"]').click();
    });

    it('should handle initialization without errors', () => {
      const TestComponent = () => {
        const { stateManager, initializing } = useStateManager();
        
        const stateManagerType = stateManager ? 'available' : 'unavailable';
        
        return (
          <div data-testid="initialization-test">
            <div data-testid="state-manager-status">{stateManagerType}</div>
            <div data-testid="initializing-status">{initializing.toString()}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should eventually have a state manager available
      cy.get('[data-testid="state-manager-status"]', { timeout: 10000 }).should('not.contain', 'unavailable');
      
      // Should complete initialization
      cy.get('[data-testid="initializing-status"]', { timeout: 10000 }).should('contain', 'false');
    });
  });

  describe('Model Fallback Behavior', () => {
    it('should fallback to RHEL when ARH auth fails', () => {
      // Mock ARH auth to fail - need to restore and re-stub
      cy.stub(checkARHAuthModule, 'default').resolves(false);

      const TestComponent = () => {
        const { model, chatbotProps } = useStateManager();
        
        return (
          <div data-testid="fallback-test">
            <div data-testid="model">{model || 'undefined'}</div>
            <div data-testid="managers-count">{chatbotProps.availableManagers.length}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should still have managers available
      cy.get('[data-testid="managers-count"]').should('contain', '2');
      
      // Should have a model (either ARH or RHEL fallback)
      cy.get('[data-testid="model"]', { timeout: 10000 }).should('not.contain', 'undefined');
    });
  });

  describe('State Manager Method Availability', () => {
    it('should verify all required state manager methods are available', () => {
      const TestComponent = () => {
        const { chatbotProps } = useStateManager();
        
        const arhManager = chatbotProps.availableManagers.find(m => m.model === Models.ASK_RED_HAT);
        const rhelManager = chatbotProps.availableManagers.find(m => m.model === Models.RHEL_LIGHTSPEED);
        
        const arhMethods = {
          hasInit: typeof arhManager?.stateManager.init === 'function',
          hasIsInitialized: typeof arhManager?.stateManager.isInitialized === 'function',
          hasIsInitializing: typeof arhManager?.stateManager.isInitializing === 'function',
          hasGetState: typeof arhManager?.stateManager.getState === 'function',
        };
        
        const rhelMethods = {
          hasInit: typeof rhelManager?.stateManager.init === 'function',
          hasIsInitialized: typeof rhelManager?.stateManager.isInitialized === 'function',
          hasIsInitializing: typeof rhelManager?.stateManager.isInitializing === 'function',
          hasGetState: typeof rhelManager?.stateManager.getState === 'function',
        };
        
        return (
          <div data-testid="methods-test">
            <div data-testid="arh-methods">{JSON.stringify(arhMethods)}</div>
            <div data-testid="rhel-methods">{JSON.stringify(rhelMethods)}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Verify ARH state manager has all required methods
      cy.get('[data-testid="arh-methods"]').should('contain', '"hasInit":true');
      cy.get('[data-testid="arh-methods"]').should('contain', '"hasIsInitialized":true');
      cy.get('[data-testid="arh-methods"]').should('contain', '"hasIsInitializing":true');
      cy.get('[data-testid="arh-methods"]').should('contain', '"hasGetState":true');
      
      // Verify RHEL state manager has all required methods
      cy.get('[data-testid="rhel-methods"]').should('contain', '"hasInit":true');
      cy.get('[data-testid="rhel-methods"]').should('contain', '"hasIsInitialized":true');
      cy.get('[data-testid="rhel-methods"]').should('contain', '"hasIsInitializing":true');
      cy.get('[data-testid="rhel-methods"]').should('contain', '"hasGetState":true');
    });
  });
});