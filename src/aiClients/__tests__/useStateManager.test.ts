import { act, renderHook } from '@testing-library/react';
import useStateManager from '../useStateManager';
import { useLocation } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

// Mock scalprum remote hook manager API used by the hook under test
const createStateManager = () => ({
  isInitialized: jest.fn(() => false),
  isInitializing: jest.fn(() => false),
  init: jest.fn(),
});

const mockHookResults: Array<Record<string, unknown>> = [];
jest.mock('@scalprum/react-core', () => ({
  useRemoteHookManager: jest.fn(() => ({
    addHook: jest.fn(),
    cleanup: jest.fn(),
    get hookResults() {
      return mockHookResults;
    },
  })),
}));

// Mock the useFlag hook for feature flags
const mockUseFlag = jest.fn();
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
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

    // Default remote hook results: ARH and RHEL managers available, async one failing
    mockHookResults.length = 0;
    mockHookResults.push(
      {
        id: 'arh',
        loading: false,
        error: null,
        hookResult: {
          manager: {
            model: 'Ask Red Hat',
            stateManager: createStateManager(),
            historyManagement: true,
            streamMessages: true,
            routes: ['/baz/*'],
          },
        },
      },
      {
        id: 'rhel',
        loading: false,
        error: null,
        hookResult: {
          manager: {
            model: 'RHEL Lightspeed',
            stateManager: createStateManager(),
            historyManagement: false,
            streamMessages: false,
            routes: ['/foo/bar/*'],
          },
        },
      },
      {
        id: 'ai',
        loading: false,
        error: 'An error occured',
        hookResult: {
          manager: {
            model: 'AI Chatbot',
            stateManager: createStateManager(),
            historyManagement: false,
            streamMessages: false,
            routes: ['/ai/*'],
          },
        },
      }
    );
  });

  it('sets currentModel to the first available', async () => {
    mockUseFlag.mockReturnValue(false);

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.currentModel).toBe('Ask Red Hat');
  });

  it('handles failed module by not blocking initialization', async () => {
    // Enable chatbot so the hook proceeds to compute a model
    mockUseFlag.mockReturnValue(true);

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Even though one module failed, the hook should still select the ARH model
    expect(result.current.currentModel).toBe('Ask Red Hat');
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
    // Simulate RHEL manager not being available due to failed authentication
    mockHookResults.length = 0;
    mockHookResults.push(
      {
        id: 'arh',
        loading: false,
        error: null,
        hookResult: {
          manager: {
            model: 'Ask Red Hat',
            stateManager: createStateManager(),
            historyManagement: true,
            streamMessages: true,
            routes: ['/baz/*'],
          },
        },
      },
      {
        id: 'rhel',
        loading: false,
        error: null,
        hookResult: {
          manager: null,
        },
      },
      {
        id: 'ai',
        loading: false,
        error: 'An error occured',
        hookResult: {
          manager: {
            model: 'AI Chatbot',
            stateManager: createStateManager(),
            historyManagement: false,
            streamMessages: false,
            routes: ['/ai/*'],
          },
        },
      }
    );
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/foo/bar/baz' });

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.currentModel).toBe('Ask Red Hat');
  });
});
