import React from 'react';
import ARHFooter from '../../src/Components/ARHClient/ARHFooter';
import { AIStateContext } from '@redhat-cloud-services/ai-react-state';
import { Events, StateManager } from '@redhat-cloud-services/ai-client-state';
import { VirtualAssistantStateSingleton } from '../../src/utils/VirtualAssistantStateSingleton';

// Create mock state manager - ARHFooter expects a different interface
const createMockStateManager = (overrides: any = {}) => {
  const state = {
    conversations: [],
    activeConversationId: 'test-conv',
    messages: [{ id: 'test-conv', locked: false }],
    isInitializing: false,
    messageInProgress: false,
    initLimitations: undefined,
    ...overrides,
  };

  // ARHFooter uses hooks that expect the state manager to have a getState method that returns another object with getState
  const stateManager: {
    getState: () => StateManager;
    subscribe: (event: Events, callback: () => void) => () => void;
  } = {
    getState: () => ({
      getState: () => state,
      createNewConversation: () => Promise.resolve({createdAt: new Date(), id: 'new-conv', locked: false, title: ''}),
      setActiveConversation: () => {},
      sendMessage: () => Promise.resolve(),
      subscribe: () => () => {},
      getInitLimitation: () => state.initLimitations,
      getActiveConversationMessages: () => state.messages,
      getActiveConversationId: () => state.activeConversationId,
      getConversations: () => Object.values(state.conversations),
      isMessageInProgress: () => state.messageInProgress,
      isInitializing: () => state.isInitializing,
      getClient: () => 'test-client-id' as any,
      getMessageInProgress: () => false,
      init: () => Promise.resolve(),
      isInitialized: () => true,
      isTemporaryConversation: () => false,
      notifyAll: () => {},
      setActiveConversationId: () => Promise.resolve(),
    }),
    subscribe: () => () => {},
  };

  return stateManager
};

const TestWrapper = ({ children, stateOverrides }: { children: React.ReactNode; stateOverrides?: any }) => {
  const mockStateManager = React.useMemo(() => createMockStateManager(stateOverrides), [stateOverrides]);
  
  return (
    <AIStateContext.Provider value={mockStateManager}>
      {children}
    </AIStateContext.Provider>
  );
};

describe('ARHFooter Component', () => {
  it('should render message bar', () => {
    cy.mount(
      <TestWrapper>
        <ARHFooter />
      </TestWrapper>
    );
    
    // Should have message input
    cy.get('#query-input').should('exist');
    
    // Should have PatternFly chatbot send button with specific class
    cy.get('button.pf-chatbot__button--send').should('exist');
    cy.get('button[aria-label="Send"]').should('exist');
  });

  it('should allow typing messages', () => {
    cy.mount(
      <TestWrapper>
        <ARHFooter />
      </TestWrapper>
    );
    
    // Type in the input
    cy.get('#query-input').type('Hello, how can you help me?');
    
    // Input should contain the text
    cy.get('#query-input').should('have.value', 'Hello, how can you help me?');
  });

  it('should have correct accessibility attributes', () => {
    cy.mount(
      <TestWrapper>
        <ARHFooter />
      </TestWrapper>
    );
    
    // Message bar should have correct aria-label
    cy.get('[aria-label="Type your message to the AI assistant"]').should('exist');
    
    // Input should have correct ID
    cy.get('#query-input').should('exist');
  });

  describe('Send button disabled states', () => {
    it('should disable send button when in progress', () => {
      cy.mount(
        <TestWrapper stateOverrides={{ messageInProgress: true }}>
          <ARHFooter />
        </TestWrapper>
      );
      
      // Send button should be disabled
      cy.get('button[aria-label="Send"]').should('be.disabled');
    });

    it('should disable send button when active conversation is locked', () => {
      cy.mount(
        <TestWrapper
          stateOverrides={{ 
            conversations: {
              'test-conv': { id: 'test-conv', locked: true }
            }
          }}>
          <ARHFooter />
        </TestWrapper>
      );
      
      // Send button should be disabled
      cy.get('button[aria-label="Send"]').should('be.disabled');
    });

    it('should disable send button when conversation limit is reached (no active conversation with quota-breached)', () => {
      cy.mount(
        <TestWrapper stateOverrides={{ 
          activeConversation: null,
          initLimitations: { reason: 'quota-breached' }
        }}>
          <ARHFooter />
        </TestWrapper>
      );
      
      // Send button should be disabled
      cy.get('button[aria-label="Send"]').should('be.disabled');
    });

    it('should disable send button when message quota is exceeded (danger variant)', () => {
      const quotaExceededMessage = {
        id: 'test-message',
        role: 'bot',
        answer: 'Test response',
        additionalAttributes: {
          quota: {
            enabled: true,
            quota: {
              limit: 10,
              used: 10, // quota exceeded
            },
          },
        },
      };

      cy.mount(
        <TestWrapper stateOverrides={{ 
          messages: [quotaExceededMessage]
        }}>
          <ARHFooter />
        </TestWrapper>
      );
      
      // Send button should be disabled
      cy.get('button[aria-label="Send"]').should('be.disabled');
    });

    it('should enable send button when all conditions are normal', () => {
      cy.mount(
        <TestWrapper stateOverrides={{ 
          inProgress: false,
          activeConversation: { id: 'test-conv', locked: false },
          initLimitations: undefined,
          messages: []
        }}>
          <ARHFooter />
        </TestWrapper>
      );
      
      // Send button should be enabled
      cy.get('button[aria-label="Send"]').should('not.be.disabled');
    });

    it('should enable send button when quota warning is shown (not exceeded)', () => {
      const quotaWarningMessage = {
        id: 'test-message',
        role: 'bot',
        answer: 'Test response',
        additionalAttributes: {
          quota: {
            enabled: true,
            quota: {
              limit: 20,
              used: 15, // warning but not exceeded
            },
          },
        },
      };

      cy.mount(
        <TestWrapper stateOverrides={{ 
          messages: [quotaWarningMessage]
        }}>
          <ARHFooter />
        </TestWrapper>
      );
      
      // Send button should still be enabled for warning
      cy.get('button[aria-label="Send"]').should('not.be.disabled');
    });
  });

  it.only('should send default message from state singleton', () => {
    VirtualAssistantStateSingleton.setMessage('Testing');
    cy.mount(
      <TestWrapper>
        <ARHFooter />
      </TestWrapper>
    );

    cy.get('#query-input').should('have.value', 'Testing');
    cy.get('button[aria-label="Send"]').should('not.be.disabled');
    cy.get('button[aria-label="Send"]').click()
    cy.get('#query-input').should('have.value', '');
  });
});
