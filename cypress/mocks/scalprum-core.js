// Cypress mock for @scalprum/core
export function getModule() {
  // Returns a mock module with the expected structure for async state managers
  return Promise.resolve({
    getStateManager: () => ({
      model: 'mock-async-model',
      stateManager: {
        isInitialized: () => true,
        isInitializing: () => false,
        init: () => undefined,
      },
    }),
    isAuthenticated: () =>
      Promise.resolve({
        loading: false,
        isAuthenticated: false,
        model: 'mock-async-model',
      }),
  });
}
