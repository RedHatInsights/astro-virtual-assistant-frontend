import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AstroChat } from '../../src/v2/Components/AstroChat/AstroChat';
import { From, Message } from '../../src/v2/types/Message';

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
});
