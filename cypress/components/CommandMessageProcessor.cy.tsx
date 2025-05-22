import ScalprumProvider from '@scalprum/react-core';
import { commandMessageProcessor } from '../../src/v2/SharedComponents/AstroVirtualAssistant/CommandMessageProcessor';
import { CommandType } from '../../src/v2/types/Command';
import { AssistantMessage, From } from '../../src/v2/types/Message';
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChromeAPI, ChromeUser } from '@redhat-cloud-services/types';
import { MessageProcessorOptions } from '../../src/Components/Message/MessageProcessor';


const BASIC_MESSAGE : AssistantMessage = {
  from: From.ASSISTANT,
  content: null,
  messageId: '1',
  isLoading: false,
};


const CommandMessageProcessorWrapper: React.FC<{ message: AssistantMessage; options: any }> = ({ message, options }) => {
  useEffect(() => {
    commandMessageProcessor(message, options).catch((e) => {console.error(e)});
  }, [message, options]);

  return <div>CommandMessageProcessor Test</div>;
};

// describe('Basic CommandMessageProcessor functions', () => {
//   let options: any;

//   beforeEach(() => {
//     // Mock options object
//     options = {
//       addSystemMessage: cy.stub(),
//       addBanner: cy.stub(),
//       toggleFeedbackModal: cy.stub(),
//       isPreview: false,
//     };
//   });

//   it('should handle FINISH_CONVERSATION command', async () => {
//     const message : AssistantMessage = {
//       from: From.ASSISTANT,
//       content: null,
//       command: {
//         type: CommandType.FINISH_CONVERSATION,
//         params: { args: [] },
//       },
//       messageId: '1',
//       isLoading: false,
//     };

//     await commandMessageProcessor(message, options);

//     expect(options.addSystemMessage).to.have.been.calledWith('finish_conversation_message', []);
//     expect(options.addBanner).to.have.been.calledWith('finish_conversation_banner', []);
//   });

//   it('should handle REDIRECT command with a valid URL', async () => {
//     const message = {
//       command: {
//         type: CommandType.REDIRECT,
//         params: { args: ['https://example.com'] },
//       },
//       ...BASIC_MESSAGE,
//     };

//     await commandMessageProcessor(message, options);

//     expect(options.addSystemMessage).to.have.been.calledWith('redirect_message', ['https://example.com']);
//   });

//   it('should log an error for REDIRECT command without a URL', async () => {
//     cy.spy(console, 'error').as('consoleError');

//     const message = {
//       command: {
//         type: CommandType.REDIRECT,
//         params: { args: [] },
//       },
//       ...BASIC_MESSAGE,
//     };

//     await commandMessageProcessor(message, options);

//     cy.get('@consoleError').should('be.calledWith', 'URL is required for redirect command');
//   });

//   it('should log an error for TOUR command with an unknown tour name', async () => {
//     cy.spy(console, 'error').as('consoleError');

//     const message = {
//       command: {
//         type: CommandType.TOUR,
//         params: { args: ['unknown'] },
//       },
//       ...BASIC_MESSAGE,
//     };

//     await commandMessageProcessor(message, options);

//     cy.get('@consoleError').should('be.calledWith', 'Unknown tour name: unknown');
//   });

//   it('should handle FEEDBACK_MODAL command', async () => {
//     const message = {
//       command: {
//         type: CommandType.FEEDBACK_MODAL,
//         params: { args: [] },
//       },
//       ...BASIC_MESSAGE,
//     };

//     await commandMessageProcessor(message, options);

//     expect(options.toggleFeedbackModal).to.have.been.calledWith(true);
//   });
// });

describe('CommandMessageProcessors that call APIs', () => {
  let options: MessageProcessorOptions;
  beforeEach(() => {
    // Mock options object
    const user: ChromeUser = {
      identity: {
        user: {
          username: 'test',
          email: '<EMAIL>',
          first_name: 'Test',
          last_name: 'User',
          is_internal: false,
          is_active: true,
          is_org_admin: true,
          locale: 'en-US'
        },
        org_id: '',
        type: ''
      },
      entitlements: {}
    }
    options = {
      addSystemMessage: cy.stub(),
      addBanner: cy.stub(),
      addThumbMessage: cy.stub(),
      toggleFeedbackModal: cy.stub(),
      isPreview: false,
      auth: {
        getUser: async () => Promise.resolve(user),
        getToken: async () => Promise.resolve('token'),
        getOfflineToken: function(): Promise<any> {
          throw new Error('Function not implemented.');
        },
        getRefreshToken: function(): Promise<string> {
          throw new Error('Function not implemented.');
        },
        login: function(): Promise<any> {
          throw new Error('Function not implemented.');
        },
        logout: function(): void {
          throw new Error('Function not implemented.');
        },
        qe: undefined,
        reAuthWithScopes: function(...scopes: string[]): Promise<void> {
          throw new Error('Function not implemented.');
        }
      }
    };
    window.insights.chrome.auth = options.auth;
  });

  // it('should handle MANAGE_ORG_2FA command successfully', async () => {
  //   const message = {
  //     command: {
  //       type: CommandType.MANAGE_ORG_2FA,
  //       params: { args: ['enable'] },
  //     },
  //     ...BASIC_MESSAGE,
  //   };

  //   await commandMessageProcessor(message, options);

  //   expect(options.addBanner).to.have.been.calledWith('toggle_org_2fa', ['enable']);
  // });

  // it('should handle MANAGE_ORG_2FA command with failure', async () => {
  //   cy.stub(window, 'fetch').rejects(new Error('Failed to toggle 2FA'));

  //   const message = {
  //     command: {
  //       type: CommandType.MANAGE_ORG_2FA,
  //       params: { args: ['enable'] },
  //     },
  //     ...BASIC_MESSAGE,
  //   };

  //   await commandMessageProcessor(message, options);

  //   expect(options.addBanner).to.have.been.calledWith('toggle_org_2fa_failed', ['enable']);
  // });

  it('should handle CREATE_SERVICE_ACCOUNT command successfully', () => {
    cy.intercept('POST', 'https://sso.redhat.com/auth/realms/redhat-external/apis/service_accounts/v1', {
      statusCode: 201,
      body: {clientId: '12345', name: 'test-name', description: 'test description please', secret: 'secret'},
    }).as('serviceAccountAPI');
  
    const message = {
      command: {
        type: CommandType.CREATE_SERVICE_ACCOUNT,
        params: { args: ['test-name', 'test description please', 'prod'] },
      },
      ...BASIC_MESSAGE,
    };

    cy.mount(<ScalprumProvider
        config={{ foo: { name: 'foo' } }}
        api={{
          chrome: {
            auth: options.auth,
          }
        }}
      >
        <BrowserRouter>
          <CommandMessageProcessorWrapper message={message} options={options} />
        </BrowserRouter>
      </ScalprumProvider>
    );

    cy.wait('@serviceAccountAPI').then(() => {
      expect(options.addBanner).to.have.been.calledWith('create_service_account', [
        'test-name',
        'test description please',
        '12345',
        'secret',
      ]);
    })
  });

  // it('should handle CREATE_SERVICE_ACCOUNT command with failure', async () => {
  //   cy.stub(window, 'fetch').rejects(new Error('Failed to create service account'));

  //   const message = {
  //     command: {
  //       type: CommandType.CREATE_SERVICE_ACCOUNT,
  //       params: { args: [] },
  //     },
  //     ...BASIC_MESSAGE,
  //   };

  //   await commandMessageProcessor(message, options);

  //   expect(options.addBanner).to.have.been.calledWith('create_service_account_failed', []);
  // });
});