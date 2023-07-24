import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { UserMessageEntry } from '../UserMessageEntry';
import { From } from '../../../types/Message';

describe('UserMessageEntry', () => {
  it('Renders the user message', () => {
    render(
      <UserMessageEntry
        message={{
          from: From.USER,
          content: 'Hello world',
        }}
      />
    );

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
