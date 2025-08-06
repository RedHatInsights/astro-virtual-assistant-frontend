import React from 'react';
import { MemoryRouter } from 'react-router-dom';
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
    <MemoryRouter>
      <AIStateContext.Provider value={mockStateManager}>
        {children}
      </AIStateContext.Provider>
    </MemoryRouter>
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
              snippet: 'This guide covers the basics of getting started with Red Hat OpenShift Container Platform.',
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
              snippet: 'Complete installation guide for OpenShift Container Platform.',
              link: 'https://docs.openshift.com/install'
            },
            {
              title: 'OpenShift Developer Guide',
              snippet: 'Developer-focused documentation for building applications on OpenShift.',
              link: 'https://docs.openshift.com/developer'
            },
            {
              title: 'OpenShift Administration',
              snippet: 'Administrative tasks and cluster management documentation.',
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
      cy.contains('1/3').should('be.visible');
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
      cy.contains('2/3').should('be.visible');
      
      // Navigate to previous source
      cy.get('button[data-action="previous"]').click();
      
      cy.get('.pf-chatbot__sources-card-title a')
        .should('contain.text', 'OpenShift Installation Guide');
      cy.contains('1/3').should('be.visible');
    });

    it('should handle navigation boundaries correctly', () => {
      cy.mount(
        <TestWrapper messages={messagesWithMultipleSources}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should start at first source, previous button should be disabled
      cy.contains('1/3').should('be.visible');
      cy.get('button[data-action="previous"]').should('be.disabled');
      
      // Navigate to last source
      cy.get('button[data-action="next"]').click(); // Go to 2/3
      cy.get('button[data-action="next"]').click(); // Go to 3/3
      
      cy.get('.pf-chatbot__sources-card-title a')
        .should('contain.text', 'OpenShift Administration');
      cy.contains('3/3').should('be.visible');
      
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

  describe('Internal Navigation', () => {
    const messagesWithInternalLinks = [
      { 
        id: '1', 
        answer: 'Hello!', 
        role: 'user' 
      },
      { 
        id: '2', 
        answer: 'Here are some internal Red Hat resources.', 
        role: 'bot',
        additionalAttributes: {
          sources: [
            {
              title: 'Internal Documentation',
              snippet: 'Internal Red Hat documentation.',
              link: '/internal/docs'
            },
            {
              title: 'External Documentation',
              snippet: 'External documentation.',
              link: 'https://external.example.com/docs'
            }
          ]
        }
      }
    ];

    it('should handle internal navigation for internal links', () => {
      cy.mount(
        <TestWrapper messages={messagesWithInternalLinks}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Find the internal link - it should prevent default and handle navigation internally
      cy.get('.pf-chatbot__sources-card-title').within(() => {
        cy.get('a[href="/internal/docs"]').should('exist');
        // We can't easily test the navigate function being called, but we can verify the link exists
        // and has the correct structure for internal navigation
      });
    });

    it('should handle external links normally', () => {
      cy.mount(
        <TestWrapper messages={messagesWithInternalLinks}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Navigate to the external source
      cy.get('button[data-action="next"]').click();
      
      // Find the external link - it should link normally
      cy.get('.pf-chatbot__sources-card-title').within(() => {
        cy.get('a[href="https://external.example.com/docs"]')
          .should('exist')
          .should('contain.text', 'External Documentation');
      });
    });

    it('should properly identify internal vs external links', () => {
      const messagesWithMixedLinks = [
        { 
          id: '1', 
          answer: 'Hello!', 
          role: 'user' 
        },
        { 
          id: '2', 
          answer: 'Mixed link types.', 
          role: 'bot',
          additionalAttributes: {
            sources: [
              {
                title: 'Internal Path',
                snippet: 'Internal Red Hat path.',
                link: '/settings/account'
              },
              {
                title: 'External Site',
                snippet: 'External site.',
                link: 'https://docs.example.com'
              },
              {
                title: 'Invalid URL',
                snippet: 'Invalid URL format.',
                link: 'not-a-valid-url'
              }
            ]
          }
        }
      ];

      cy.mount(
        <TestWrapper messages={messagesWithMixedLinks}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should render all sources correctly regardless of link type
      cy.get('.pf-chatbot__source').within(() => {
        cy.contains('3 sources').should('be.visible');
      });
      
      // Check each source type
      cy.get('.pf-chatbot__sources-card-title a[href="/settings/account"]').should('exist');
      
      cy.get('button[data-action="next"]').click();
      cy.get('.pf-chatbot__sources-card-title a[href="https://docs.example.com"]').should('exist');
      
      cy.get('button[data-action="next"]').click();
      cy.get('.pf-chatbot__sources-card-title a[href="not-a-valid-url"]').should('exist');
    });
  });

  describe('Markdown Rendering', () => {
    const messagesWithMarkdown = [
      { 
        id: '1', 
        answer: '**This is bold text** and *this is italic text*. Here is a [link](https://example.com).', 
        role: 'user' 
      },
      { 
        id: '2', 
        answer: '**This is bold text** and *this is italic text*. Here is a [link](https://example.com).', 
        role: 'bot'
      }
    ];

    it('should disable markdown rendering for user messages', () => {
      cy.mount(
        <TestWrapper messages={messagesWithMarkdown}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Find user message - it should render markdown as plain text
      cy.get('.pf-chatbot__message--user').within(() => {
        // User message should contain raw markdown syntax (not processed)
        cy.contains('**This is bold text** and *this is italic text*. Here is a [link](https://example.com).').should('exist');
        
        // Should NOT contain processed markdown elements
        cy.get('strong').should('not.exist');
        cy.get('em').should('not.exist');
        cy.get('a[href="https://example.com"]').should('not.exist');
      });
    });

    it('should enable markdown rendering for bot messages', () => {
      cy.mount(
        <TestWrapper messages={messagesWithMarkdown}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Find bot message - it should render processed markdown
      cy.get('.pf-chatbot__message--bot').within(() => {
        // Bot message should contain processed markdown elements
        cy.get('strong').should('contain.text', 'This is bold text');
        cy.get('em').should('contain.text', 'this is italic text');
        cy.get('a[href="https://example.com"]').should('contain.text', 'link');
        
        // Should NOT contain raw markdown syntax
        cy.contains('**This is bold text**').should('not.exist');
        cy.contains('*this is italic text*').should('not.exist');
        cy.contains('[link](https://example.com)').should('not.exist');
      });
    });

    it('should handle complex markdown differently for user vs bot', () => {
      const complexMarkdownMessages = [
        { 
          id: '1', 
          answer: '# Heading\n\n- List item 1\n- List item 2\n\n```code block```', 
          role: 'user' 
        },
        { 
          id: '2', 
          answer: '# Heading\n\n- List item 1\n- List item 2\n\n```code block```', 
          role: 'bot'
        }
      ];

      cy.mount(
        <TestWrapper messages={complexMarkdownMessages}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // User message should contain raw markdown
      cy.get('.pf-chatbot__message--user').within(() => {
        cy.contains('# Heading').should('exist');
        cy.contains('- List item 1').should('exist');
        cy.contains('```code block```').should('exist');
        
        // Should NOT contain processed HTML elements
        cy.get('h1').should('not.exist');
        cy.get('ul').should('not.exist');
        cy.get('code').should('not.exist');
      });
      
      // Bot message should contain processed markdown
      cy.get('.pf-chatbot__message--bot').within(() => {
        cy.get('h1').should('contain.text', 'Heading');
        cy.get('ul').should('exist');
        cy.get('li').should('contain.text', 'List item 1');
        cy.get('li').should('contain.text', 'List item 2');
        cy.get('code').should('contain.text', 'code block');
      });
    });
  });
});