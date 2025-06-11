import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AstroChat } from '../../src/Components/AstroChat/AstroChat';
import { From, Message } from '../../src/types/Message';

const MAX_MESSAGE_LENGTH = 2048;
const basicMessages: Message[] = [
  {
    from: From.USER,
    content: 'Hello, how can I help you?',
  },
  {
    from: From.ASSISTANT,
    content: 'I am here to assist you.',
    messageId: '1',
    isLoading: false,
  },
  {
    from: From.ASSISTANT,
    content: 'I am here to assist you.',
    messageId: '1',
    isLoading: true,
  },
  {
    from: From.ASSISTANT,
    content: 'Here\'s what I can do',
    messageId: '1',
    isLoading: false,
    options: [
      {
        value: 'option1',
        text: 'Option 1',
        optionId: '1',
      },
      {
        value: 'option2',
        text: 'Option 2',
        optionId: '2',
      },
    ]
  }
];

const AstroChatComponent = ({ m }: { m: Message[] }) => {
  const [messages, setMessages] = useState<Message[]>(m);
  const [isLoading, setIsLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const ask = async (what: string) => {};

  return (
    <BrowserRouter>
      <AstroChat
        messages={messages}
        setMessages={setMessages}
        ask={ask}
        preview={false}
        onClose={() => {}}
        blockInput={false}
        fullscreen={fullscreen}
        setFullScreen={setFullscreen}
        isLoading={isLoading}
      />
    </BrowserRouter>
  );
}

describe('Basic chat test', () => {
  it('renders without crashing', () => {
    cy.mount(
      <AstroChatComponent
        m={[]}
      />
    );
  });

  it('loads messages', () => {
    cy.mount(
      <AstroChatComponent
        m={basicMessages}
      />
    );
    // need better selectors
    cy.get('.user-0-2-11 > .pf-v5-l-split__item > .pf-v5-c-content').contains('Hello, how can I help you?');
    cy.get('p').contains('I am here to assist you.');
    cy.get('.typing-0-2-22').should('exist');

    // check buttons
    cy.contains('Option 1').should('exist');
    cy.contains('Option 2').should('exist');
  });

  it('can remove the AI banner', () => {
    cy.mount(
      <AstroChatComponent
        m={[{
          from: From.ASSISTANT,
          content: 'Hello, how can I help you?',
          isLoading: false,
          messageId: '1',
        }]} 
      />
    );
    cy.get('.pf-v5-c-label__text').click();
    cy.get('.astro-v5-c-alert-welcome').should('not.exist');
  })

  it('shortens messages too long (2048 chars)', () => {
    cy.mount(
      <AstroChatComponent m={[{
          from: From.ASSISTANT,
          content: 'Hello, how can I help you?',
          isLoading: false,
          messageId: '1',
        }]} 
      />
    );
    const longMessage = 'a'.repeat(MAX_MESSAGE_LENGTH);
    cy.get('textarea').invoke('val', longMessage).type('type too much');
    cy.get('textarea').invoke('val').should('have.length', MAX_MESSAGE_LENGTH);
    // ensure banner is shown
    cy.get('.banner-0-2-23 > .pf-v5-c-alert > .pf-v5-c-alert__title').contains('2048 characters');
  })

  it('selects thumbs up feedback', () => {
    cy.intercept('POST', '/api/virtual-assistant-v2/v2/talk')
    cy.mount(
      <AstroChatComponent
        m={[{
          from: From.ASSISTANT,
          content: 'Hello, how can I help you?',
          isLoading: false,
          messageId: '1',
        },
        {
          from: From.ASSISTANT,
          content: 'Are you there?',
          isLoading: false,
          messageId: '2',
        }]} 
      />
    );
    cy.get('.pf-v5-u-pr-sm > .pf-v5-svg').click();
    cy.get('.pf-v5-u-pr-sm > .pf-v5-svg').should('not.exist'); // its been selected, class changed.
  })
});
