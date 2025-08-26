// Mock client state manager
export const createClientStateManager = jest.fn(() => ({
  init: jest.fn().mockResolvedValue(undefined),
  dispose: jest.fn(),
  getState: jest.fn(() => ({})),
  subscribe: jest.fn(() => jest.fn()), // returns unsubscribe function
  isInitialized: jest.fn(() => false),
  isInitializing: jest.fn(() => false),
}));

export const __resetMocks = () => {
  createClientStateManager.mockClear();
};
