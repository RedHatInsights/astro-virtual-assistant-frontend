// Cypress mock for @scalprum/react-core
import React from 'react';
import { ScalprumContext } from '@scalprum/react-core';
export function ScalprumComponent({ children }) {
  return <div data-testid="scalprum-component">{children}</div>;
}

export function ScalprumProvider({ children, config = {}, api = {} }) {
  console.log('Mock ScalprumProvider config', config);
  return <div data-testid="scalprum-provider">{children}</div>;
}

// Mock any other exports that might be needed
export const useScalprum = () => ({
  initialized: true,
  config: {},
  api: {
    chrome: {
      isBeta: () => false,
      auth: {
        getToken: () => Promise.resolve('mock-token'),
        getUser: () => Promise.resolve({ identity: { user: { username: 'test' } } }),
      },
      getEnvironment: () => 'test',
    },
  },
});
