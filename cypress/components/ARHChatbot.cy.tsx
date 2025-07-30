import React from 'react';
import { AIStateContext } from '@redhat-cloud-services/ai-react-state';
import { ChatbotDisplayMode } from '@patternfly/chatbot';

// Import the ARHChatbot component directly to avoid the ARHProvider wrapper
import { ARHChatbot } from '../../src/Components/ARHClient/ARHChatbot';

// Create mock state manager with all methods that ARHChatbot hooks expect
const createMockStateManager = () => {
  const state = {
    conversations: [
      { id: 'conv-1', title: 'Test Conversation 1', locked: false },
      { id: 'conv-2', title: 'Test Conversation 2', locked: false }
    ],
    activeConversation: { id: 'test-conv', locked: false },
    messages: [],
    isInitializing: false,
    inProgress: false,
  };

  return {
    getState: () => ({
      getState: () => state,
      getConversations: () => state.conversations,
      getActiveConversationMessages: () => state.messages,
      isInitializing: () => state.isInitializing,
      createNewConversation: () => Promise.resolve({ id: 'new-conv', title: 'New Conversation' }),
      setActiveConversation: () => {},
      sendMessage: () => {},
      subscribe: () => () => {},
      dispatch: () => {},
    }),
    getConversations: () => state.conversations,
    isInitializing: () => state.isInitializing,
    createNewConversation: () => Promise.resolve({ id: 'new-conv', title: 'New Conversation' }),
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

describe('ARHChatbot Component', () => {
  it('should render chatbot interface', () => {
    const mockSetOpen = cy.stub();
    const mockSetIsBannerOpen = cy.stub();
    
    const props = {
      avatar: 'test-avatar.svg',
      setOpen: mockSetOpen,
      isBannerOpen: false,
      setIsBannerOpen: mockSetIsBannerOpen,
      username: 'testuser',
    };

    cy.mount(
      <TestWrapper>
        <ARHChatbot {...props} />
      </TestWrapper>
    );
    
    // Should render the main chatbot container with proper ARIA label
    cy.get('#ai-chatbot').should('exist').should('have.attr', 'aria-label', 'AI Assistant Chatbot');
    
    // Should contain the ARH header component
    cy.get('#ai-chatbot').within(() => {
      cy.contains('Ask Red Hat').should('exist');
    });
  });

  it('should render with PatternFly chatbot components', () => {
    const mockSetOpen = cy.stub();
    const mockSetIsBannerOpen = cy.stub();
    
    const props = {
      avatar: 'test-avatar.svg',
      setOpen: mockSetOpen,
      isBannerOpen: false,
      setIsBannerOpen: mockSetIsBannerOpen,
      username: 'testuser',
    };

    cy.mount(
      <TestWrapper>
        <ARHChatbot {...props} />
      </TestWrapper>
    );
    
    // Should render the chatbot container
    cy.get('#ai-chatbot').should('exist');
    
    // Should have chatbot header and footer components
    cy.get('#ai-chatbot').within(() => {
      cy.contains('Ask Red Hat').should('exist'); // ARHHeader
      cy.get('#query-input').should('exist'); // ARHFooter input
    });
  });

  it('should handle banner state correctly', () => {
    const mockSetOpen = cy.stub();
    const mockSetIsBannerOpen = cy.stub();
    
    const props = {
      avatar: 'test-avatar.svg',
      setOpen: mockSetOpen,
      isBannerOpen: true, // Test with banner open
      setIsBannerOpen: mockSetIsBannerOpen,
      username: 'testuser',
    };
    
    cy.mount(
      <TestWrapper>
        <ARHChatbot {...props} />
      </TestWrapper>
    );
    
    // Should render the chatbot container
    cy.get('#ai-chatbot').should('exist').should('have.attr', 'aria-label', 'AI Assistant Chatbot');
    
    // Should contain the integrated ARH components
    cy.get('#ai-chatbot').within(() => {
      // Header should be present
      cy.contains('Ask Red Hat').should('exist');
      // Message input should be present  
      cy.get('#query-input').should('exist');
    });
  });
});