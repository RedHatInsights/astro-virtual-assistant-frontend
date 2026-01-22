import checkARHAuth from '../checkARHAuth';
import { ChromeUser } from '@redhat-cloud-services/types';

// Mock fetch
global.fetch = jest.fn();

const mockUser: ChromeUser = {
  entitlements: {},
  identity: {
    account_number: '123456',
    org_id: 'org-123',
    internal: {
      account_id: 'account-123',
      org_id: 'org-123',
    },
    type: 'User',
    user: {
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      is_internal: true,
      is_org_admin: false,
      locale: 'en-US',
    },
  },
};

describe('checkARHAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when user is entitled', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ isEntitled: true, isInternal: false }),
    } as Response);

    const result = await checkARHAuth('https://access.stage.redhat.com', mockUser, 'token');

    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://access.stage.redhat.com/hydra/rest/contacts/sso/current?userId=account-123&assumeEntitledIfSubscriptionServiceUnavailable=true&redhat_client=cloud-services&account_number=123456',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('should return true when user is internal', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ isEntitled: false, isInternal: true }),
    } as Response);

    const result = await checkARHAuth('https://access.stage.redhat.com', mockUser, 'token');

    expect(result).toBe(true);
  });

  it('should return false when user is neither entitled nor internal', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ isEntitled: false, isInternal: false }),
    } as Response);

    const result = await checkARHAuth('https://access.stage.redhat.com', mockUser, 'token');

    expect(result).toBe(false);
  });

  it('should return false when network request fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
    } as Response);

    const result = await checkARHAuth('https://access.stage.redhat.com', mockUser, 'token');

    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });

  it('should return false when response has invalid format', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ invalidField: true }),
    } as Response);

    const result = await checkARHAuth('https://access.stage.redhat.com', mockUser, 'token');

    expect(result).toBe(false);
  });

  it('should return false and log error when fetch throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

    const result = await checkARHAuth('https://access.stage.redhat.com', mockUser, 'token');

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Error checking ARH authentication:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});
