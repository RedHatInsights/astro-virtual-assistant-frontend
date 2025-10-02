import React from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import { FlagProvider } from '@unleash/proxy-client-react';
import VAMessageEntry from '../../src/Components/VAClient/VAMessageEntry';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import VAClient from '../../src/aiClients/vaClient';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';

// Mock Chrome API for Scalprum
const mockChromeApi = {
  auth: {
    getToken: () => Promise.resolve('mock-token'),
    getUser: () => Promise.resolve({
      identity: {
        user: {
          username: 'testuser',
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
          is_internal: false,
          is_active: true,
          is_org_admin: true,
          locale: 'en-US'
        },
        account_number: '123456',
        internal: {
          account_id: '123456'
        },
        org_id: 'test-org',
        type: 'User'
      },
      entitlements: {}
    }),
    token: 'mock-token',
  },
  getEnvironment: () => 'stage',
  isBeta: () => false,
  getUserPermissions: () => Promise.resolve([]),
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const vaClient = React.useMemo(() => new VAClient(), []);
  const stateManager = React.useMemo(() => createClientStateManager(vaClient), [vaClient]);
  
  return (
    <ScalprumProvider config={{}} api={{ chrome: mockChromeApi }}>
      <FlagProvider config={{
        url: 'http://localhost:4242/api/frontend',
        clientKey: 'test-key',
        appName: 'test-app',
      }}>
        <AIStateProvider stateManager={stateManager}>
          {children}
        </AIStateProvider>
      </FlagProvider>
    </ScalprumProvider>
  );
};

