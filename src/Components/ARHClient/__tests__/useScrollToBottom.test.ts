/* eslint-disable @typescript-eslint/no-var-requires */
import { renderHook } from '@testing-library/react';
import useScrollToBottom from '../useScrollToBottom';
import { useMessages } from '@redhat-cloud-services/ai-react-state';

// Mock the external hook
jest.mock('@redhat-cloud-services/ai-react-state');

const mockUseMessages = useMessages as jest.MockedFunction<typeof useMessages>;

describe('useScrollToBottom', () => {
  let mockElement: HTMLDivElement;
  let mockScrollIntoView: jest.Mock;

  beforeEach(() => {
    mockScrollIntoView = jest.fn();
    mockElement = {
      scrollIntoView: mockScrollIntoView,
    } as any;

    // Mock useMessages to return empty array by default
    mockUseMessages.mockReturnValue([]);

    // Mock ref.current
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    jest.spyOn(require('react'), 'useRef').mockReturnValue({
      current: mockElement,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a ref object', () => {
    const { result } = renderHook(() => useScrollToBottom(false));

    expect(result.current).toEqual({
      current: mockElement,
    });
  });

  it('should scroll to bottom when messages change and banner is closed', () => {
    const { rerender } = renderHook(
      ({ isBannerOpen, messages }) => {
        mockUseMessages.mockReturnValue(messages);
        return useScrollToBottom(isBannerOpen);
      },
      {
        initialProps: {
          isBannerOpen: false,
          messages: [],
        },
      }
    );

    // Clear any initial calls
    mockScrollIntoView.mockClear();

    // Add a message - should trigger scroll
    rerender({
      isBannerOpen: false,
      messages: [{ id: '1', content: 'test message' }] as any,
    });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('should not scroll when banner is open', () => {
    const { rerender } = renderHook(
      ({ isBannerOpen, messages }) => {
        mockUseMessages.mockReturnValue(messages);
        return useScrollToBottom(isBannerOpen);
      },
      {
        initialProps: {
          isBannerOpen: true,
          messages: [],
        },
      }
    );

    // Add a message while banner is open - should not scroll
    rerender({
      isBannerOpen: true,
      messages: [{ id: '1', content: 'test message' }] as any,
    });

    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('should not scroll when ref.current is null', () => {
    // Mock ref.current to be null
    jest.spyOn(require('react'), 'useRef').mockReturnValue({
      current: null,
    });

    const { rerender } = renderHook(
      ({ isBannerOpen, messages }) => {
        mockUseMessages.mockReturnValue(messages);
        return useScrollToBottom(isBannerOpen);
      },
      {
        initialProps: {
          isBannerOpen: false,
          messages: [],
        },
      }
    );

    // Add a message - should not scroll because ref is null
    rerender({
      isBannerOpen: false,
      messages: [{ id: '1', content: 'test message' }] as any,
    });

    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('should scroll when banner changes from open to closed', () => {
    const { rerender } = renderHook(({ isBannerOpen }) => useScrollToBottom(isBannerOpen), {
      initialProps: { isBannerOpen: true },
    });

    // Banner opens to closes - should trigger scroll
    rerender({ isBannerOpen: false });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
