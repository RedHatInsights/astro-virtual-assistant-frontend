import React from 'react';
import ARHBanner from '../../src/Components/ARHClient/ARHBanner';
import { AIStateContext } from '@redhat-cloud-services/ai-react-state';

// Mock state manager that matches the expected interface
const createMockStateManager = () => {
  const state = {
    conversations: [
      { id: 'conv-1', title: 'Test Conversation 1' },
      { id: 'conv-2', title: 'Test Conversation 2' }
    ],
    activeConversation: { id: 'test-conv', title: 'Test Conversation', locked: false },
    messages: [],
    isInitializing: false,
    inProgress: false,
  };

  return {
    getState: () => state,
    createNewConversation: () => Promise.resolve(),
    setActiveConversation: () => {},
    sendMessage: () => {},
    subscribe: () => () => {}, // unsubscribe function
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

describe('ARHBanner Component', () => {
  describe('Privacy variant', () => {
    it('should render privacy banner when open', () => {
      const mockSetOpen = cy.stub();
      
      cy.mount(
        <TestWrapper>
          <ARHBanner isOpen={true} setOpen={mockSetOpen} variant="privacy" />
        </TestWrapper>
      );
      
      // Should show the alert
      cy.get('.pf-v6-c-alert').should('exist');
      
      // Should have correct title
      cy.contains('Important').should('be.visible');
      
      // Should contain privacy message
      cy.contains('This feature uses AI technology').should('be.visible');
      cy.contains('Do not include personal or sensitive information').should('be.visible');
      
      // Should have link to privacy policy
      cy.get('a[href="https://www.redhat.com/en/about/privacy-policy"]')
        .should('exist')
        .should('have.attr', 'target', '_blank')
        .should('have.attr', 'rel', 'noreferrer');
    });

    it('should have close functionality', () => {
      const mockSetOpen = cy.stub().as('setOpen');
      
      cy.mount(
        <TestWrapper>
          <ARHBanner isOpen={true} setOpen={mockSetOpen} variant="privacy" />
        </TestWrapper>
      );
      
      // Click the X button to close (PatternFly close button)
      cy.get('.pf-v6-c-alert__action button').click();
      cy.get('@setOpen').should('have.been.calledWith', false);
    });

    it('should have "Got it" button functionality', () => {
      const mockSetOpen = cy.stub().as('setOpen');
      
      cy.mount(
        <TestWrapper>
          <ARHBanner isOpen={true} setOpen={mockSetOpen} variant="privacy" />
        </TestWrapper>
      );
      
      // Click the "Got it" button
      cy.contains('button', 'Got it').click();
      cy.get('@setOpen').should('have.been.calledWith', false);
    });
  });

  describe('Read-only variant', () => {
    it('should render read-only banner when open', () => {
      const mockSetOpen = cy.stub();
      
      cy.mount(
        <TestWrapper>
          <ARHBanner isOpen={true} setOpen={mockSetOpen} variant="readOnly" />
        </TestWrapper>
      );
      
      // Should show the alert
      cy.get('.pf-v6-c-alert').should('exist');
      
      // Should have correct title
      cy.contains('View-only chat').should('be.visible');
      
      // Should contain read-only message
      cy.contains('Previous chats are view-only').should('be.visible');
      cy.contains('To ask a new question, please start a new chat').should('be.visible');
      
      // Should have "Start a new chat" link button
      cy.contains('button', 'Start a new chat').should('exist');
    });

    it('should handle "Start a new chat" button click', () => {
      const mockSetOpen = cy.stub();
      
      cy.mount(
        <TestWrapper>
          <ARHBanner isOpen={true} setOpen={mockSetOpen} variant="readOnly" />
        </TestWrapper>
      );
      
      // Should be able to click the button (actual hook behavior tested elsewhere)
      cy.contains('button', 'Start a new chat').should('be.visible').click();
    });
  });

  describe('Visibility control', () => {
    it('should not render when isOpen is false', () => {
      const mockSetOpen = cy.stub();
      
      cy.mount(
        <TestWrapper>
          <ARHBanner isOpen={false} setOpen={mockSetOpen} variant="privacy" />
        </TestWrapper>
      );
      
      // Should not render any alert
      cy.get('.pf-v6-c-alert').should('not.exist');
      cy.contains('Important').should('not.exist');
    });

    it('should render when isOpen is true', () => {
      const mockSetOpen = cy.stub();
      
      cy.mount(
        <TestWrapper>
          <ARHBanner isOpen={true} setOpen={mockSetOpen} variant="privacy" />
        </TestWrapper>
      );
      
      // Should render the alert
      cy.get('.pf-v6-c-alert').should('exist');
      cy.contains('Important').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const mockSetOpen = cy.stub();
      
      cy.mount(
        <TestWrapper>
          <ARHBanner isOpen={true} setOpen={mockSetOpen} variant="privacy" />
        </TestWrapper>
      );
      
      // Alert should exist
      cy.get('.pf-v6-c-alert').should('exist');
      
      // Close button should exist
      cy.get('.pf-v6-c-alert__action button').should('exist');
      
      // Should have proper OUIA ID
      cy.get('[data-ouia-component-id="InfoAlert"]').should('exist');
    });

    it('should be keyboard navigable', () => {
      const mockSetOpen = cy.stub();
      
      cy.mount(
        <TestWrapper>
          <ARHBanner isOpen={true} setOpen={mockSetOpen} variant="privacy" />
        </TestWrapper>
      );
      
      // Should be able to focus on interactive elements
      cy.get('a[href="https://www.redhat.com/en/about/privacy-policy"]').focus();
      cy.focused().should('contain.text', 'Red Hat Privacy Statement');
      
      // Tab to close button
      cy.get('.pf-v6-c-alert__action button').focus();
      cy.focused().should('be.visible');
      
      // Tab to got it button
      cy.contains('button', 'Got it').focus();
      cy.focused().should('contain.text', 'Got it');
    });
  });
});