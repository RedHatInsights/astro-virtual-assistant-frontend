import { act, renderHook } from '@testing-library/react';
import useStateManager from '../useStateManager';
import { useLocation } from 'react-router-dom';
import { VirtualAssistantStateSingleton } from '../../utils/VirtualAssistantStateSingleton';
import { ARH_DEFAULT_FLAG, MAO_ONLY_FLAG, VA_ENABLED_FLAG } from '../flags';

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
    flagOverrides[VA_ENABLED_FLAG] = true;

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

  // --- VA enabled flag tests ---

  describe('VA enabled flag', () => {
    it('registers VA hook when va-enabled flag is ON', async () => {
      flagOverrides[VA_ENABLED_FLAG] = true;

      renderHook(() => useStateManager(true));
      await actWait();

      const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
      expect(modules).toContain('./useVaChatbot');
    });

    it('does not register VA hook when va-enabled flag is OFF', async () => {
      renderHook(() => useStateManager(true));
      await actWait();

      const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
      expect(modules).not.toContain('./useVaChatbot');
    });

    it('registers VA before ARH when va-enabled ON and arh-default OFF', async () => {
      flagOverrides[VA_ENABLED_FLAG] = true;

      renderHook(() => useStateManager(true));
      await actWait();

      const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
      const vaIndex = modules.indexOf('./useVaChatbot');
      const arhIndex = modules.indexOf('./useArhChatbot');
      expect(vaIndex).toBeGreaterThanOrEqual(0);
      expect(arhIndex).toBeGreaterThanOrEqual(0);
      expect(vaIndex).toBeLessThan(arhIndex);
    });

    it('registers ARH before VA when va-enabled ON and arh-default ON', async () => {
      flagOverrides[VA_ENABLED_FLAG] = true;
      flagOverrides[ARH_DEFAULT_FLAG] = true;

      renderHook(() => useStateManager(true));
      await actWait();

      const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
      const arhIndex = modules.indexOf('./useArhChatbot');
      const vaIndex = modules.indexOf('./useVaChatbot');
      expect(arhIndex).toBeGreaterThanOrEqual(0);
      expect(vaIndex).toBeGreaterThanOrEqual(0);
      expect(arhIndex).toBeLessThan(vaIndex);
    });
  });

  // --- VA disabled fallback priority tests ---

  describe('VA disabled fallback priority', () => {
    it('registers HCC AI before MAS and MAS before ARH when VA disabled', async () => {
      renderHook(() => useStateManager(true));
      await actWait();

      const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
      const hccAiIndex = modules.indexOf('./useHccAiChatbot');
      const masIndex = modules.indexOf('./useMasChatbot');
      const arhIndex = modules.indexOf('./useArhChatbot');
      expect(hccAiIndex).toBeGreaterThanOrEqual(0);
      expect(masIndex).toBeGreaterThanOrEqual(0);
      expect(arhIndex).toBeGreaterThanOrEqual(0);
      expect(hccAiIndex).toBeLessThan(masIndex);
      expect(masIndex).toBeLessThan(arhIndex);
    });

    it('arh-default flag does not affect fallback order when VA disabled', async () => {
      flagOverrides[ARH_DEFAULT_FLAG] = true;

      renderHook(() => useStateManager(true));
      await actWait();

      const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
      const hccAiIndex = modules.indexOf('./useHccAiChatbot');
      const masIndex = modules.indexOf('./useMasChatbot');
      const arhIndex = modules.indexOf('./useArhChatbot');
      // HCC AI > MAS > ARH regardless of arh-default
      expect(hccAiIndex).toBeLessThan(masIndex);
      expect(masIndex).toBeLessThan(arhIndex);
    });
  });

  // --- RHEL Lightspeed route-only tests ---

  describe('RHEL Lightspeed route-only', () => {
    it('registers RHEL last so it is never the general fallback', async () => {
      renderHook(() => useStateManager(true));
      await actWait();

      const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
      const rhelIndex = modules.indexOf('./useRhelChatbot');
      expect(rhelIndex).toBe(modules.length - 1);
    });

    it('registers RHEL last when VA enabled', async () => {
      flagOverrides[VA_ENABLED_FLAG] = true;

      renderHook(() => useStateManager(true));
      await actWait();

      const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
      const rhelIndex = modules.indexOf('./useRhelChatbot');
      expect(rhelIndex).toBe(modules.length - 1);
    });

    it('RHEL selected via route matching when on RHEL route', async () => {
      (useLocation as jest.Mock).mockReturnValue({ pathname: '/foo/bar/baz' });
      const { result } = renderHook(() => useStateManager(true));
      await actWait();
      expect(result.current.currentModel).toBe('RHEL Lightspeed');
    });
  });

  // --- Hook registration completeness tests ---

  describe('hook registration', () => {
    it('registers all 5 hooks when VA enabled and mao-only OFF', async () => {
      flagOverrides[VA_ENABLED_FLAG] = true;

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

    it('registers 4 hooks (no VA) when VA disabled', async () => {
      renderHook(() => useStateManager(true));
      await actWait();

      const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
      expect(modules).not.toContain('./useVaChatbot');
      expect(modules).toContain('./useArhChatbot');
      expect(modules).toContain('./useRhelChatbot');
      expect(modules).toContain('./useHccAiChatbot');
      expect(modules).toContain('./useMasChatbot');
      expect(modules).toHaveLength(4);
    });

    it('registers only MAS hook when mao-only flag is ON', async () => {
      flagOverrides[MAO_ONLY_FLAG] = true;

      renderHook(() => useStateManager(true));
      await actWait();

      const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
      expect(modules).toEqual(['./useMasChatbot']);
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
  });

  // --- Zero-manager and manager removal tests ---

  describe('zero managers and manager removal', () => {
    it('returns empty managers array when no managers are available', async () => {
      mockHookResults.length = 0;
      mockHookResults.push(
        {
          id: 'arh',
          loading: false,
          error: null,
          hookResult: { manager: null },
        },
        {
          id: 'hccai',
          loading: false,
          error: null,
          hookResult: { manager: null },
        }
      );

      const { result } = renderHook(() => useStateManager(true));
      await actWait();

      expect(result.current.managers).toEqual([]);
      expect(result.current.currentModel).toBeUndefined();
    });

    it('corrects currentModel when the selected model is not in managers', async () => {
      const hccAiManager = {
        model: 'HCC AI Assistant',
        stateManager: createStateManager(),
        historyManagement: true,
        streamMessages: false,
      };

      mockHookResults.length = 0;
      mockHookResults.push({
        id: 'hccai',
        loading: false,
        error: null,
        hookResult: { manager: hccAiManager },
      });

      // Set a model that does not exist in the available managers
      VirtualAssistantStateSingleton.setCurrentModel('Virtual Assistant' as any);

      const { result } = renderHook(() => useStateManager(true));
      await actWait();

      // Should auto-correct to the first available manager
      expect(result.current.currentModel).toBe('HCC AI Assistant');
    });
  });
});
