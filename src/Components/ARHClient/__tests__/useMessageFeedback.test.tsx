import { act, renderHook } from '@testing-library/react';
import { useActiveConversation, useClient } from '@redhat-cloud-services/ai-react-state';
import { Conversation, Message as MessageType } from '@redhat-cloud-services/ai-client-state';
import { IFDAdditionalAttributes, IFDClient } from '@redhat-cloud-services/arh-client';

import { useMessageFeedback } from '../useMessageFeedback';

// Mock the external hooks
jest.mock('@redhat-cloud-services/ai-react-state');

const mockUseClient = useClient as jest.MockedFunction<typeof useClient>;
const mockUseActiveConversation = useActiveConversation as jest.MockedFunction<typeof useActiveConversation>;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

describe('useMessageFeedback', () => {
  let mockMessage: MessageType<IFDAdditionalAttributes>;
  let mockClient: Partial<IFDClient>;
  let mockActiveConversation: Conversation<Record<string, unknown>>;

  // Helper function to safely access and call action methods
  const clickAction = (result: any, actionType: 'positive' | 'negative' | 'copy', event: any = {}) => {
    const actions = result.current.messageActions;
    expect(actions).toBeDefined();
    expect(actions![actionType]).toBeDefined();
    expect(actions![actionType].onClick).toBeDefined();
    return actions![actionType].onClick(event);
  };

  const closeFeedback = (result: any) => {
    const feedback = result.current.feedbackCompleted;
    expect(feedback).toBeDefined();
    expect(feedback!.onClose).toBeDefined();
    feedback!.onClose();
  };

  beforeEach(() => {
    // Setup mock message
    mockMessage = {
      id: 'test-message-id',
      role: 'bot',
      answer: 'This is a test bot response',
      additionalAttributes: {},
    } as MessageType<IFDAdditionalAttributes>;

    // Setup mock client
    mockClient = {
      sendMessageFeedback: jest.fn().mockResolvedValue({}),
      init: jest.fn(),
      sendMessage: jest.fn(),
      getConversationHistory: jest.fn(),
      healthCheck: jest.fn(),
      createNewConversation: jest.fn(),
    };

    // Setup mock active conversation
    mockActiveConversation = {
      id: 'test-conversation-id',
      title: 'Test Conversation',
      messages: [],
      locked: false,
    } as Conversation<Record<string, unknown>>;

    // Setup mocks
    mockUseActiveConversation.mockReturnValue(mockActiveConversation);
    mockUseClient.mockReturnValue(mockClient as IFDClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('messageActions', () => {
    it('should return undefined for user messages', () => {
      const userMessage = { ...mockMessage, role: 'user' as const };
      const { result } = renderHook(() => useMessageFeedback(userMessage));

      expect(result.current.messageActions).toBeUndefined();
    });

    it('should return feedback and copy actions for bot messages', () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      expect(result.current.messageActions).toEqual({
        positive: {
          onClick: expect.any(Function),
          isDisabled: false,
          id: 'positive-feedback-test-message-id',
        },
        negative: {
          onClick: expect.any(Function),
          isDisabled: false,
          id: 'negative-feedback-test-message-id',
        },
        copy: {
          id: 'copy-message-test-message-id',
          onClick: expect.any(Function),
        },
      });
    });

    it('should disable feedback actions when feedback is being sent', async () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      // Trigger positive feedback to start sending process
      act(() => {
        clickAction(result, 'positive', {});
      });

      // Submit feedback
      await act(async () => {
        result.current.userFeedbackForm?.onSubmit('Solved my issue', 'Great response!');
      });

      expect(result.current.messageActions?.positive.isDisabled).toBe(true);
      expect(result.current.messageActions?.negative.isDisabled).toBe(true);
    });

    it('should copy message content to clipboard when copy action is clicked', async () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      await act(async () => {
        await clickAction(result, 'copy', {});
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('This is a test bot response');
    });
  });

  describe('userFeedbackForm', () => {
    it('should return undefined when detail is not opened', () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      expect(result.current.userFeedbackForm).toBeUndefined();
    });

    it('should return positive feedback form when positive feedback is opened', () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      act(() => {
        clickAction(result, 'positive', {});
      });

      expect(result.current.userFeedbackForm).toEqual({
        quickResponses: [
          { content: 'Solved my issue', id: 'Solved my issue' },
          { content: 'Easy to understand', id: 'Easy to understand' },
          { content: 'Accurate', id: 'Accurate' },
        ],
        hasTextArea: true,
        onSubmit: expect.any(Function),
        onClose: expect.any(Function),
        title: 'Thank you. Any more feedback?',
        submitWord: 'Send feedback',
      });
    });

    it('should return negative feedback form when negative feedback is opened', () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      act(() => {
        clickAction(result, 'negative', {});
      });

      expect(result.current.userFeedbackForm).toEqual({
        quickResponses: [
          { content: "Didn't solve my issue", id: "Didn't solve my issue" },
          { content: 'Confusing', id: 'Confusing' },
          { content: 'Inaccurate', id: 'Inaccurate' },
        ],
        hasTextArea: true,
        onSubmit: expect.any(Function),
        onClose: expect.any(Function),
        title: 'Thank you. How can we improve?',
        submitWord: 'Send feedback',
      });
    });

    it('should close feedback form when onClose is called', () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      // Open feedback form
      act(() => {
        clickAction(result, 'positive', {});
      });

      expect(result.current.userFeedbackForm).toBeDefined();

      // Close feedback form
      act(() => {
        result.current.userFeedbackForm?.onClose();
      });

      expect(result.current.userFeedbackForm).toBeUndefined();
    });
  });

  describe('feedbackCompleted', () => {
    it('should return undefined when feedback is not completed', () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      expect(result.current.feedbackCompleted).toBeUndefined();
    });

    it('should show feedback completed message after successful submission', async () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      // Open positive feedback
      act(() => {
        clickAction(result, 'positive', {});
      });

      // Submit feedback
      await act(async () => {
        result.current.userFeedbackForm?.onSubmit('Solved my issue', 'Great response!');
      });

      expect(result.current.feedbackCompleted).toEqual({
        onClose: expect.any(Function),
        id: 'user-feedback-complete-message',
        title: 'Thank you.',
        body: expect.any(Object),
      });
    });

    it('should close feedback completed message when onClose is called', async () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      // Open positive feedback and submit
      act(() => {
        clickAction(result, 'positive', {});
      });

      await act(async () => {
        result.current.userFeedbackForm?.onSubmit('Solved my issue', 'Great response!');
      });

      expect(result.current.feedbackCompleted).toBeDefined();

      // Close feedback completed message
      act(() => {
        closeFeedback(result);
      });

      expect(result.current.feedbackCompleted).toBeUndefined();
    });
  });

  describe('feedback submission', () => {
    it('should send positive feedback to the client', async () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      act(() => {
        clickAction(result, 'positive', {});
      });

      await act(async () => {
        result.current.userFeedbackForm?.onSubmit('Solved my issue', 'Great response!');
      });

      expect(mockClient.sendMessageFeedback).toHaveBeenCalledWith('test-conversation-id', 'test-message-id', {
        rating: 'positive',
        freeform: 'Great response!',
        predefined_response: 'Solved my issue',
      });
    });

    it('should send negative feedback to the client', async () => {
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      act(() => {
        clickAction(result, 'negative', {});
      });

      await act(async () => {
        result.current.userFeedbackForm?.onSubmit('Confusing', 'Could be clearer');
      });

      expect(mockClient.sendMessageFeedback).toHaveBeenCalledWith('test-conversation-id', 'test-message-id', {
        rating: 'negative',
        freeform: 'Could be clearer',
        predefined_response: 'Confusing',
      });
    });

    it('should handle feedback submission errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        // Empty implementation for testing
      });
      const mockError = new Error('Network error');
      mockClient.sendMessageFeedback = jest.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      act(() => {
        clickAction(result, 'positive', {});
      });

      await act(async () => {
        result.current.userFeedbackForm?.onSubmit('Solved my issue', 'Great response!');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending feedback:', mockError);
      expect(result.current.feedbackCompleted).toBeUndefined();

      consoleErrorSpy.mockRestore();
    });

    it('should not submit feedback if already sent', async () => {
      // Use a dedicated mock for this test to track calls correctly
      const dedicatedMockClient = {
        sendMessageFeedback: jest.fn().mockResolvedValue({}),
      };
      mockUseClient.mockReturnValue(dedicatedMockClient as unknown as IFDClient);

      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      // Submit feedback first time
      act(() => {
        clickAction(result, 'positive', {});
      });

      await act(async () => {
        result.current.userFeedbackForm?.onSubmit('Solved my issue', 'Great response!');
      });

      // Verify that buttons are now disabled after sending feedback
      expect(result.current.messageActions?.positive.isDisabled).toBe(true);
      expect(result.current.messageActions?.negative.isDisabled).toBe(true);

      // Should only be called once
      expect(dedicatedMockClient.sendMessageFeedback).toHaveBeenCalledTimes(1);
    });

    it('should not submit feedback if no active conversation', async () => {
      mockUseActiveConversation.mockReturnValue(undefined);
      const { result } = renderHook(() => useMessageFeedback(mockMessage));

      act(() => {
        clickAction(result, 'positive', {});
      });

      await act(async () => {
        result.current.userFeedbackForm?.onSubmit('Solved my issue', 'Great response!');
      });

      expect(mockClient.sendMessageFeedback).not.toHaveBeenCalled();
    });

    it('should not submit feedback if message has no id', async () => {
      const messageWithoutId = { ...mockMessage, id: '' };
      const { result } = renderHook(() => useMessageFeedback(messageWithoutId));

      act(() => {
        clickAction(result, 'positive', {});
      });

      await act(async () => {
        result.current.userFeedbackForm?.onSubmit('Solved my issue', 'Great response!');
      });

      expect(mockClient.sendMessageFeedback).not.toHaveBeenCalled();
    });
  });
});
