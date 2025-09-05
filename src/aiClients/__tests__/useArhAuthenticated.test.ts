import { renderHook, waitFor } from '@testing-library/react';
import { useArhAuthenticated } from '../useArhClient';
import { ChromeUser } from '@redhat-cloud-services/types';

// Mock the useChrome hook
const mockChrome = {
  getEnvironment: jest.fn(),
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

// Mock checkARHAuth function
jest.mock('../../Components/ARHClient/checkARHAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock ARHChatbot component to avoid PatternFly imports
jest.mock('../../Components/ARHClient/ARHChatbot', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock AI client state
jest.mock('@redhat-cloud-services/ai-client-state', () => ({
  createClientStateManager: jest.fn(() => ({})),
}));

// Mock ARH client
jest.mock('@redhat-cloud-services/arh-client', () => ({
  IFDClient: jest.fn().mockImplementation(() => ({})),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const checkARHAuth = require('../../Components/ARHClient/checkARHAuth').default;

describe('useArhAuthenticated', () => {
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
        is_internal: false,
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.getEnvironment.mockReturnValue('stage');
  });

  it('should handle successful authentication', async () => {
    mockChrome.auth.getUser.mockResolvedValue(mockUser);
    checkARHAuth.mockResolvedValue(true);

    const { result } = renderHook(() => useArhAuthenticated());

    // Initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.model).toBe('Ask Red Hat');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Final authenticated state
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(checkARHAuth).toHaveBeenCalledWith('https://access.stage.redhat.com', mockUser, 'mock-token');
  });

  it('should handle failed authentication', async () => {
    mockChrome.auth.getUser.mockResolvedValue(mockUser);
    checkARHAuth.mockResolvedValue(false);

    const { result } = renderHook(() => useArhAuthenticated());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle missing user', async () => {
    mockChrome.auth.getUser.mockResolvedValue(undefined);

    const { result } = renderHook(() => useArhAuthenticated());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(checkARHAuth).not.toHaveBeenCalled();
  });

  it('should handle authentication errors', async () => {
    const error = new Error('Authentication failed');
    mockChrome.auth.getUser.mockResolvedValue(mockUser);
    checkARHAuth.mockRejectedValue(error);

    const { result } = renderHook(() => useArhAuthenticated());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toEqual(error);
  });

  it('should use correct base URL for different environments', async () => {
    mockChrome.auth.getUser.mockResolvedValue(mockUser);
    checkARHAuth.mockResolvedValue(true);

    // Test prod environment
    mockChrome.getEnvironment.mockReturnValue('prod');
    renderHook(() => useArhAuthenticated());
    await waitFor(() => {
      expect(checkARHAuth).toHaveBeenCalledWith('https://access.redhat.com', mockUser, 'mock-token');
    });

    jest.clearAllMocks();

    // Test dev environment (should also use prod URL)
    mockChrome.getEnvironment.mockReturnValue('dev');
    renderHook(() => useArhAuthenticated());
    await waitFor(() => {
      expect(checkARHAuth).toHaveBeenCalledWith('https://access.redhat.com', mockUser, 'mock-token');
    });
  });
});
