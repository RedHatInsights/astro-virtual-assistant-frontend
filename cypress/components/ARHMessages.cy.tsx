import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ARHMessages from '../../src/Components/ARHClient/ARHMessages';
import { AIStateContext, AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { Conversation, createClientStateManager, StateManager } from '@redhat-cloud-services/ai-client-state';
import { IFDClient } from '@redhat-cloud-services/arh-client';

// Create mock state manager - ARHMessages needs the double-nested getState interface
const createMockStateManager = (customMessages?: any[], overrides?: any) => {
  const defaultMessages = [
    { id: '1', answer: 'Hello!', role: 'user' },
    { id: '2', answer: 'Hi there! How can I help you?', role: 'bot' }
  ];
  
  // Use custom messages if provided, otherwise use defaults
  const activeConversationMessages = customMessages || defaultMessages;
  
  const state: {
      conversations: Record<string, Conversation>;
      activeConversationId: string | null;
      messageInProgress: boolean;
      isInitialized: boolean;
      isInitializing: boolean;
      client: IFDClient;
      initLimitations?: any;
  } = {
    conversations: {
      ['test-conv']: {
        id: 'test-conv',
        messages: activeConversationMessages,
        title: 'Test Conversation',
        locked: false,
        ...overrides?.activeConversation,
      },
    },
    activeConversationId: 'test-conv',
    client: {
      sendMessageFeedback: cy.stub(),
    } as unknown as IFDClient,
    isInitialized: true,
    isInitializing: false,
    messageInProgress: false,
    initLimitations: overrides?.initLimitations,
    ...overrides,
  };

  const manager: StateManager = {
    getState: () => state,
    getActiveConversationMessages: () => activeConversationMessages,
    getClient: () => state.client,
    subscribe: () => () => {},
    getInitLimitation: () => state.initLimitations
  } as unknown as StateManager;
  return manager
};

const TestWrapper = ({ children, messages, stateOverrides }: { children: React.ReactNode; messages?: any[]; stateOverrides?: any }) => {
  const mockStateManager = React.useMemo(() => createMockStateManager(messages, stateOverrides), [messages, stateOverrides]);
  
  return (
    <MemoryRouter>
      <AIStateProvider stateManager={mockStateManager}>
        {children}
      </AIStateProvider>
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

  describe('Message Feedback', () => {
    const botMessageWithFeedback = [
      { 
        id: '1', 
        answer: 'Hello!', 
        role: 'user' 
      },
      { 
        id: '2', 
        answer: 'Here is a helpful response about OpenShift that you can provide feedback on.', 
        role: 'bot'
      }
    ];

    it('should display feedback actions for bot messages', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should render bot message
      cy.contains('Here is a helpful response about OpenShift').should('exist');
      
      // Debug: Check what's actually in the bot message
      cy.get('.pf-chatbot__message--bot').should('exist');
      
      // Let's see if there are any buttons at all in the bot message
      cy.get('.pf-chatbot__message--bot').within(() => {
        // Check if the message-and-actions container exists
        cy.get('.pf-chatbot__message-and-actions').should('exist');
        
        // Look for any buttons at all
        cy.get('button').then(($buttons) => {
          if ($buttons.length === 0) {
            throw new Error('No buttons found in bot message - feedback actions not rendered');
          } else {
            cy.log(`Found ${$buttons.length} buttons in bot message`);
            // If buttons exist, they should be in response actions container
            cy.get('.pf-chatbot__response-actions').should('exist');
            cy.get('.pf-chatbot__response-actions button').should('have.length', 3);
          }
        });
      });
    });

    it('should not display feedback actions for user messages', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should render user message
      cy.contains('Hello!').should('exist');
      
      // Should not display feedback actions for user messages
      cy.get('.pf-chatbot__message--user').within(() => {
        cy.get('.pf-chatbot__response-actions').should('not.exist');
      });
    });

    it('should open positive feedback form when positive button is clicked', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Debug: log button information before clicking
      cy.get('.pf-chatbot__message--bot').within(() => {
        cy.get('.pf-chatbot__response-actions button').first().then(($btn) => {
          cy.log(`Button text: ${$btn.text()}`);
          cy.log(`Button aria-label: ${$btn.attr('aria-label')}`);
          cy.log(`Button disabled: ${$btn.prop('disabled')}`);
        });
        
        // Try clicking the button and force the click if needed
        cy.get('.pf-chatbot__response-actions button').first().click({ force: true });
      });
      
      // Wait a bit for the state to update
      cy.wait(100);
      
      // Should show feedback form
      cy.get('.pf-chatbot__feedback-card').should('exist');
      
      // Should show positive feedback title
      cy.contains('Thank you. Any more feedback?').should('be.visible');
      
      // Should show positive quick responses
      cy.contains('Solved my issue').should('be.visible');
      cy.contains('Easy to understand').should('be.visible');
      cy.contains('Accurate').should('be.visible');
      
      // Should have text area for additional feedback
      cy.get('textarea').should('exist');
      
      // Should have submit button
      cy.contains('Send feedback').should('be.visible');
    });

    it('should open negative feedback form when negative button is clicked', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Click negative feedback button - use the second button which should be thumbs down
      cy.get('.pf-chatbot__message--bot').within(() => {
        cy.get('.pf-chatbot__response-actions button').eq(1).click();
      });
      
      // Should show feedback form
      cy.get('.pf-chatbot__feedback-card').should('exist');
      
      // Should show negative feedback title
      cy.contains('Thank you. How can we improve?').should('be.visible');
      
      // Should show negative quick responses
      cy.contains("Didn't solve my issue").should('be.visible');
      cy.contains('Confusing').should('be.visible');
      cy.contains('Inaccurate').should('be.visible');
      
      // Should have text area for additional feedback
      cy.get('textarea').should('exist');
      
      // Should have submit button
      cy.contains('Send feedback').should('be.visible');
    });

    it('should close feedback form when close button is clicked', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Open feedback form
      cy.get('.pf-chatbot__message--bot').within(() => {
        cy.get('.pf-chatbot__response-actions button').first().click();
      });
      
      // Should show feedback form
      cy.get('.pf-chatbot__feedback-card').should('exist');
      
      // Close the form
      cy.get('.pf-chatbot__feedback-card').within(() => {
        cy.get('.pf-v6-c-card__actions button').click();
      });
      
      // Form should be hidden
      cy.get('.pf-chatbot__feedback-card').should('not.exist');
    });

    it('should submit positive feedback with quick response', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Open positive feedback form
      cy.get('.pf-chatbot__message--bot').last().within(() => {
        cy.get('.pf-chatbot__response-actions button').first().click();
      });
      
      // Select a quick response
      cy.contains('Solved my issue').click();
      
      // Submit feedback
      cy.contains('Send feedback').click();
      
      // Should show feedback completed message
      cy.get('.pf-chatbot__feedback-card-complete').should('exist');
      cy.contains('Thank you.').should('be.visible');
      cy.contains('We appreciate your input.').should('be.visible');
      cy.contains('It helps us improve this experience.').should('be.visible');
    });

    it('should submit negative feedback with free form text', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Open negative feedback form
      cy.get('.pf-chatbot__message--bot').within(() => {
        cy.get('.pf-chatbot__response-actions button').eq(1).click();
      });
      
      // Type in free form feedback
      cy.get('textarea').type('The response could be more detailed and include examples.');
      
      // Submit feedback
      cy.contains('Send feedback').click();
      
      // Should show feedback completed message
      cy.get('.pf-chatbot__feedback-card-complete').should('exist');
      cy.contains('Thank you.').should('be.visible');
    });

    it('should submit feedback with both quick response and free form text', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Open positive feedback form
      cy.get('.pf-chatbot__message--bot').within(() => {
        cy.get('.pf-chatbot__response-actions button').first().click();
      });
      
      // Select quick response and add free form text
      cy.contains('Easy to understand').click();
      cy.get('textarea').type('Very clear and well structured response.');
      
      // Submit feedback
      cy.contains('Send feedback').click();
      
      // Should show feedback completed message
      cy.get('.pf-chatbot__feedback-card-complete').should('exist');
    });

    it('should disable feedback buttons after submission', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Submit positive feedback
      cy.get('.pf-chatbot__message--bot').within(() => {
        cy.get('.pf-chatbot__response-actions button').first().click();
      });
      
      cy.contains('Solved my issue').click();
      cy.contains('Send feedback').click();
      
      // Close feedback completed message
      cy.get('.pf-chatbot__feedback-card-complete').within(() => {
        cy.get('.pf-v6-c-card__actions button').click();
      });
      
      // Feedback buttons should be disabled
      cy.get('.pf-chatbot__message--bot').within(() => {
        cy.get('.pf-chatbot__response-actions button').first().should('be.disabled');
        cy.get('.pf-chatbot__response-actions button').eq(1).should('be.disabled');
      });
    });

    it('should close feedback completed message when close button is clicked', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Submit feedback
      cy.get('.pf-chatbot__message--bot').within(() => {
        cy.get('.pf-chatbot__response-actions button').first().click();
      });
      
      cy.contains('Solved my issue').click();
      cy.contains('Send feedback').click();
      
      // Should show completed message
      cy.get('.pf-chatbot__feedback-card-complete').should('exist');
      
      // Close the completed message
      cy.get('.pf-chatbot__feedback-card-complete').within(() => {
        cy.get('.pf-v6-c-card__actions button').click();
      });
      
      // Completed message should be hidden
      cy.get('.pf-chatbot__feedback-card-complete').should('not.exist');
    });

    it('should copy message content to clipboard when copy button is clicked', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Mock clipboard API
      cy.window().then((win) => {
        cy.stub(win.navigator.clipboard, 'writeText').as('writeText');
      });
      
      // Click copy button
      cy.get('.pf-chatbot__message--bot').within(() => {
        cy.get('.pf-chatbot__response-actions button').eq(2).click();
      });
      
      // Should call clipboard writeText with message content
      cy.get('@writeText').should('have.been.calledWith', 'Here is a helpful response about OpenShift that you can provide feedback on.');
    });

    it('should handle multiple bot messages with independent feedback', () => {
      const multipleBotMessages = [
        { 
          id: '1', 
          answer: 'First bot response about containers.', 
          role: 'bot'
        },
        { 
          id: '2', 
          answer: 'Second bot response about networking.', 
          role: 'bot'
        }
      ];

      cy.mount(
        <TestWrapper messages={multipleBotMessages}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Each message should have its own feedback buttons
      cy.get('.pf-chatbot__message--bot').should('have.length', 2);
      
      cy.get('.pf-chatbot__message--bot').first().within(() => {
        cy.get('.pf-chatbot__response-actions button').should('have.length', 3);
      });
      
      cy.get('.pf-chatbot__message--bot').last().within(() => {
        cy.get('.pf-chatbot__response-actions button').should('have.length', 3);
      });
      
      // Submit feedback on first message
      cy.get('.pf-chatbot__message--bot').first().within(() => {
        cy.get('.pf-chatbot__response-actions button').first().click();
      });
      
      cy.contains('Solved my issue').click();
      cy.contains('Send feedback').click();
      
      // First message buttons should be disabled
      cy.get('.pf-chatbot__message--bot').first().within(() => {
        cy.get('.pf-chatbot__response-actions button').first().should('be.disabled');
        cy.get('.pf-chatbot__response-actions button').eq(1).should('be.disabled');
      });
      
      // Second message buttons should still be enabled
      cy.get('.pf-chatbot__message--bot').last().within(() => {
        cy.get('.pf-chatbot__response-actions button').first().should('not.be.disabled');
        cy.get('.pf-chatbot__response-actions button').eq(1).should('not.be.disabled');
      });
    });

    it('should have proper accessibility attributes for feedback buttons', () => {
      cy.mount(
        <TestWrapper messages={botMessageWithFeedback}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      cy.get('.pf-chatbot__message--bot').within(() => {
        // Feedback buttons should be accessible
        cy.get('.pf-chatbot__response-actions button')
          .should('have.attr', 'type', 'button')
          .should('be.visible')
          .should('have.length', 3);
      });
    });
  });

  describe('Quota Alerts', () => {
    it('should display warning alert when message quota is approaching limit', () => {
      const messagesWithQuotaWarning = [
        { 
          id: '1', 
          answer: 'Hello!', 
          role: 'user' 
        },
        { 
          id: '2', 
          answer: 'Response with quota warning', 
          role: 'bot',
          additionalAttributes: {
            quota: {
              enabled: true,
              quota: {
                limit: 20,
                used: 15, // 15 + 5 = 20 (warning threshold)
              },
            },
          },
        }
      ];

      cy.mount(
        <TestWrapper messages={messagesWithQuotaWarning}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should display warning alert after the message
      cy.get('.pf-v6-c-alert').should('exist').should('have.class', 'pf-m-warning');
      cy.contains('You are nearing the message limit').should('be.visible');
      cy.contains('15 of 20 messages used').should('be.visible');
    });

    it('should display danger alert when message quota is exceeded', () => {
      const messagesWithQuotaExceeded = [
        { 
          id: '1', 
          answer: 'Hello!', 
          role: 'user' 
        },
        { 
          id: '2', 
          answer: 'Response with quota exceeded', 
          role: 'bot',
          additionalAttributes: {
            quota: {
              enabled: true,
              quota: {
                limit: 10,
                used: 10, // quota exceeded
              },
            },
          },
        }
      ];

      cy.mount(
        <TestWrapper messages={messagesWithQuotaExceeded}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should display danger alert after the message
      cy.get('.pf-v6-c-alert').should('exist').should('have.class', 'pf-m-danger');
      cy.contains('Message limit reached').should('be.visible');
      cy.contains('You have reached the message limit for this conversation').should('be.visible');
      cy.contains('To continue, you can start a new chat').should('be.visible');
      
      // Should have "Start a new chat" action link
      cy.contains('button', 'Start a new chat').should('exist');
    });

    it('should not display quota alert when quota is not enabled', () => {
      const messagesWithQuotaDisabled = [
        { 
          id: '1', 
          answer: 'Hello!', 
          role: 'user' 
        },
        { 
          id: '2', 
          answer: 'Response without quota', 
          role: 'bot',
          additionalAttributes: {
            quota: {
              enabled: false,
              quota: {
                limit: 10,
                used: 10,
              },
            },
          },
        }
      ];

      cy.mount(
        <TestWrapper messages={messagesWithQuotaDisabled}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should not display any quota alerts
      cy.get('.pf-v6-c-alert.pf-m-warning').should('not.exist');
      cy.get('.pf-v6-c-alert.pf-m-danger').should('not.exist');
      cy.contains('message limit').should('not.exist');
    });

    it('should not display quota alert when quota data is incomplete', () => {
      const messagesWithIncompleteQuota = [
        { 
          id: '1', 
          answer: 'Hello!', 
          role: 'user' 
        },
        { 
          id: '2', 
          answer: 'Response with incomplete quota', 
          role: 'bot',
          additionalAttributes: {
            quota: {
              enabled: true,
              quota: {
                limit: undefined,
                used: 5,
              },
            },
          },
        }
      ];

      cy.mount(
        <TestWrapper messages={messagesWithIncompleteQuota}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should not display any quota alerts
      cy.get('.pf-v6-c-alert.pf-m-warning').should('not.exist');
      cy.get('.pf-v6-c-alert.pf-m-danger').should('not.exist');
    });
  });

  describe('Welcome Message Content', () => {
    it('should display welcome prompt and bot welcome message when no messages exist', () => {
      cy.mount(
        <TestWrapper messages={[]}>
          <ARHMessages {...defaultProps} username="TestUser" />
        </TestWrapper>
      );
      
      // Should display welcome prompt
      cy.get('.pf-chatbot--layout--welcome').should('exist');
      cy.contains('Hello, TestUser').should('be.visible');
      cy.contains('How may I help you today?').should('be.visible');
      
      // Should display welcome message from bot
      cy.get('#welcome-message').should('exist');
      cy.get('#welcome-message').within(() => {
        cy.contains('Hello Hallo Hola Bonjour こんにちは Olá مرحباً Ahoj Ciao 안녕하세요 Hallo 你好').should('be.visible');
        cy.contains('Get answers from our library of support resources.').should('be.visible');
      });
    });

    it('should display welcome prompt without username when username is not provided', () => {
      cy.mount(
        <TestWrapper messages={[]}>
          <ARHMessages {...defaultProps} username="" />
        </TestWrapper>
      );
      
      // Should display welcome prompt without username
      cy.contains('Hello').should('be.visible');
      cy.contains('How may I help you today?').should('be.visible');
      // Should not contain a comma (which would indicate username was appended)
      cy.contains('Hello,').should('not.exist');
    });

    it('should not display welcome message when messages exist', () => {
      const existingMessages = [
        { id: '1', answer: 'Hello!', role: 'user' },
        { id: '2', answer: 'Hi there!', role: 'bot' }
      ];

      cy.mount(
        <TestWrapper messages={existingMessages}>
          <ARHMessages {...defaultProps} />
        </TestWrapper>
      );
      
      // Should not display welcome prompt
      cy.get('.pf-chatbot--layout--welcome').should('not.exist');
      cy.get('#welcome-message').should('not.exist');
      
      // Should display actual messages
      cy.contains('Hello!').should('be.visible');
      cy.contains('Hi there!').should('be.visible');
    });
  });

  describe('Banner Variants', () => {
    it('should show conversation limit banner when initLimitations reason is quota-breached', () => {
      cy.mount(
        <TestWrapper 
          messages={[]}
          stateOverrides={{
            initLimitations: { reason: 'quota-breached' },
            activeConversationId: null
          }}
        >
          <ARHMessages {...defaultProps} isBannerOpen={true} />
        </TestWrapper>
      );
      
      // Should show conversation limit banner
      cy.get('.pf-v6-c-alert').should('exist').should('have.class', 'pf-m-danger');
      cy.contains('Chat limit reached').should('be.visible');
      cy.contains("You've reached the maximum number of chats").should('be.visible');
      cy.contains('You can start up to 50 chats within a 24-hour period').should('be.visible');
    });

    it('should show read-only banner when active conversation is locked', () => {
      cy.mount(
        <TestWrapper 
          messages={[]}
          stateOverrides={{
            activeConversation: { locked: true }
          }}
        >
          <ARHMessages {...defaultProps} isBannerOpen={true} />
        </TestWrapper>
      );
      
      // Should show read-only banner
      cy.get('.pf-v6-c-alert').should('exist').should('have.class', 'pf-m-info');
      cy.contains('View-only chat').should('be.visible');
      cy.contains('Previous chats are view-only').should('be.visible');
    });

    it('should show privacy banner by default', () => {
      cy.mount(
        <TestWrapper messages={[]}>
          <ARHMessages {...defaultProps} isBannerOpen={true} />
        </TestWrapper>
      );
      
      // Should show privacy banner
      cy.get('.pf-v6-c-alert').should('exist').should('have.class', 'pf-m-info');
      cy.contains('Important').should('be.visible');
      cy.contains('This feature uses AI technology').should('be.visible');
    });
  });
});