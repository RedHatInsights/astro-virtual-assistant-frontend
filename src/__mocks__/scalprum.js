// __mocks__/scalprum.js
import React from 'react';

export function ScalprumComponent() {
  return <div>scalprum component</div>;
}

export function getModule() {
  // Returns a mock module with the expected structure
  return Promise.resolve({
    getStateManager: () => ({
      model: 'mock-model',
      stateManager: {
        isInitialized: () => true,
        isInitializing: () => false,
        init: () => undefined,
      },
    }),
    isAuthenticated: () => Promise.resolve({ loading: false, isAuthenticated: true, model: 'mock-model' }),
  });
}
