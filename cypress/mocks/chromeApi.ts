export const mockChromeApi = {
  auth: {
    getToken: () => Promise.resolve('mock-token'),
    getUser: () =>
      Promise.resolve({
        identity: {
          user: {
            username: 'testuser',
            email: 'test@test.com',
            first_name: 'Test',
            last_name: 'User',
            is_internal: false,
            is_active: true,
            is_org_admin: true,
            locale: 'en-US',
          },
          account_number: '123456',
          internal: { account_id: '123456' },
          org_id: '123456',
          type: 'User',
        },
        entitlements: {},
      }),
  },
  getEnvironment: () => 'stage',
  isBeta: () => false,
};
