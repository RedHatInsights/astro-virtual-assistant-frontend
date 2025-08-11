import { renderHook } from '@testing-library/react';
import { useCreateNewConversation } from '@redhat-cloud-services/ai-react-state';
import { Message } from '@redhat-cloud-services/ai-client-state';
import { IFDAdditionalAttributes } from '@redhat-cloud-services/arh-client';
import { AlertVariant } from '@patternfly/react-core';

import useArhMessageQuota from '../useArhMessageQuota';

// Mock the external hooks
jest.mock('@redhat-cloud-services/ai-react-state');

const mockUseCreateNewConversation = useCreateNewConversation as jest.MockedFunction<typeof useCreateNewConversation>;

describe('useArhMessageQuota', () => {
  const mockCreateNewConversation = jest.fn();

  beforeEach(() => {
    mockUseCreateNewConversation.mockReturnValue(mockCreateNewConversation);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return undefined when no message is provided', () => {
    const { result } = renderHook(() => useArhMessageQuota(undefined));
    expect(result.current).toBeUndefined();
  });

  it('should return undefined when quota is not enabled', () => {
    const message: Message<IFDAdditionalAttributes> = {
      id: 'test-message',
      role: 'bot',
      answer: 'Test response',
      date: new Date(),
      additionalAttributes: {
        quota: {
          enabled: false,
          quota: {
            limit: 10,
            used: 5,
          },
        },
      },
    };

    const { result } = renderHook(() => useArhMessageQuota(message));
    expect(result.current).toBeUndefined();
  });

  it('should return undefined when quota data is incomplete', () => {
    const message: Message<IFDAdditionalAttributes> = {
      id: 'test-message',
      role: 'bot',
      answer: 'Test response',
      date: new Date(),
      additionalAttributes: {
        quota: {
          enabled: true,
          quota: {
            limit: undefined as any,
            used: 5,
          },
        },
      },
    };

    const { result } = renderHook(() => useArhMessageQuota(message));
    expect(result.current).toBeUndefined();
  });

  it('should return warning alert when user is 5 messages from limit', () => {
    const message: Message<IFDAdditionalAttributes> = {
      id: 'test-message',
      role: 'bot',
      answer: 'Test response',
      date: new Date(),
      additionalAttributes: {
        quota: {
          enabled: true,
          quota: {
            limit: 20,
            used: 15, // 15 + 5 = 20 (limit)
          },
        },
      },
    };

    const { result } = renderHook(() => useArhMessageQuota(message));

    expect(result.current).toEqual({
      variant: AlertVariant.warning,
      title: expect.any(Object), // React component
    });
  });

  it('should return danger alert when quota is exceeded', () => {
    const message: Message<IFDAdditionalAttributes> = {
      id: 'test-message',
      role: 'bot',
      answer: 'Test response',
      date: new Date(),
      additionalAttributes: {
        quota: {
          enabled: true,
          quota: {
            limit: 10,
            used: 10, // used >= limit
          },
        },
      },
    };

    const { result } = renderHook(() => useArhMessageQuota(message));

    expect(result.current).toEqual({
      variant: AlertVariant.danger,
      title: 'Message limit reached',
      children: expect.any(Object), // React component
      actionLinks: expect.any(Object), // React component with AlertActionLink
    });
  });

  it('should return danger alert when quota is over limit', () => {
    const message: Message<IFDAdditionalAttributes> = {
      id: 'test-message',
      role: 'bot',
      answer: 'Test response',
      date: new Date(),
      additionalAttributes: {
        quota: {
          enabled: true,
          quota: {
            limit: 10,
            used: 12, // over limit
          },
        },
      },
    };

    const { result } = renderHook(() => useArhMessageQuota(message));

    expect(result.current).toEqual({
      variant: AlertVariant.danger,
      title: 'Message limit reached',
      children: expect.any(Object),
      actionLinks: expect.any(Object),
    });
  });

  it('should return undefined when user is not near the limit', () => {
    const message: Message<IFDAdditionalAttributes> = {
      id: 'test-message',
      role: 'bot',
      answer: 'Test response',
      date: new Date(),
      additionalAttributes: {
        quota: {
          enabled: true,
          quota: {
            limit: 20,
            used: 10, // 10 + 5 = 15, which is < 20
          },
        },
      },
    };

    const { result } = renderHook(() => useArhMessageQuota(message));
    expect(result.current).toBeUndefined();
  });

  it('should handle edge case when exactly at warning threshold', () => {
    const message: Message<IFDAdditionalAttributes> = {
      id: 'test-message',
      role: 'bot',
      answer: 'Test response',
      date: new Date(),
      additionalAttributes: {
        quota: {
          enabled: true,
          quota: {
            limit: 25,
            used: 20, // 20 + 5 = 25 (exactly at limit)
          },
        },
      },
    };

    const { result } = renderHook(() => useArhMessageQuota(message));

    expect(result.current).toEqual({
      variant: AlertVariant.warning,
      title: expect.any(Object),
    });
  });

  it('should handle case when quota is not provided in additionalAttributes', () => {
    const message: Message<IFDAdditionalAttributes> = {
      id: 'test-message',
      role: 'bot',
      answer: 'Test response',
      date: new Date(),
      additionalAttributes: {},
    };

    const { result } = renderHook(() => useArhMessageQuota(message));
    expect(result.current).toBeUndefined();
  });

  it('should handle case when additionalAttributes is not provided', () => {
    const message: Message<IFDAdditionalAttributes> = {
      id: 'test-message',
      role: 'bot',
      answer: 'Test response',
    } as Message<IFDAdditionalAttributes>;

    const { result } = renderHook(() => useArhMessageQuota(message));
    expect(result.current).toBeUndefined();
  });
});
