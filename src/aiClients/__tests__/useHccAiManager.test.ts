import { renderHook } from '@testing-library/react';
import useHccAiManager from '../useHccAiManager';
import { Models } from '../types';

// Mock LightspeedClient
jest.mock('@redhat-cloud-services/lightspeed-client', () => {
  const mockClient = {
    init: jest.fn().mockResolvedValue({ conversations: [] }),
    sendMessage: jest.fn(),
    createNewConversation: jest.fn(),
    getConversationHistory: jest.fn().mockResolvedValue([]),
    healthCheck: jest.fn(),
  };
  return {
    LightspeedClient: jest.fn(() => mockClient),
  };
});

// Mock AI client state
const mockStateManager = {
  isInitialized: jest.fn(() => false),
  isInitializing: jest.fn(() => false),
  init: jest.fn(),
  getClient: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
};

jest.mock('@redhat-cloud-services/ai-client-state', () => ({
  createClientStateManager: jest.fn(() => mockStateManager),
}));

// Mock useChrome
jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  __esModule: true,
  default: () => ({
    auth: {
      getToken: jest.fn().mockResolvedValue('mock-token'),
    },
  }),
}));

// Track useFlag return value
let mockUseFlagReturn = false;
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => mockUseFlagReturn),
}));

describe('useHccAiManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFlagReturn = false;
  });

  describe('when feature flag is off', () => {
    it('should return null manager', () => {
      const { result } = renderHook(() => useHccAiManager());

      expect(result.current.manager).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('when feature flag is on', () => {
    beforeEach(() => {
      mockUseFlagReturn = true;
    });

    it('should create LightspeedClient with correct config', () => {
      const { LightspeedClient } = jest.requireMock('@redhat-cloud-services/lightspeed-client');

      renderHook(() => useHccAiManager());

      expect(LightspeedClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: expect.stringContaining('/api/ai-assistant'),
          fetchFunction: expect.any(Function),
        })
      );
    });

    it('should return HCC_AI model', () => {
      const { result } = renderHook(() => useHccAiManager());

      expect(result.current.manager?.model).toBe(Models.HCC_AI);
    });

    it('should enable history management', () => {
      const { result } = renderHook(() => useHccAiManager());

      expect(result.current.manager?.historyManagement).toBe(true);
    });

    it('should not stream messages', () => {
      const { result } = renderHook(() => useHccAiManager());

      expect(result.current.manager?.streamMessages).toBe(false);
    });

    it('should provide static welcome buttons', () => {
      const { result } = renderHook(() => useHccAiManager());

      expect(result.current.manager?.welcome?.buttons).toEqual([
        { title: 'What can you help me with?', value: 'What can you help me with?' },
        { title: 'List the principals in my organization', value: 'List the principals in my organization' },
      ]);
    });

    it('should not have a custom MessageEntryComponent', () => {
      const { result } = renderHook(() => useHccAiManager());

      expect(result.current.manager?.MessageEntryComponent).toBeUndefined();
    });

    it('should set correct model name and selection info', () => {
      const { result } = renderHook(() => useHccAiManager());

      expect(result.current.manager?.modelName).toBe('HCC AI Assistant');
      expect(result.current.manager?.selectionTitle).toBe('HCC AI Assistant');
    });

    it('should not be loading', () => {
      const { result } = renderHook(() => useHccAiManager());

      expect(result.current.loading).toBe(false);
    });
  });
});