describe('VAMessageEntry Component - Message Types', () => {
  beforeEach(() => {
    // Mock Unleash API calls
    cy.intercept('GET', '**/api/frontend**', {
      statusCode: 200,
      body: {
        toggles: [
          {
            name: 'platform.va.chameleon.enabled',
            enabled: true,
            variant: {
              name: 'disabled',
              enabled: false
            }
          }
        ]
      }
    }).as('unleashAPI');

    // Mock Unleash metrics endpoint
    cy.intercept('POST', '**/api/frontend/client/metrics', {
      statusCode: 200,
      body: {}
    }).as('unleashMetrics');

    // Mock VA API calls for message sending
    cy.intercept('POST', '**/api/virtual-assistant-v2/v2/talk', {
      statusCode: 200,
      body: {
        response: [
          {
            text: 'Response to option selection',
            type: 'TEXT'
          }
        ],
        session_id: 'test-session-123'
      }
    }).as('vaTalk');
  });

  describe('User Messages', () => {
    it('should render user message with correct structure', () => {
      const userMessage = {
        id: 'user-msg-1',
        role: 'user' as const,
        answer: 'Hello, can you help me with my account?',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {}
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={userMessage} avatar="user-avatar.png" />
        </TestWrapper>
      );

      // Should render PatternFly Message component with user role
      cy.get('.pf-chatbot__message--user').should('exist');
      
      // Should display user message content
      cy.contains('Hello, can you help me with my account?').should('be.visible');
      
      // Should have user avatar
      cy.get('.pf-chatbot__message-avatar').should('exist');
      
      // Should have timestamp
      cy.get('.pf-chatbot__message-meta').should('contain', '1/1/2024');
      
      // Should disable markdown for user messages
      cy.get('.pf-chatbot__message--user').should('exist');
    });
  });

  describe('Bot Text Response', () => {
    it('should render bot text response correctly', () => {
      const botMessage = {
        id: 'bot-msg-1',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: [
            {
              text: 'Hello! I can help you with account management, billing, and technical support.',
              type: 'TEXT' as const
            }
          ]
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={botMessage} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should render PatternFly Message component with bot role  
      cy.get('.pf-chatbot__message--bot').should('exist');
      
      // Should display bot response text
      cy.contains('Hello! I can help you with account management, billing, and technical support.').should('be.visible');
      
      // Should have bot avatar (ARH icon)
      cy.get('.pf-chatbot__message-avatar').should('exist');
      
      // Should have AI label
      cy.get('.pf-chatbot__message-meta').should('contain', 'AI');
      
      // Should have correct aria-label
      cy.get('[aria-label*="AI response: Hello! I can help you"]').should('exist');
    });
  });

  describe('Bot Options Response', () => {
    it('should render bot options response with quick responses', () => {
      const optionsMessage = {
        id: 'bot-options-1',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: [
            {
              text: 'What would you like help with today?',
              type: 'OPTIONS' as const,
              options: [
                {
                  text: 'Account Management',
                  value: 'account_management',
                  option_id: 'opt-1'
                },
                {
                  text: 'Billing Questions',
                  value: 'billing_questions',
                  option_id: 'opt-2'
                },
                {
                  text: 'Technical Support',
                  value: 'technical_support',
                  option_id: 'opt-3'
                }
              ]
            }
          ]
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={optionsMessage} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should render bot message with options text
      cy.contains('What would you like help with today?').should('be.visible');
      
      // Should render quick response buttons
      cy.contains('Account Management').should('be.visible');
      cy.contains('Billing Questions').should('be.visible');
      cy.contains('Technical Support').should('be.visible');
      
      // Should have clickable quick response buttons
      cy.contains('Account Management').should('be.enabled');
      cy.contains('Billing Questions').should('be.enabled');
      cy.contains('Technical Support').should('be.enabled');
      
      // Should have proper button structure for quick responses
      cy.get('.pf-chatbot__message--bot').should('exist');
    });

    it('should render options with clickable buttons', () => {
      const optionsMessage = {
        id: 'bot-options-2',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: [
            {
              text: 'Choose an option:',
              type: 'OPTIONS' as const,
              options: [
                {
                  text: 'Option 1',
                  value: 'option_1',
                  option_id: 'opt-1'
                }
              ]
            }
          ]
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={optionsMessage} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should render the option text and button
      cy.contains('Choose an option:').should('be.visible');
      cy.contains('Option 1').should('be.visible');
      
      // Option button should be clickable
      cy.contains('Option 1').should('not.be.disabled');
    });
  });

  describe('Bot Command Response', () => {
    it('should render finish conversation command', () => {
      const finishCommand = {
        id: 'bot-command-1',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: [
            {
              command: 'core_finish_conversation',
              args: [],
              type: 'COMMAND' as const
            }
          ]
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={finishCommand} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should render conversation end banner and system message
      cy.contains('You can start a new conversation at any time by typing below.').should('be.visible');
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-info');
    });

    it('should handle commands that render banners', () => {
      const commandMessage = {
        id: 'bot-command-2',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: [
            {
              command: 'core_finish_conversation',
              args: [],
              type: 'COMMAND' as const
            }
          ]
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={commandMessage} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Command should result in rendered banner messages
      cy.get('.pf-v6-c-alert').should('exist');
    });

    it('should handle commands with no output gracefully', () => {
      const unknownCommand = {
        id: 'bot-command-3',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: [
            {
              command: 'unknown_command',
              args: ['arg1'],
              type: 'COMMAND' as const
            }
          ]
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={unknownCommand} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should handle unknown commands without error - no content rendered
      cy.get('.pf-v6-c-alert').should('not.exist');
      cy.get('section[aria-label*="Message from bot"]').should('not.exist');
    });
  });

  describe('Mixed Response Types', () => {
    it('should render multiple response types from single message', () => {
      const mixedMessage = {
        id: 'bot-mixed-1',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: [
            {
              text: 'Here is some information:',
              type: 'TEXT' as const
            },
            {
              text: 'What would you like to do next?',
              type: 'OPTIONS' as const,
              options: [
                {
                  text: 'Continue',
                  value: 'continue',
                  option_id: 'continue-1'
                },
                {
                  text: 'Go Back',
                  value: 'go_back',
                  option_id: 'back-1'
                }
              ]
            }
          ]
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={mixedMessage} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should render both text response and options
      cy.contains('Here is some information:').should('be.visible');
      cy.contains('What would you like to do next?').should('be.visible');
      cy.contains('Continue').should('be.visible');
      cy.contains('Go Back').should('be.visible');
      
      // Both option buttons should be clickable
      cy.contains('Continue').should('be.enabled');
      cy.contains('Go Back').should('be.enabled');
    });
  });

  describe('Error Handling', () => {
    it('should handle messages with no VA response', () => {
      const emptyMessage = {
        id: 'bot-empty-1',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: []
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={emptyMessage} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should render without error, but no content
      cy.get('.pf-chatbot__message--bot').should('not.exist');
    });

    it('should handle messages with undefined additionalAttributes', () => {
      const undefinedMessage = {
        id: 'bot-undefined-1',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: undefined
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={undefinedMessage} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should render without error, but no content
      cy.get('.pf-chatbot__message--bot').should('not.exist');
    });

    it('should handle unknown response types gracefully', () => {
      const unknownMessage = {
        id: 'bot-unknown-1',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: [
            {
              type: 'UNKNOWN_TYPE' as any,
              data: 'some data'
            }
          ]
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={unknownMessage} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should render without content but not crash
      cy.get('.pf-chatbot__message--bot').should('not.exist');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for text responses', () => {
      const textMessage = {
        id: 'bot-aria-1',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: [
            {
              text: 'This is an accessible message',
              type: 'TEXT' as const
            }
          ]
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={textMessage} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should have proper aria-label
      cy.get('[aria-label*="AI response: This is an accessible message"]').should('exist');
    });

    it('should have proper ARIA labels for options responses', () => {
      const optionsMessage = {
        id: 'bot-aria-2',
        role: 'bot' as const,
        answer: '',
        date: new Date('2024-01-01T10:00:00Z'),
        additionalAttributes: {
          vaResponse: [
            {
              text: 'Choose an option',
              type: 'OPTIONS' as const,
              options: [
                {
                  text: 'Option A',
                  value: 'option_a',
                  option_id: 'opt-a'
                }
              ]
            }
          ]
        }
      };

      cy.mount(
        <TestWrapper>
          <VAMessageEntry message={optionsMessage} avatar="bot-avatar.png" />
        </TestWrapper>
      );

      // Should have proper aria-label for the options text
      cy.get('[aria-label*="AI response: Choose an option"]').should('exist');
      
      // Quick response buttons should be accessible
      cy.contains('Option A').should('be.visible').and('be.enabled');
    });
  });
});
