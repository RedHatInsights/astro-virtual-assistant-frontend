/* eslint-disable @typescript-eslint/no-empty-function */
import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

// Mock navigation hook - requires router context
jest.mock('@redhat-cloud-services/frontend-components-utilities/useInsightsNavigate', () => ({
  useInsightsNavigate: () => jest.fn(),
}));

// Mock react-markdown - ESM module causing parsing issues
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

// Mock PatternFly chatbot - ESM module causing parsing issues with markdown dependencies
jest.mock('@patternfly/chatbot', () => ({
  __esModule: true,
  Chatbot: ({ children }: { children: React.ReactNode }) => <div className="pf-chatbot">{children}</div>,
  ChatbotConversationHistoryNav: ({ drawerContent }: any) => <div className="pf-chatbot__conversation-history-nav">{drawerContent}</div>,
  ChatbotDisplayMode: {
    default: 'default',
    embedded: 'embedded',
    fullscreen: 'fullscreen',
  },
}));

jest.mock('../../../Components/UniversalChatbot/UniversalBadge', () => ({
  __esModule: true,
  default: () => <div data-testid="arh-badge">ARH Badge</div>,
}));

// AstroVirtualAssistantLegacy is exported from the same file, so we don't need to mock it

// Create a minimal Redux store for testing
const mockStore = createStore(() => ({}));

const mockUser: ChromeUser = {
  entitlements: {
    rhel: { is_entitled: true, is_trial: false },
  },
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
    mockUseFlag.mockReturnValue(true); // Default to ARH enabled
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

  it('should show RHEL LightSpeed when user is neither entitled nor internal for ARH', async () => {
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
      // Badge should still be visible since it falls back to RHEL LightSpeed
      expect(queryByTestId('arh-badge')).toBeInTheDocument();
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

  it('should show legacy badge when user is not available', async () => {
    mockChrome.auth.getUser.mockResolvedValue(undefined);

    render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );

    await waitFor(() => {
      expect(fetch).not.toHaveBeenCalled();
      // Badge should be visible since it falls back to legacy AstroBadge (rendered in portal)
      // Expecting 2 elements because both the main component and AstroVirtualAssistantLegacy render badges with the same alt text
      expect(screen.getAllByAltText('Launch virtual assistant')).toHaveLength(2);
    });
  });

  it('should show RHEL LightSpeed when API request fails', async () => {
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
      // Badge should still be visible since it falls back to RHEL LightSpeed
      expect(queryByTestId('arh-badge')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should show legacy badge when user has no ARH access and no RHEL entitlements', async () => {
    // Mock user with no entitlements and not internal
    const noAccessUser: ChromeUser = {
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
          is_internal: false,
          is_org_admin: false,
          locale: 'en-US',
          username: 'noentitlements',
          email: 'noentitlements@example.com',
          first_name: 'No',
          last_name: 'Access',
          is_active: true,
        },
      },
    };

    mockChrome.auth.getUser.mockResolvedValue(noAccessUser);
    // ARH auth fails
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
    } as Response);

    render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );

    await waitFor(() => {
      // Should fall back to legacy badge when both authentication systems fail
      // Expecting 2 elements because both the main component and AstroVirtualAssistantLegacy render badges with the same alt text
      expect(screen.getAllByAltText('Launch virtual assistant')).toHaveLength(2);
      // Should not show universal badge (UniversalBadge has different alt text)
      expect(screen.queryByAltText('Launch Ask Red Hat assistant')).not.toBeInTheDocument();
    });
  });

  it('should not show any badge when feature flag is disabled', async () => {
    mockUseFlag.mockReturnValue(false); // Disable ARH feature flag

    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );

    await waitFor(() => {
      // No badge should be visible when feature flag is disabled
      expect(queryByTestId('arh-badge')).not.toBeInTheDocument();
    });
  });
});
