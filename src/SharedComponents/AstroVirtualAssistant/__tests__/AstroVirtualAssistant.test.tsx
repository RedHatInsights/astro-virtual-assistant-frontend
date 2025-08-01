/* eslint-disable @typescript-eslint/no-empty-function */
import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import AstroVirtualAssistant from '../AstroVirtualAssistant';
import { ChromeUser } from '@redhat-cloud-services/types';

// Mock fetch to test the actual checkARHAuth function
global.fetch = jest.fn();

// Mock the useChrome hook - provides auth context
const mockChrome = {
  getEnvironment: jest.fn(),
  isBeta: jest.fn(() => false),
  auth: {
    getUser: jest.fn(),
    token: 'mock-token',
  },
};

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  __esModule: true,
  default: jest.fn(() => mockChrome),
}));

// Mock feature flag hook - requires Unleash context
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

// Mock navigation hook - requires router context
jest.mock('@redhat-cloud-services/frontend-components-utilities/useInsightsNavigate', () => ({
  useInsightsNavigate: () => jest.fn(),
}));

// Mock react-markdown - ESM module causing parsing issues
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

// Mock components that have complex dependencies
jest.mock('../../../Components/ARHClient/ARHChatbot', () => ({
  __esModule: true,
  default: () => <div data-testid="arh-chatbot">ARH Chatbot</div>,
}));

jest.mock('../../../Components/ARHClient/ARHBadge', () => ({
  __esModule: true,
  default: () => <div data-testid="arh-badge">ARH Badge</div>,
}));

// AstroVirtualAssistantLegacy is exported from the same file, so we don't need to mock it

// Create a minimal Redux store for testing
const mockStore = createStore(() => ({}));

const mockUser: ChromeUser = {
  entitlements: {},
  identity: {
    org_id: 'org-123',
    account_number: '123456',
    internal: {
      org_id: 'org-123',
      account_id: 'account-123',
    },
    type: 'User',
    user: {
      is_internal: true,
      is_org_admin: false,
      locale: 'en-US',
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
    },
  },
};

describe('AstroVirtualAssistant ARH Show Condition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.getEnvironment.mockReturnValue('stage');
    mockChrome.auth.getUser.mockResolvedValue(mockUser);
  });

  it('should show ARH when user is entitled', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ isEntitled: true, isInternal: false }),
    } as Response);

    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://access.stage.redhat.com/hydra/rest/contacts/sso/current?userId=account-123&assumeEntitledIfSubscriptionServiceUnavailable=true&redhat_client=cloud-services&account_number=123456',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(queryByTestId('arh-badge')).toBeInTheDocument();
    });
  });

  it('should show ARH when user is internal', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ isEntitled: false, isInternal: true }),
    } as Response);

    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId('arh-badge')).toBeInTheDocument();
    });
  });

  it('should not show ARH when user is neither entitled nor internal', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ isEntitled: false, isInternal: false }),
    } as Response);

    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );

    await waitFor(() => {
      expect(queryByTestId('arh-badge')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should use production URL for prod environment', async () => {
    mockChrome.getEnvironment.mockReturnValue('prod');
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ isEntitled: true, isInternal: false }),
    } as Response);

    render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('https://access.redhat.com/hydra/rest/contacts/sso/current'), expect.any(Object));
    });
  });

  it('should use stage URL for stage environment', async () => {
    mockChrome.getEnvironment.mockReturnValue('stage');
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ isEntitled: true, isInternal: false }),
    } as Response);

    render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://access.stage.redhat.com/hydra/rest/contacts/sso/current'),
        expect.any(Object)
      );
    });
  });

  it('should not show ARH when user is not available', async () => {
    mockChrome.auth.getUser.mockResolvedValue(undefined);

    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );

    await waitFor(() => {
      expect(fetch).not.toHaveBeenCalled();
      expect(queryByTestId('arh-badge')).not.toBeInTheDocument();
    });
  });

  it('should not show ARH when API request fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
    } as Response);

    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(queryByTestId('arh-badge')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
