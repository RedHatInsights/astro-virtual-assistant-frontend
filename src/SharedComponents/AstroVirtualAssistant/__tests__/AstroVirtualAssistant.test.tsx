/* eslint-disable @typescript-eslint/no-empty-function */
import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import AstroVirtualAssistant from '../AstroVirtualAssistant';
import { MemoryRouter } from 'react-router-dom';
import useStateManager from '../../../aiClients/useStateManager';

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getEnvironment: jest.fn(),
    isBeta: jest.fn(() => false),
    auth: {
      getUser: jest.fn(),
      getToken: jest.fn(() => Promise.resolve('mock-token')),
      token: 'mock-token',
    },
  })),
}));

// Mock feature flag hook - requires Unleash context
jest.mock('@unleash/proxy-client-react');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useFlag: mockUseFlag } = require('@unleash/proxy-client-react');
mockUseFlag.mockReturnValue(true);

jest.mock(
  '../../../aiClients/useStateManager',
  () =>
    jest.fn(() => ({
      managers: [
        {
          model: 'Ask Red Hat',
          stateManager: {},
        },
      ],
      currentModel: 'Ask Red Hat',
      setCurrentModel: () => {},
    })) // create a mock fn
);

describe('AstroVirtualAssistant ARH Show Condition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFlag.mockReturnValue(true); // Default to Chameleon enabled
  });

  it('should show Chameleon when flag is enabled', async () => {
    const { queryByAltText } = render(
      <MemoryRouter>
        <AstroVirtualAssistant showAssistant={true} />
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
        <AstroVirtualAssistant showAssistant={true} />
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
        <AstroVirtualAssistant showAssistant={true} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(queryByAltText('Launch virtual assistant')).toBeInTheDocument();
    });
  });
});
