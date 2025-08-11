import React from 'react';
import { AIStateContext } from '@redhat-cloud-services/ai-react-state';
import { ChatbotDisplayMode } from '@patternfly/chatbot';

// Import the ARHChatbot component directly to avoid the ARHProvider wrapper
import { ARHChatbot } from '../../src/Components/ARHClient/ARHChatbot';

// Create mock state manager with all methods that ARHChatbot hooks expect
const createMockStateManager = (overrides: any = {}) => {
  const state = {
    conversations: [
      { id: 'conv-1', title: 'Test Conversation 1', locked: false },
      { id: 'conv-2', title: 'Test Conversation 2', locked: false }
    ],
    activeConversation: { id: 'test-conv', locked: false },
    messages: [],
    isInitializing: false,
    inProgress: false,
    initLimitations: undefined,
    ...overrides,
  };

  return {
    getState: () => ({
      getState: () => state,
      getConversations: () => state.conversations,
      getActiveConversationMessages: () => state.messages,
      isInitializing: () => state.isInitializing,
      getInitLimitation: () => state.initLimitations,
      createNewConversation: () => Promise.resolve({ id: 'new-conv', title: 'New Conversation' }),
      setActiveConversation: () => {},
      sendMessage: () => {},
      subscribe: () => () => {},
      dispatch: () => {},
    }),
    getConversations: () => state.conversations,
    isInitializing: () => state.isInitializing,
    getInitLimitation: () => state.initLimitations,
    createNewConversation: () => Promise.resolve({ id: 'new-conv', title: 'New Conversation' }),
    setActiveConversation: () => {},
    sendMessage: () => {},
    subscribe: () => () => {},
    dispatch: () => {},
  };
};

const TestWrapper = ({ children, stateOverrides }: { children: React.ReactNode; stateOverrides?: any }) => {
  const mockStateManager = React.useMemo(() => createMockStateManager(stateOverrides), [stateOverrides]);
  
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

  describe('Conversation Limit Handling', () => {
    it('should allow new chat when no quota limitations exist', () => {
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
      
      // Should render normally with new chat functionality available
      cy.get('#ai-chatbot').should('exist');
      cy.get('#ai-chatbot').within(() => {
        cy.contains('Ask Red Hat').should('exist');
        // Message input should be enabled when no quota limitations
        cy.get('#query-input').should('exist').should('not.be.disabled');
      });
    });

    it('should disable new chat when initLimitation reason is quota-breached', () => {
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
        <TestWrapper stateOverrides={{ 
          initLimitations: { reason: 'quota-breached' }
        }}>
          <ARHChatbot {...props} />
        </TestWrapper>
      );
      
      // Should render chatbot but with limitations
      cy.get('#ai-chatbot').should('exist');
      cy.get('#ai-chatbot').within(() => {
        cy.contains('Ask Red Hat').should('exist');
        // Message input should be disabled when quota is breached
        cy.get('#query-input').should('exist');
        // The send button should be disabled (tested in ARHFooter tests)
        cy.get('button[aria-label="Send"]').should('be.disabled');
      });
    });

    it('should allow new chat when initLimitation has different reason', () => {
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
        <TestWrapper stateOverrides={{ 
          initLimitations: { reason: 'other-limitation' }
        }}>
          <ARHChatbot {...props} />
        </TestWrapper>
      );
      
      // Should render normally since only quota-breached disables new chat
      cy.get('#ai-chatbot').should('exist');
      cy.get('#ai-chatbot').within(() => {
        cy.contains('Ask Red Hat').should('exist');
        // Message input should be enabled for other limitation types
        cy.get('#query-input').should('exist').should('not.be.disabled');
      });
    });

    it('should display conversation limit banner when quota is breached', () => {
      const mockSetOpen = cy.stub();
      const mockSetIsBannerOpen = cy.stub();
      
      const props = {
        avatar: 'test-avatar.svg',
        setOpen: mockSetOpen,
        isBannerOpen: true, // Show banner
        setIsBannerOpen: mockSetIsBannerOpen,
        username: 'testuser',
      };

      cy.mount(
        <TestWrapper stateOverrides={{ 
          initLimitations: { reason: 'quota-breached' },
          activeConversation: null // No active conversation when quota breached
        }}>
          <ARHChatbot {...props} />
        </TestWrapper>
      );
      
      // Should show conversation limit banner instead of privacy banner
      cy.get('#ai-chatbot').should('exist');
      cy.get('#ai-chatbot').within(() => {
        // Should show danger alert for conversation limit
        cy.get('.pf-v6-c-alert').should('exist').should('have.class', 'pf-m-danger');
        cy.contains('Chat limit reached').should('be.visible');
        cy.contains("You've reached the maximum number of chats").should('be.visible');
      });
    });

    it('should preserve other chatbot functionality when quota is breached', () => {
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
        <TestWrapper stateOverrides={{ 
          initLimitations: { reason: 'quota-breached' }
        }}>
          <ARHChatbot {...props} />
        </TestWrapper>
      );
      
      // Other functionality should still work
      cy.get('#ai-chatbot').should('exist');
      cy.get('#ai-chatbot').within(() => {
        // Header should still be present and functional
        cy.contains('Ask Red Hat').should('exist');
        
        // Footer should be present even if input is disabled
        cy.get('#query-input').should('exist');
        
        // The chatbot structure should remain intact
        cy.get('.pf-chatbot__content').should('exist');
      });
    });
  });
});