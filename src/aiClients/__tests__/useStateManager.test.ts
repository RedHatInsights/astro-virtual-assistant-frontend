import { act, renderHook } from '@testing-library/react';
import useStateManager from '../useStateManager';
import { useLocation } from 'react-router-dom';
import { useRemoteHook } from '@scalprum/react-core';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

// Mock the useFlag hook for feature flags
const mockUseFlag = jest.fn();
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
}));

jest.mock('@scalprum/react-core', () => ({
  useRemoteHook: jest.fn(({ module, importName }) => {
    if (module === './useArhChatbot' && importName === undefined) {
      return {
        id: 'arh',
        loading: false,
        error: null,
        hookResult: {
          model: 'Ask Red Hat',
          stateManager: {
            isInitialized: jest.fn(() => false),
            isInitializing: jest.fn(() => false),
            init: jest.fn(),
          },
          historyManagement: true,
          streamMessages: true,
          routes: ['/baz/*'],
        },
      };
    }
    if (module === './useRhelChatbot' && importName === undefined) {
      return {
        id: 'arh',
        loading: false,
        error: null,
        hookResult: {
          model: 'RHEL Lightspeed',
          stateManager: {
            isInitialized: jest.fn(() => false),
            isInitializing: jest.fn(() => false),
            init: jest.fn(),
          },
          historyManagement: false,
          streamMessages: false,
          routes: ['/foo/bar/*'],
        },
      };
    }
    if (module === './useAsyncChatbot' && importName === undefined) {
      return {
        id: 'ai',
        loading: false,
        error: 'An error occured',
        hookResult: {
          model: 'AI Chatbot',
          stateManager: {
            isInitialized: jest.fn(() => false),
            isInitializing: jest.fn(() => false),
            init: jest.fn(),
          },
          historyManagement: false,
          streamMessages: false,
          routes: ['/ai/*'],
        },
      };
    }
    if (importName !== undefined) {
      return {
        id: importName,
        loading: false,
        error: null,
        hookResult: {
          loading: false,
          isAuthenticated: true,
        },
      };
    }
    return {
      id: '',
      loading: false,
      error: null,
      hookResult: undefined,
    };
  }),
}));

// Mock AI client state
jest.mock('@redhat-cloud-services/ai-client-state', () => ({
  createClientStateManager: jest.fn(() => ({
    isInitialized: jest.fn(() => false),
    isInitializing: jest.fn(() => false),
    init: jest.fn(),
    subscribe: jest.fn(() => jest.fn()), // Returns unsubscribe function
    getClient: jest.fn(() => ({
      isInitialized: jest.fn(() => false),
      isInitializing: jest.fn(() => false),
      getWelcomeConfig: jest.fn(() => ({
        content: 'Test welcome content',
      })),
    })),
  })),
  Events: {
    INITIALIZING_MESSAGES: 'INITIALIZING_MESSAGES',
    ACTIVE_CONVERSATION: 'ACTIVE_CONVERSATION',
  },
}));

describe('useStateManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/' });

    // Mock fetch to prevent network calls and silence warnings
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock;
  });

  it('sets currentModel to the first available', async () => {
    mockUseFlag.mockReturnValue(false);

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.currentModel).toBe('Ask Red Hat');
  });

  it('handles failed getModule by logging an error and not blocking initialization', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    // Enable chatbot so the hook proceeds to compute a model
    mockUseFlag.mockReturnValue(true);

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    // Ensure we specifically logged the failed module message
    expect(consoleErrorSpy.mock.calls[0]).toEqual([
      expect.stringContaining('Failed to load chatbot'),
      expect.objectContaining({ scope: 'assistedInstallerApp', module: './useAsyncChatbot' }),
      expect.anything(),
      expect.anything(),
    ]);

    // Even though getModule failed, the hook should still select the ARH model
    expect(result.current.currentModel).toBe('Ask Red Hat');

    consoleErrorSpy.mockRestore();
  });

  it('sets currentModel to matching route', async () => {
    mockUseFlag.mockReturnValue(false);
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/baz/foo' });

    const { result, rerender } = renderHook((isOpen: boolean) => useStateManager(isOpen));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.currentModel).toBe('Ask Red Hat');

    (useLocation as jest.Mock).mockReturnValue({ pathname: '/foo/bar/baz' });
    rerender(true);
    expect(result.current.currentModel).toBe('RHEL Lightspeed');

    (useLocation as jest.Mock).mockReturnValue({ pathname: '/' });
    // the model won't change with route change after first render
    rerender(false);
    expect(result.current.currentModel).toBe('RHEL Lightspeed');
    rerender(true);
    expect(result.current.currentModel).toBe('RHEL Lightspeed');

    (useLocation as jest.Mock).mockReturnValue({ pathname: '/baz/foo' });
    // the model won't change with route change after first render
    rerender(false);
    expect(result.current.currentModel).toBe('RHEL Lightspeed');
    rerender(true);
    expect(result.current.currentModel).toBe('RHEL Lightspeed');
  });

  it('does not show non-authenticated models', async () => {
    mockUseFlag.mockReturnValue(false);
    (useRemoteHook as jest.Mock).mockImplementation(({ module, importName }) => {
      if (module === './useArhChatbot' && importName === undefined) {
        return {
          id: 'arh',
          loading: false,
          error: null,
          hookResult: {
            model: 'Ask Red Hat',
            stateManager: {
              isInitialized: jest.fn(() => false),
              isInitializing: jest.fn(() => false),
              init: jest.fn(),
            },
            historyManagement: true,
            streamMessages: true,
            routes: ['/baz/*'],
          },
        };
      }
      if (module === './useRhelChatbot' && importName === undefined) {
        return {
          id: 'arh',
          loading: false,
          error: null,
          hookResult: {
            model: 'RHEL Lightspeed',
            stateManager: {
              isInitialized: jest.fn(() => false),
              isInitializing: jest.fn(() => false),
              init: jest.fn(),
            },
            historyManagement: false,
            streamMessages: false,
            routes: ['/foo/bar/*'],
          },
        };
      }
      if (module === './useRhelChatbot' && importName !== undefined) {
        return {
          id: importName,
          loading: false,
          error: null,
          hookResult: {
            loading: false,
            isAuthenticated: false,
          },
        };
      }
      if (module === './useAsyncChatbot' && importName === undefined) {
        return {
          id: 'ai',
          loading: false,
          error: 'An error occured',
          hookResult: {
            model: 'AI Chatbot',
            stateManager: {
              isInitialized: jest.fn(() => false),
              isInitializing: jest.fn(() => false),
              init: jest.fn(),
            },
            historyManagement: false,
            streamMessages: false,
            routes: ['/ai/*'],
          },
        };
      }
      if (importName !== undefined) {
        return {
          id: importName,
          loading: false,
          error: null,
          hookResult: {
            loading: false,
            isAuthenticated: true,
          },
        };
      }
      return {
        id: '',
        loading: false,
        error: null,
        hookResult: undefined,
      };
    });
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/foo/bar/baz' });

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.currentModel).toBe('Ask Red Hat');
  });
});
