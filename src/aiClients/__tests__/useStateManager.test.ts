import { act, renderHook } from '@testing-library/react';
import useStateManager from '../useStateManager';
import { useLocation } from 'react-router-dom';
import { VirtualAssistantStateSingleton } from '../../utils/VirtualAssistantStateSingleton';
import { Models } from '../types';
import { ARH_DEFAULT_FLAG, MAO_ONLY_FLAG } from '../flags';

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

const mockAddHook = jest.fn();
const mockCleanup = jest.fn();
const mockHookResults: Array<Record<string, unknown>> = [];
jest.mock('@scalprum/react-core', () => ({
  useRemoteHookManager: jest.fn(() => ({
    addHook: mockAddHook,
    cleanup: mockCleanup,
    get hookResults() {
      return mockHookResults;
    },
  })),
}));

// Mock the useFlag hook for feature flags — per-flag overrides via flagOverrides map
const flagOverrides: Record<string, boolean> = {};
const mockUseFlag = jest.fn((flag: string) => flagOverrides[flag] ?? false);
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
}));

const createManagerHookResult = (id: string, model: Models | null) => ({
  id,
  loading: false,
  error: null,
  hookResult: {
    manager: model
      ? {
          model,
          stateManager: createStateManager(),
          historyManagement: true,
          streamMessages: true,
        }
      : null,
  },
});

