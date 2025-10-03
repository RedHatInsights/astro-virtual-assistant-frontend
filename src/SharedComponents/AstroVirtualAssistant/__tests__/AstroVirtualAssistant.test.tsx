/* eslint-disable @typescript-eslint/no-empty-function */
import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import AstroVirtualAssistant from '../AstroVirtualAssistant';
import { MemoryRouter } from 'react-router-dom';
import useStateManager from '../../../aiClients/useStateManager';

// Mock fetch to test the actual checkARHAuth function
global.fetch = jest.fn();

// Mock the useChrome hook - provides auth context
const mockChrome = {
  getEnvironment: jest.fn(),
  isBeta: jest.fn(() => false),
  auth: {
    getUser: jest.fn(),
    getToken: jest.fn(() => Promise.resolve('mock-token')),
    token: 'mock-token',
  },
};

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  __esModule: true,
  default: jest.fn(() => mockChrome),
}));

// Mock feature flag hook - requires Unleash context
jest.mock('@unleash/proxy-client-react');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useFlag: mockUseFlag, useFlags: mockUseFlags } = require('@unleash/proxy-client-react');
mockUseFlag.mockReturnValue(true);
mockUseFlags.mockReturnValue([]);

// Create a minimal Redux store for testing
const mockStore = createStore(() => ({}));

jest.mock('@redhat-cloud-services/ai-client-state', () => ({
  createClientStateManager: jest.fn(() => ({
    isInitialized: jest.fn(() => false),
    isInitializing: jest.fn(() => false),
    init: jest.fn(),
    subscribe: jest.fn(() => jest.fn()), // Returns unsubscribe function
    getClient: jest.fn(() => ({
      isInitialized: jest.fn(() => false),
      isInitializing: jest.fn(() => false),
      getWelcomeConfig: jest.fn(() => ({
        content: 'Test welcome content',
      })),
    })),
  })),
  Events: {
    INITIALIZING_MESSAGES: 'INITIALIZING_MESSAGES',
    ACTIVE_CONVERSATION: 'ACTIVE_CONVERSATION',
  },
}));

jest.mock('../../../aiClients/useStateManager');

describe('AstroVirtualAssistant ARH Show Condition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFlag.mockReturnValue(true); // Default to Chameleon enabled

    (useStateManager as jest.Mock).mockReturnValue({
      managers: [
        {
          model: 'Ask Red Hat',
          stateManager: {},
        },
      ],
      currentModel: 'Ask Red Hat',
      setCurrentModel: () => {},
    });
  });

  it('should show Chameleon when flag is enabled', async () => {
    const { queryByAltText } = render(
      <MemoryRouter>
        <Provider store={mockStore}>
          <AstroVirtualAssistant showAssistant={true} />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(queryByAltText('Launch AI assistant')).toBeInTheDocument();
    });
  });

  it('should hide Chameleon when there are no managers', async () => {
    (useStateManager as jest.Mock).mockReturnValue({
      managers: [],
      currentModel: '',
      setCurrentModel: () => {},
    });

    const { queryByAltText } = render(
      <MemoryRouter>
        <Provider store={mockStore}>
          <AstroVirtualAssistant showAssistant={true} />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(queryByAltText('Launch AI assistant')).not.toBeInTheDocument();
    });
  });

  it('should show Astro when flag is disabled', async () => {
    mockUseFlag.mockReturnValue(false);
    const { queryByAltText } = render(
      <MemoryRouter>
        <Provider store={mockStore}>
          <AstroVirtualAssistant showAssistant={true} />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(queryByAltText('Launch virtual assistant')).toBeInTheDocument();
    });
  });
});
