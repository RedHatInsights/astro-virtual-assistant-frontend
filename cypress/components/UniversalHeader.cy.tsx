import React from 'react';
import UniversalHeader from '../../src/Components/UniversalChatbot/UniversalHeader';
import { UniversalChatbotContext, UniversalChatbotContextType } from '../../src/Components/UniversalChatbot/UniversalChatbotProvider';
import { ChatbotDisplayMode } from '@patternfly/chatbot';

describe('UniversalHeader Component', () => {
  const defaultProps = {
    scrollToBottomRef: { current: null } as React.RefObject<HTMLDivElement>,
    conversationsDrawerOpened: false,
    setOpen: () => {},
    setDisplayMode: () => {},
    displayMode: ChatbotDisplayMode.default,
    historyManagement: true,
  };

  const mockContextValue: UniversalChatbotContextType = {
    model: 'Ask Red Hat',
    setCurrentModel: () => {},
    showNewConversationWarning: false,
    setConversationsDrawerOpened: () => {},
    setShowNewConversationWarning: () => {},
    rootElementRef: { current: null } as React.RefObject<HTMLDivElement>,
    availableManagers: {arh: {
        stateManager : {
          modelName: 'Ask Red Hat',
          stateManager: {} as any,
          historyManagement: true,
          streamMessages: true,
          selectionTitle: 'Ask Red Hat',
          selectionDescription: 'General Red Hat support',
          docsUrl: 'http://foo.com'
        },
        authStatus: {
          loading: false,
          isAuthenticated: true,
        }
    }},
  };

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <UniversalChatbotContext.Provider value={mockContextValue}>
      {children}
    </UniversalChatbotContext.Provider>
  );

  it('should render header with title and logo', () => {
    cy.mount(
      <TestWrapper>
        <UniversalHeader {...defaultProps} />
      </TestWrapper>
    );
    
    // Should have the brand logo
    cy.get('img[alt="Ask Red Hat"]').should('exist');
    
    // Should have the title (displays model name from context)
    cy.contains('h1', 'Ask Red Hat').should('be.visible');
  });

  it('should render menu toggle button', () => {
    cy.mount(
      <TestWrapper>
        <UniversalHeader {...defaultProps} />
      </TestWrapper>
    );
    
    // Should have PatternFly ChatbotHeaderMenu component
    cy.get('.pf-chatbot__menu').should('exist');
    cy.get('button.pf-chatbot__button--toggle-menu[aria-label="Toggle menu"]').should('exist');
  });

  it('should handle menu toggle click', () => {
    const mockSetConversationsDrawerOpened = cy.stub().as('setConversationsDrawerOpened');
    
    const customContextValue = {
      ...mockContextValue,
      setConversationsDrawerOpened: mockSetConversationsDrawerOpened,
    };

    const CustomTestWrapper = ({ children }: { children: React.ReactNode }) => (
      <UniversalChatbotContext.Provider value={customContextValue}>
        {children}
      </UniversalChatbotContext.Provider>
    );
    
    cy.mount(
      <CustomTestWrapper>
        <UniversalHeader {...defaultProps} />
      </CustomTestWrapper>
    );
    
    // Click the menu toggle button
    cy.get('button.pf-chatbot__button--toggle-menu[aria-label="Toggle menu"]').click();
    
    // Should call setConversationsDrawerOpened
    cy.get('@setConversationsDrawerOpened').should('have.been.called');
  });

  it('should render header action buttons', () => {
    cy.mount(
      <TestWrapper>
        <UniversalHeader {...defaultProps} />
      </TestWrapper>
    );
    
    // Should have display mode toggle button with specific aria-label
    cy.get('button[aria-label*="Switch chatbot to"]').should('exist');
    
    // Should have close button (PatternFly ChatbotHeaderCloseButton)
    cy.get('button[aria-label="Close"]').should('exist');
    
    // Both menu and close buttons use the same chatbot menu container class
    cy.get('.pf-chatbot__menu').should('have.length', 2);
  });
});