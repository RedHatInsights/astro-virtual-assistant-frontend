/* eslint-disable react/prop-types */
// Cypress mock for @scalprum/react-core
import React from 'react';

const mockChromeApi = {
  isBeta: () => false,
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
          internal: {
            account_id: '123456',
          },
          org_id: 'test-org',
          type: 'User',
        },
        entitlements: {
          rhel: {
            is_entitled: true,
          },
        },
      }),
  },
  getEnvironment: () => 'stage',
};

export function ScalprumComponent({ children }) {
  return <div data-testid="scalprum-component">{children}</div>;
}

export function ScalprumProvider({ children }) {
  return <div data-testid="scalprum-provider">{children}</div>;
}

// Mock any other exports that might be needed
export const useScalprum = () => ({
  initialized: true,
  config: {},
  api: {
    chrome: mockChromeApi,
  },
});
