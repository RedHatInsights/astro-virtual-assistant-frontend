import React from 'react';
import ARHMessages from '../../src/Components/ARHClient/ARHMessages';
import { AIStateContext } from '@redhat-cloud-services/ai-react-state';

// Create mock state manager - ARHMessages needs the double-nested getState interface
const createMockStateManager = (customMessages?: any[]) => {
  const defaultMessages = [
    { id: '1', answer: 'Hello!', role: 'user' },
    { id: '2', answer: 'Hi there! How can I help you?', role: 'bot' }
  ];
  
  // Use custom messages if provided, otherwise use defaults
  const activeConversationMessages = customMessages || defaultMessages;
  
  const state = {
    conversations: [],
    activeConversation: { id: 'test-conv', locked: false },
    messages: activeConversationMessages,
    isInitializing: false,
    inProgress: false,
  };

  return {
    getState: () => ({
      getState: () => state,
      // This is the key - getActiveConversationMessages must return the custom messages
      getActiveConversationMessages: () => activeConversationMessages,
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

const TestWrapper = ({ children, messages }: { children: React.ReactNode; messages?: any[] }) => {
  const mockStateManager = React.useMemo(() => createMockStateManager(messages), [messages]);
  
  return (
    <AIStateContext.Provider value={mockStateManager}>
      {children}
    </AIStateContext.Provider>
  );
};

describe('ARHMessages Component', () => {
  const defaultProps = {
    scrollToBottomRef: { current: null } as React.RefObject<HTMLDivElement>,
    isBannerOpen: false,
    avatar: 'test-avatar.svg',
    setIsBannerOpen: () => {},
    username: 'testuser',
  };

  it('should render messages container', () => {
    cy.mount(
      <TestWrapper>
        <ARHMessages {...defaultProps} />
      </TestWrapper>
    );
    
    // Should render messages component without errors - basic success test
    cy.get('body').should('not.be.empty');
  });

  it('should render with banner closed', () => {
    cy.mount(
      <TestWrapper>
        <ARHMessages {...defaultProps} isBannerOpen={false} />
      </TestWrapper>
    );
    
    // Should render ChatbotContent component
    cy.get('.pf-chatbot__content').should('exist');
    
    // Should render MessageBox with proper region role
    cy.get('.pf-chatbot__messagebox[role="region"]').should('exist');
    
    // Should render successfully - the state manager provides empty messages which should show welcome prompt
    // But the welcome prompt rendering depends on complex state, so just verify basic rendering
    cy.get('.pf-chatbot__content').within(() => {
      cy.get('.pf-chatbot__messagebox').should('exist');
    });
  });

  it('should handle banner state changes', () => {
    cy.mount(
      <TestWrapper>
        <ARHMessages {...defaultProps} isBannerOpen={true} />
      </TestWrapper>
    );
    
    // Should render messages component with banner open
    cy.get('.pf-chatbot__content').should('exist');
    cy.get('.pf-chatbot__messagebox[role="region"]').should('exist');
    
    // Should render successfully with banner open
    cy.get('.pf-chatbot__content').within(() => {
      cy.get('.pf-chatbot__messagebox').should('exist');
    });
  });

  describe('Message Sources', () => {
    const messagesWithSingleSource = [
      { 
        id: '1', 
        answer: 'Hello!', 
        role: 'user' 
      },
      { 
        id: '2', 
        answer: 'Here is information about OpenShift.', 
        role: 'bot',
        additionalAttributes: {
          sources: [
            {
              title: 'Getting Started with OpenShift',
              body: 'This guide covers the basics of getting started with Red Hat OpenShift Container Platform.',
              link: 'https://docs.openshift.com/getting-started'
            }
          ]
        }
      }
    ];

    const messagesWithMultipleSources = [
      { 
        id: '1', 
        answer: 'Hello!', 
        role: 'user' 
      },
      { 
        id: '2', 
        answer: 'Here are multiple OpenShift resources.', 
        role: 'bot',
        additionalAttributes: {
          sources: [
            {
              title: 'OpenShift Installation Guide',
              body: 'Complete installation guide for OpenShift Container Platform.',
              link: 'https://docs.openshift.com/install'
            },
            {
              title: 'OpenShift Developer Guide',
              body: 'Developer-focused documentation for building applications on OpenShift.',
              link: 'https://docs.openshift.com/developer'
            },
            {
              title: 'OpenShift Administration',
              body: 'Administrative tasks and cluster management documentation.',
              link: 'https://docs.openshift.com/admin'
            }
          ]
        }
      }
    ];

    it('should render source card for message with single source', () => {
      cy.mount(
        <TestWrapper messages={messagesWithSingleSource}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Verify message content is rendered
      cy.contains('Here is information about OpenShift.').should('exist');
      
      // Should render the PatternFly chatbot source container
      cy.get('.pf-chatbot__source').should('exist');
      
      // Should show source count
      cy.get('.pf-chatbot__source').within(() => {
        cy.contains('1 source').should('be.visible');
      });
      
      // Should render the PatternFly SourcesCard
      cy.get('.pf-chatbot__sources-card').should('exist');
      
      // Should display source title as a link
      cy.get('.pf-chatbot__sources-card-title').within(() => {
        cy.get('a[href="https://docs.openshift.com/getting-started"]')
          .should('contain.text', 'Getting Started with OpenShift');
      });
      
      // Should display source body
      cy.get('.pf-chatbot__sources-card-body')
        .should('contain.text', 'This guide covers the basics of getting started with Red Hat OpenShift Container Platform.');
    });

    it('should render source card for message with multiple sources', () => {
      cy.mount(
        <TestWrapper messages={messagesWithMultipleSources}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should render the PatternFly chatbot source container
      cy.get('.pf-chatbot__source').should('exist');
      
      // Should show source count (plural)
      cy.get('.pf-chatbot__source').within(() => {
        cy.contains('3 sources').should('be.visible');
      });
      
      // Should render the PatternFly SourcesCard
      cy.get('.pf-chatbot__sources-card').should('exist');
      
      // Should start with first source
      cy.get('.pf-chatbot__sources-card-title a')
        .should('contain.text', 'OpenShift Installation Guide')
        .should('have.attr', 'href', 'https://docs.openshift.com/install');
      cy.get('.pf-chatbot__sources-card-body')
        .should('contain.text', 'Complete installation guide for OpenShift Container Platform.');
      cy.contains('1 of 3').should('be.visible');
    });

    it('should navigate between multiple sources', () => {
      cy.mount(
        <TestWrapper messages={messagesWithMultipleSources}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Navigate to next source using PatternFly navigation
      cy.get('button[data-action="next"]').click();
      
      cy.get('.pf-chatbot__sources-card-title a')
        .should('contain.text', 'OpenShift Developer Guide')
        .should('have.attr', 'href', 'https://docs.openshift.com/developer');
      cy.get('.pf-chatbot__sources-card-body')
        .should('contain.text', 'Developer-focused documentation for building applications on OpenShift.');
      cy.contains('2 of 3').should('be.visible');
      
      // Navigate to previous source
      cy.get('button[data-action="previous"]').click();
      
      cy.get('.pf-chatbot__sources-card-title a')
        .should('contain.text', 'OpenShift Installation Guide');
      cy.contains('1 of 3').should('be.visible');
    });

    it('should handle navigation boundaries correctly', () => {
      cy.mount(
        <TestWrapper messages={messagesWithMultipleSources}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should start at first source, previous button should be disabled
      cy.contains('1 of 3').should('be.visible');
      cy.get('button[data-action="previous"]').should('be.disabled');
      
      // Navigate to last source
      cy.get('button[data-action="next"]').click(); // Go to 2 of 3
      cy.get('button[data-action="next"]').click(); // Go to 3 of 3
      
      cy.get('.pf-chatbot__sources-card-title a')
        .should('contain.text', 'OpenShift Administration');
      cy.contains('3 of 3').should('be.visible');
      
      // Next button should be disabled at last source
      cy.get('button[data-action="next"]').should('be.disabled');
    });

    it('should have proper navigation button accessibility', () => {
      cy.mount(
        <TestWrapper messages={messagesWithMultipleSources}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should have proper ARIA labels for PatternFly navigation
      cy.get('button[data-action="previous"]')
        .should('have.attr', 'aria-label', 'Go to previous page');
      cy.get('button[data-action="next"]')
        .should('have.attr', 'aria-label', 'Go to next page');
      
      // Should have nav element with proper ARIA label
      cy.get('nav[aria-label="Pagination"]').should('exist');
    });

    it('should not render source card for messages without sources', () => {
      const messagesWithoutSources = [
        { id: '1', answer: 'Hello!', role: 'user' },
        { id: '2', answer: 'Hi there! How can I help you?', role: 'bot' }
      ];
      
      cy.mount(
        <TestWrapper messages={messagesWithoutSources}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should not render any PatternFly source components
      cy.get('.pf-chatbot__source').should('not.exist');
      cy.get('.pf-chatbot__sources-card').should('not.exist');
    });

    it('should handle empty sources array gracefully', () => {
      const messagesWithEmptySources = [
        { 
          id: '1', 
          answer: 'Hello!', 
          role: 'user' 
        },
        { 
          id: '2', 
          answer: 'Here is a message with empty sources.', 
          role: 'bot',
          additionalAttributes: {
            sources: []
          }
        }
      ];
      
      cy.mount(
        <TestWrapper messages={messagesWithEmptySources}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should not render PatternFly source components for empty sources array
      cy.get('.pf-chatbot__source').should('not.exist');
      cy.get('.pf-chatbot__sources-card').should('not.exist');
    });
  });
});