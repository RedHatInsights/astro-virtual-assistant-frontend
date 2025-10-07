import { act, renderHook } from '@testing-library/react';
import useStateManager from '../useStateManager';
import { ChromeUser } from '@redhat-cloud-services/types';
import * as ScalprumCore from '@scalprum/core';
import { useLocation } from 'react-router-dom';
import { useRhelLightSpeedAuthenticated } from '../useRhelLightSpeedManager';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

// Mock the useFlag hook for feature flags
const mockUseFlag = jest.fn();
const mockUseFlags = jest.fn();
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
  useFlags: () => mockUseFlags([]),
}));

// Mock the useChrome hook
const mockChrome = {
  getEnvironment: jest.fn().mockReturnValue('stage'),
  auth: {
    getUser: jest.fn(),
    getToken: jest.fn(() => Promise.resolve('mock-token')),
    token: 'mock-token',
  },
};

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  __esModule: true,
  default: jest.fn(() => mockChrome),
}));

// Mock checkARHAuth function
jest.mock('../../Components/ARHClient/checkARHAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock PatternFly chatbot module
jest.mock('@patternfly/chatbot', () => ({
  ChatbotDisplayMode: {
    default: 'default',
    docked: 'docked',
    fullscreen: 'fullscreen',
    embedded: 'embedded',
  },
}));

// Mock UniversalChatbot components
jest.mock('../../Components/UniversalChatbot/UniversalChatbot', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../Components/UniversalChatbot/UniversalChatbotProvider', () => ({
  __esModule: true,
  default: () => null,
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

// Mock ARH client
jest.mock('@redhat-cloud-services/arh-client', () => ({
  IFDClient: jest.fn().mockImplementation(() => ({})),
}));

// Mock the entire useArhClient and useRhelLightSpeedManager hooks
jest.mock('../useArhClient', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    model: 'Ask Red Hat',
    stateManager: {
      isInitialized: jest.fn(() => false),
      isInitializing: jest.fn(() => false),
      init: jest.fn(),
    },
    historyManagement: true,
    streamMessages: true,
    routes: ['/baz/*'],
  })),
  useArhAuthenticated: jest.fn(() => ({
    loading: false,
    isAuthenticated: true,
    model: 'Ask Red Hat',
  })),
}));

jest.mock('../useRhelLightSpeedManager', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    model: 'RHEL Lightspeed',
    stateManager: {
      isInitialized: jest.fn(() => false),
      isInitializing: jest.fn(() => false),
      init: jest.fn(),
    },
    historyManagement: false,
    streamMessages: false,
    routes: ['/foo/bar/*'],
  })),
  useRhelLightSpeedAuthenticated: jest.fn(() => ({
    loading: false,
    isAuthenticated: true,
    model: 'RHEL Lightspeed',
  })),
}));

// jest.mock('../useVaManager', () => ({
//   __esModule: true,
//   default: jest.fn(() => ({
//     model: 'VA',
//     stateManager: {
//       isInitialized: jest.fn(() => false),
//       isInitializing: jest.fn(() => false),
//       init: jest.fn(),
//       getClient: jest.fn(() => ({
//         isInitialized: jest.fn(() => false),
//         isInitializing: jest.fn(() => false),
//         getWelcomeContent: jest.fn(() => ''),
//       })),
//     },
//     historyManagement: false,
//     streamMessages: false,
//     welcome: {
//       content: '',
//     },
//   })),
//   useVaAuthenticated: jest.fn(() => ({
//     loading: false,
//     isAuthenticated: false,
//     model: 'VA',
//   })),
// }));

// mock the stateManager's getClient method to return a mock client

// eslint-disable-next-line @typescript-eslint/no-var-requires
const checkARHAuth = require('../../Components/ARHClient/checkARHAuth').default;

describe('useStateManager', () => {
  const mockUser: ChromeUser = {
    entitlements: {},
    identity: {
      org_id: 'org-123',
      account_number: '123456',
      internal: {
        org_id: 'org-123',
        account_id: 'account-123',
      },
      type: 'User',
      user: {
        is_internal: false,
        is_org_admin: false,
        locale: 'en-US',
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.auth.getUser.mockResolvedValue(mockUser);
    checkARHAuth.mockResolvedValue(true);
    mockUseFlags.mockReturnValue([]);
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/' });

    // Mock fetch to prevent network calls and silence warnings
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock;
  });

  it('sets currentModel from available static managers', async () => {
    mockUseFlag.mockReturnValue(false);

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.currentModel).toBe('Ask Red Hat');
  });

  it('handles failed getModule by logging an error and not blocking initialization', async () => {
    const getModuleSpy = jest.spyOn(ScalprumCore, 'getModule').mockRejectedValue(new Error('Mock getModule failure'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    // Enable chatbot so the hook proceeds to compute a model
    mockUseFlag.mockReturnValue(true);

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    // Ensure we specifically logged the failed module message
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load module',
      expect.objectContaining({ scope: 'assistedInstallerApp', module: './AsyncChatbot' }),
      expect.anything()
    );

    // Even though getModule failed, the hook should still select the ARH model
    expect(result.current.currentModel).toBe('Ask Red Hat');

    consoleErrorSpy.mockRestore();
    getModuleSpy.mockRestore();
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
    (useRhelLightSpeedAuthenticated as jest.Mock).mockReturnValue({
      loading: false,
      isAuthenticated: false,
      model: 'RHEL Lightspeed',
    });

    (useLocation as jest.Mock).mockReturnValue({ pathname: '/foo/bar/baz' });

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.currentModel).toBe('Ask Red Hat');
  });
});
