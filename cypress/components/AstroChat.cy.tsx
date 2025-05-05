import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AstroChat } from '../../src/v2/Components/AstroChat/AstroChat';

describe('AstroChat', () => {
  it('renders without crashing', () => {
    cy.mount(
      <BrowserRouter>
        <AstroChat
          messages={[]}
          setMessages={() => {}}
          ask={() => Promise.resolve()}
          preview={false}
          onClose={() => {}}
          blockInput={false}
          fullscreen={false}
          setFullScreen={() => {}}
          isLoading={false}
        />
      </BrowserRouter>
    );
  });
});
