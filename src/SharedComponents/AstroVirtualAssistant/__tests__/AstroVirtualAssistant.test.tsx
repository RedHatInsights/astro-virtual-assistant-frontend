/* eslint-disable @typescript-eslint/no-empty-function */
import * as React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import AstroVirtualAssistant from '../AstroVirtualAssistant';

// Mock the useChrome hook - provides auth context
const mockChrome = {
  getEnvironment: jest.fn(() => 'stage'),
  isBeta: jest.fn(() => false),
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

// Mock feature flag hook - requires Unleash context
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false), // Default to disabled
  useFlags: jest.fn(() => []),
}));

// Mock navigation hook - requires router context
jest.mock('@redhat-cloud-services/frontend-components-utilities/useInsightsNavigate', () => ({
  useInsightsNavigate: () => jest.fn(),
}));

// Mock react-markdown - ESM module causing parsing issues
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

// Mock PatternFly chatbot - ESM module causing parsing issues with markdown dependencies
jest.mock('@patternfly/chatbot', () => ({
  __esModule: true,
  Chatbot: ({ children }: { children: React.ReactNode }) => <div className="pf-chatbot">{children}</div>,
  ChatbotConversationHistoryNav: ({ drawerContent }: any) => <div className="pf-chatbot__conversation-history-nav">{drawerContent}</div>,
  ChatbotDisplayMode: {
    default: 'default',
    embedded: 'embedded',
    fullscreen: 'fullscreen',
  },
}));

// Mock AI client state completely
jest.mock('@redhat-cloud-services/ai-client-state', () => ({
  createClientStateManager: jest.fn(() => ({
    isInitialized: jest.fn(() => false),
    isInitializing: jest.fn(() => false),
    init: jest.fn(),
    getClient: jest.fn(() => ({
      isInitialized: jest.fn(() => false),
      isInitializing: jest.fn(() => false),
      getWelcomeContent: jest.fn(() => ''),
    })),
    subscribe: jest.fn(() => () => {}), // return unsubscribe function
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

// Mock AI client react state
jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useIsInitializing: jest.fn(() => false),
  AIStateProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ai-state-provider">{children}</div>
  ),
}));

// Mock all the AI client hooks to return basic configurations
jest.mock('../../../aiClients/useArhClient', () => ({
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
  })),
  useArhAuthenticated: jest.fn(() => ({
    loading: false,
    isAuthenticated: false,
    model: 'Ask Red Hat',
  })),
}));

jest.mock('../../../aiClients/useRhelLightSpeedManager', () => ({
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
  })),
  useRhelLightSpeedAuthenticated: jest.fn(() => ({
    loading: false,
    isAuthenticated: false,
    model: 'RHEL Lightspeed',
  })),
}));

jest.mock('../../../aiClients/useVaManager', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    model: 'VA',
    stateManager: {
      isInitialized: jest.fn(() => false),
      isInitializing: jest.fn(() => false),
      init: jest.fn(),
      getClient: jest.fn(() => ({
        isInitialized: jest.fn(() => false),
        isInitializing: jest.fn(() => false),
        getWelcomeContent: jest.fn(() => ''),
      })),
      subscribe: jest.fn(() => () => {}),
    },
    historyManagement: false,
    streamMessages: false,
    welcome: '',
  })),
  useVaAuthenticated: jest.fn(() => ({
    loading: false,
    isAuthenticated: false,
    model: 'VA',
  })),
}));

jest.mock('../../../Components/UniversalChatbot/UniversalBadge', () => ({
  __esModule: true,
  default: () => <div data-testid="arh-badge">ARH Badge</div>,
}));

// Create a minimal Redux store for testing
const mockStore = createStore(() => ({}));

describe('AstroVirtualAssistant', () => {
  it('should render without crashing', () => {
    render(
      <Provider store={mockStore}>
        <AstroVirtualAssistant showAssistant={true} />
      </Provider>
    );
    
    expect(true).toBe(true); // Simple test to verify component renders
  });
});