describe('useStateManager', () => {
  beforeAll(() => {
    jest.resetModules();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
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
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/' });
    VirtualAssistantStateSingleton.setIsOpen(false);
    VirtualAssistantStateSingleton.setCurrentModel(undefined);

    // Reset flag overrides
    Object.keys(flagOverrides).forEach((key) => delete flagOverrides[key]);

    // Mock global fetch to prevent network calls and silence warnings
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  const actWait = async (ms = 0) => {
    await act(async () => {
      jest.advanceTimersByTime(ms);
      await Promise.resolve();
    });
  };

  it('sets currentModel to the first available', async () => {
    const { result } = renderHook(() => useStateManager(true));
    await actWait();
    expect(result.current.currentModel).toBe('Ask Red Hat');
  }, 10000);

  it('handles failed module by not blocking initialization', async () => {
    // Enable arh-default so ARH is first, but keep mao-only off
    flagOverrides[ARH_DEFAULT_FLAG] = true;

    const { result } = renderHook(() => useStateManager(true));

    await actWait();

    // Even though one module failed, the hook should still select the ARH model
    expect(result.current.currentModel).toBe('Ask Red Hat');
  });

  it('sets currentModel to matching route', async () => {
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/baz/foo' });
    const { result, rerender } = renderHook((isOpen: boolean) => useStateManager(isOpen));
    await actWait();
    expect(result.current.currentModel).toBe('Ask Red Hat');

    (useLocation as jest.Mock).mockReturnValue({ pathname: '/foo/bar/baz' });
    rerender(true);
    await actWait();
    expect(result.current.currentModel).toBe('RHEL Lightspeed');
  }, 10000);

  it('does not show non-authenticated models', async () => {
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
        error: 'An error occurred',
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
    await actWait();
    expect(result.current.currentModel).toBe('Ask Red Hat');
  }, 10000);

  it('registers in order ARH, VA, HCC AI, MAS, RHEL when arh-default is ON', async () => {
    flagOverrides[ARH_DEFAULT_FLAG] = true;

    renderHook(() => useStateManager(true));
    await actWait();

    const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
    expect(modules).toEqual(['./useArhChatbot', './useVaChatbot', './useHccAiChatbot', './useMasChatbot', './useRhelChatbot']);
  });

  it('registers in order VA, HCC AI, MAS, ARH, RHEL when arh-default is OFF', async () => {
    renderHook(() => useStateManager(true));
    await actWait();

    const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
    expect(modules).toEqual(['./useVaChatbot', './useHccAiChatbot', './useMasChatbot', './useArhChatbot', './useRhelChatbot']);
  });

  it('registers only MAS hook when mao-only flag is ON', async () => {
    flagOverrides[MAO_ONLY_FLAG] = true;

    renderHook(() => useStateManager(true));
    await actWait();

    const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
    expect(modules).toEqual(['./useMasChatbot']);
  });

  it('registers all hooks when mao-only flag is OFF', async () => {
    renderHook(() => useStateManager(true));
    await actWait();

    const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
    expect(modules).toContain('./useVaChatbot');
    expect(modules).toContain('./useArhChatbot');
    expect(modules).toContain('./useRhelChatbot');
    expect(modules).toContain('./useHccAiChatbot');
    expect(modules).toContain('./useMasChatbot');
    expect(modules).toHaveLength(5);
  });

  it('sets MAS as default model when mao-only flag is ON', async () => {
    flagOverrides[MAO_ONLY_FLAG] = true;
    mockHookResults.length = 0;
    mockHookResults.push({
      id: 'mas',
      loading: false,
      error: null,
      hookResult: {
        manager: {
          model: 'Multi-Agent System',
          stateManager: createStateManager(),
          historyManagement: true,
          streamMessages: true,
        },
      },
    });

    const { result } = renderHook(() => useStateManager(true));
    await actWait();

    expect(result.current.currentModel).toBe('Multi-Agent System');
  });

  describe('when VA is unavailable (arh-default OFF)', () => {
    it('selects HCC AI as default when all services are available', async () => {
      // Registration order (arh-default OFF): VA, HCC AI, MAS, ARH, RHEL
      // After VA filtered out: HCC AI, MAS, ARH, RHEL → managers[0] = HCC AI
      mockHookResults.length = 0;
      mockHookResults.push(
        createManagerHookResult('va', null),
        createManagerHookResult('hcc-ai', Models.HCC_AI),
        createManagerHookResult('mas', Models.MAS),
        createManagerHookResult('arh', Models.ASK_RED_HAT),
        createManagerHookResult('rhel', Models.RHEL_LIGHTSPEED)
      );

      const { result } = renderHook(() => useStateManager(true));
      await actWait();

      expect(result.current.currentModel).toBe(Models.HCC_AI);
    });

    it('selects MAS when HCC AI is also unavailable', async () => {
      mockHookResults.length = 0;
      mockHookResults.push(
        createManagerHookResult('va', null),
        createManagerHookResult('hcc-ai', null),
        createManagerHookResult('mas', Models.MAS),
        createManagerHookResult('arh', Models.ASK_RED_HAT),
        createManagerHookResult('rhel', Models.RHEL_LIGHTSPEED)
      );

      const { result } = renderHook(() => useStateManager(true));
      await actWait();

      expect(result.current.currentModel).toBe(Models.MAS);
    });

    it('selects ARH when HCC AI and MAS are also unavailable', async () => {
      mockHookResults.length = 0;
      mockHookResults.push(
        createManagerHookResult('va', null),
        createManagerHookResult('hcc-ai', null),
        createManagerHookResult('mas', null),
        createManagerHookResult('arh', Models.ASK_RED_HAT),
        createManagerHookResult('rhel', Models.RHEL_LIGHTSPEED)
      );

      const { result } = renderHook(() => useStateManager(true));
      await actWait();

      expect(result.current.currentModel).toBe(Models.ASK_RED_HAT);
    });

    it('reselects to HCC AI when current model (VA) becomes unavailable', async () => {
      VirtualAssistantStateSingleton.setCurrentModel(Models.VA);

      mockHookResults.length = 0;
      mockHookResults.push(
        createManagerHookResult('va', null),
        createManagerHookResult('hcc-ai', Models.HCC_AI),
        createManagerHookResult('mas', Models.MAS),
        createManagerHookResult('arh', Models.ASK_RED_HAT),
        createManagerHookResult('rhel', Models.RHEL_LIGHTSPEED)
      );

      const { result } = renderHook(() => useStateManager(true));
      await actWait();

      expect(result.current.currentModel).toBe(Models.HCC_AI);
    });
  });
});
