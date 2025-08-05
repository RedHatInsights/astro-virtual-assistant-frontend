import React from 'react';
import ARHFooter from '../../src/Components/ARHClient/ARHFooter';
import { AIStateContext } from '@redhat-cloud-services/ai-react-state';

// Create mock state manager - ARHFooter expects a different interface
const createMockStateManager = () => {
  const state = {
    conversations: [],
    activeConversation: { id: 'test-conv', locked: false },
    messages: [],
    isInitializing: false,
    inProgress: false,
  };

  // ARHFooter uses hooks that expect the state manager to have a getState method that returns another object with getState
  return {
    getState: () => ({
      getState: () => state,
      createNewConversation: () => Promise.resolve(),
      setActiveConversation: () => {},
      sendMessage: () => {},
      subscribe: () => () => {},
      dispatch: () => {},
    }),
    createNewConversation: () => Promise.resolve(),
    setActiveConversation: () => {},
    sendMessage: () => {},
    subscribe: () => () => {},
    dispatch: () => {},
  };
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const mockStateManager = React.useMemo(() => createMockStateManager(), []);
  
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
});