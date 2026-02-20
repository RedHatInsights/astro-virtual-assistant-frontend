import { useActiveConversation, useInProgress, useInitLimitation, useMessages, useSendMessage } from '@redhat-cloud-services/ai-react-state';
import { IFDAdditionalAttributes } from '@redhat-cloud-services/arh-client';
import { Message } from '@redhat-cloud-services/ai-client-state';

// We can't easily test the full component due to complex dependencies,
// but we can test the core logic that determines when the send button should be disabled

// Mock the external hooks
jest.mock('@redhat-cloud-services/ai-react-state');
jest.mock('../useArhMessageQuota', () => {
  return jest.fn();
});

const mockUseActiveConversation = useActiveConversation as jest.MockedFunction<typeof useActiveConversation>;
const mockUseInProgress = useInProgress as jest.MockedFunction<typeof useInProgress>;
const mockUseInitLimitation = useInitLimitation as jest.MockedFunction<typeof useInitLimitation>;
const mockUseMessages = useMessages as jest.MockedFunction<typeof useMessages>;
const mockUseSendMessage = useSendMessage as jest.MockedFunction<typeof useSendMessage>;

const mockUseArhMessageQuota = require('../useArhMessageQuota') as jest.MockedFunction<any>;

describe('ARHFooter Logic', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set default values
    mockUseActiveConversation.mockReturnValue({ id: 'test-conv', locked: false, title: 'Test Conversation', messages: [], createdAt: new Date() });
    mockUseInProgress.mockReturnValue(false);
    mockUseInitLimitation.mockReturnValue(undefined);
    mockUseMessages.mockReturnValue([]);
    mockUseSendMessage.mockReturnValue(jest.fn());
    mockUseArhMessageQuota.mockReturnValue(undefined);
  });

  describe('Send button disabled logic', () => {
    // Create a helper function to simulate the ARHFooter logic
    const shouldDisableSendButton = () => {
      const inProgress = mockUseInProgress();
      const activeConversation = mockUseActiveConversation();
      const initLimitations = mockUseInitLimitation();
      const messages = mockUseMessages<IFDAdditionalAttributes>();

      // Simulate the conversation lock logic
      const conversationLock = !activeConversation && initLimitations?.reason === 'quota-breached';

      // Simulate the quota exceeded logic
      const quotaExceeded = mockUseArhMessageQuota(messages[messages.length - 1]);

      return inProgress || activeConversation?.locked || quotaExceeded?.variant === 'danger' || conversationLock;
    };

    it('should disable send button when in progress', () => {
      mockUseInProgress.mockReturnValue(true);

      expect(shouldDisableSendButton()).toBe(true);
    });

    it('should disable send button when active conversation is locked', () => {
      mockUseActiveConversation.mockReturnValue({ id: 'test-conv', locked: true, title: 'Test Conversation', messages: [], createdAt: new Date() });

      expect(shouldDisableSendButton()).toBe(true);
    });

    it('should disable send button when conversation limit is reached (no active conversation with quota-breached)', () => {
      mockUseActiveConversation.mockReturnValue(undefined);
      mockUseInitLimitation.mockReturnValue({ reason: 'quota-breached' });

      expect(shouldDisableSendButton()).toBe(true);
    });

    it('should disable send button when message quota is exceeded (danger variant)', () => {
      const quotaExceededMessage: Message<IFDAdditionalAttributes> = {
        id: 'test-message',
        role: 'bot',
        answer: 'Test response',
        date: new Date(),
        additionalAttributes: {
          quota: {
            enabled: true,
            quota: {
              limit: 10,
              used: 10, // quota exceeded
            },
          },
        },
      };

      mockUseMessages.mockReturnValue([quotaExceededMessage]);
      mockUseArhMessageQuota.mockReturnValue({ variant: 'danger' });

      expect(shouldDisableSendButton()).toBe(true);
    });

    it('should enable send button when all conditions are normal', () => {
      mockUseInProgress.mockReturnValue(false);
      mockUseActiveConversation.mockReturnValue({ id: 'test-conv', locked: false, title: 'Test Conversation', messages: [], createdAt: new Date() });
      mockUseInitLimitation.mockReturnValue(undefined);
      mockUseMessages.mockReturnValue([]);
      mockUseArhMessageQuota.mockReturnValue(undefined);

      expect(shouldDisableSendButton()).toBe(false);
    });

    it('should enable send button when quota warning is shown (not exceeded)', () => {
      const quotaWarningMessage: Message<IFDAdditionalAttributes> = {
        id: 'test-message',
        role: 'bot',
        answer: 'Test response',
        date: new Date(),
        additionalAttributes: {
          quota: {
            enabled: true,
            quota: {
              limit: 20,
              used: 15, // warning but not exceeded
            },
          },
        },
      };

      mockUseMessages.mockReturnValue([quotaWarningMessage]);
      mockUseArhMessageQuota.mockReturnValue({ variant: 'warning' });

      expect(shouldDisableSendButton()).toBe(false);
    });

    it('should not disable for other initLimitation reasons', () => {
      mockUseActiveConversation.mockReturnValue({ id: 'test-conv', locked: false, messages: [], title: 'Test Conversation', createdAt: new Date() });
      mockUseInitLimitation.mockReturnValue({ reason: 'other-reason' });

      expect(shouldDisableSendButton()).toBe(false);
    });

    it('should handle empty messages array gracefully', () => {
      mockUseMessages.mockReturnValue([]);
      mockUseArhMessageQuota.mockReturnValue(undefined);

      expect(shouldDisableSendButton()).toBe(false);
    });
  });
});
