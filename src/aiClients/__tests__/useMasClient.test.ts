import { renderHook, waitFor } from '@testing-library/react';
import useMasClient from '../useMasClient';

const SUBMIT_URL = 'https://mas.example.com/api/sessions/user.session.submit';
const OTHER_URL = 'https://mas.example.com/api/sessions/other';

const mockForceAuthRefresh = jest.fn();
const mockGetToken = jest.fn();
const mockGetUser = jest.fn();

const mockChrome = {
  auth: {
    getToken: mockGetToken,
    getUser: mockGetUser,
    token: 'initial-token',
  },
  $internal: {
    forceAuthRefresh: mockForceAuthRefresh,
  },
};

jest.mock('@redhat-cloud-services/mas-client', () => {
  const mockClient = {};
  return {
    MASClient: jest.fn(() => mockClient),
  };
});

const mockStateManager = {
  isInitialized: jest.fn(() => false),
  isInitializing: jest.fn(() => false),
  init: jest.fn(),
  getClient: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
};

jest.mock('@redhat-cloud-services/ai-client-state', () => ({
  createClientStateManager: jest.fn(() => mockStateManager),
}));

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  __esModule: true,
  default: () => mockChrome,
}));

let mockUseFlagReturn = false;
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => mockUseFlagReturn),
}));

describe('useMasClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFlagReturn = false;
    mockGetUser.mockResolvedValue({ identity: { type: 'User' } });
    mockGetToken.mockResolvedValue('default-token');
    mockForceAuthRefresh.mockResolvedValue({ access_token: 'refreshed-token' });
  });

  describe('fetchFunction behavior', () => {
    let fetchFunction: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    let mockFetch: jest.Mock;
    const originalFetch = global.fetch;

    beforeEach(async () => {
      mockUseFlagReturn = true;
      mockFetch = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const { MASClient } = jest.requireMock('@redhat-cloud-services/mas-client');
      renderHook(() => useMasClient());

      await waitFor(() => {
        expect(MASClient).toHaveBeenCalled();
      });

      fetchFunction = MASClient.mock.calls[0][0].fetchFunction;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('uses access_token from forceAuthRefresh for session submit when getToken is still stale', async () => {
      mockForceAuthRefresh.mockResolvedValue({ access_token: 'new-token' });
      mockGetToken.mockResolvedValue('old-token');

      await fetchFunction(SUBMIT_URL, { headers: {} });

      expect(mockForceAuthRefresh).toHaveBeenCalled();
      expect(mockGetToken).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        SUBMIT_URL,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer new-token',
          }),
        })
      );
    });

    it('does not submit when forceAuthRefresh returns no access_token', async () => {
      mockForceAuthRefresh.mockResolvedValue(null);
      mockGetToken.mockResolvedValue('fallback-token');

      await expect(fetchFunction(SUBMIT_URL, { headers: {} })).rejects.toThrow('Failed to refresh authentication');

      expect(mockForceAuthRefresh).toHaveBeenCalled();
      expect(mockGetToken).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not submit when forceAuthRefresh rejects', async () => {
      mockForceAuthRefresh.mockRejectedValue(new Error('SSO network failure'));
      mockGetToken.mockResolvedValue('fallback-token');

      await expect(fetchFunction(SUBMIT_URL, { headers: {} })).rejects.toThrow('SSO network failure');

      expect(mockGetToken).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('uses getToken for non-submit requests without calling forceAuthRefresh', async () => {
      mockGetToken.mockResolvedValue('session-token');

      await fetchFunction(OTHER_URL, { headers: {} });

      expect(mockForceAuthRefresh).not.toHaveBeenCalled();
      expect(mockGetToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        OTHER_URL,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer session-token',
          }),
        })
      );
    });
  });
});
