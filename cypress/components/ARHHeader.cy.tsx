import React from 'react';
import ARHHeader from '../../src/Components/ARHClient/ARHHeader';
import { ChatbotDisplayMode } from '@patternfly/chatbot';

describe('ARHHeader Component', () => {
  const defaultProps = {
    scrollToBottomRef: { current: null } as React.RefObject<HTMLDivElement>,
    conversationsDrawerOpened: false,
    setConversationsDrawerOpened: () => {},
    setOpen: () => {},
    setDisplayMode: () => {},
    displayMode: ChatbotDisplayMode.default,
  };

  it('should render header with title and logo', () => {
    cy.mount(<ARHHeader {...defaultProps} />);
    
    // Should have the brand logo
    cy.get('img[alt="Ask Red Hat"]').should('exist');
    
    // Should have the title
    cy.contains('h1', 'Ask Red Hat').should('be.visible');
  });

  it('should render menu toggle button', () => {
    cy.mount(<ARHHeader {...defaultProps} />);
    
    // Should have PatternFly ChatbotHeaderMenu component
    cy.get('.pf-chatbot__menu').should('exist');
    cy.get('button.pf-chatbot__button--toggle-menu[aria-label="Toggle menu"]').should('exist');
  });

  it('should handle menu toggle click', () => {
    const mockSetConversationsDrawerOpened = cy.stub().as('setConversationsDrawerOpened');
    
    cy.mount(
      <ARHHeader 
        {...defaultProps} 
        setConversationsDrawerOpened={mockSetConversationsDrawerOpened}
      />
    );
    
    // Click the menu toggle button
    cy.get('button.pf-chatbot__button--toggle-menu[aria-label="Toggle menu"]').click();
    
    // Should call setConversationsDrawerOpened
    cy.get('@setConversationsDrawerOpened').should('have.been.called');
  });

  it('should render header action buttons', () => {
    cy.mount(<ARHHeader {...defaultProps} />);
    
    // Should have display mode toggle button with specific aria-label
    cy.get('button[aria-label*="Switch chatbot to"]').should('exist');
    
    // Should have close button (PatternFly ChatbotHeaderCloseButton)
    cy.get('button[aria-label="Close"]').should('exist');
    
    // Both menu and close buttons use the same chatbot menu container class
    cy.get('.pf-chatbot__menu').should('have.length', 2);
  });
});