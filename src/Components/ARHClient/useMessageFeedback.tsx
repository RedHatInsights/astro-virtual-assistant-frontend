import React, { useMemo, useState } from 'react';
import { ActionProps, MessageProps } from '@patternfly/chatbot';
import { useActiveConversation, useClient } from '@redhat-cloud-services/ai-react-state';
import { Message as MessageType } from '@redhat-cloud-services/ai-client-state';
import { IFDAdditionalAttributes, IFDClient } from '@redhat-cloud-services/arh-client';

const positiveQuickResponses = ['Solved my issue', 'Easy to understand', 'Accurate'];
const negativeQuickResponses = ["Didn't solve my issue", 'Confusing', 'Inaccurate'];

interface FeedbackState {
  positive?: boolean;
  sent: boolean;
  sending: boolean;
  detailOpened: boolean;
  freeFormValue: string;
  showFeedbackCompleted: boolean;
}

interface UseMessageFeedbackReturn {
  messageActions: { [key: string]: ActionProps } | undefined;
  userFeedbackForm: MessageProps['userFeedbackForm'] | undefined;
  feedbackCompleted: MessageProps['userFeedbackComplete'] | undefined;
}

export function useMessageFeedback(message: MessageType<IFDAdditionalAttributes>): UseMessageFeedbackReturn {
  const arhClient = useClient<IFDClient>();
  const activeConversation = useActiveConversation();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    positive: undefined,
    sent: false,
    sending: false,
    detailOpened: false,
    freeFormValue: '',
    showFeedbackCompleted: false,
  });

  async function handleFeedbackSubmit(isPositive: boolean, quickResponse = '', freeFormResponse = '') {
    if (feedbackState.sent || feedbackState.sending || !activeConversation || !message.id) {
      return;
    }
    if (message.id) {
      try {
        setFeedbackState((prev) => ({ ...prev, sending: true }));
        await arhClient.sendMessageFeedback(activeConversation?.id, message.id, {
          rating: isPositive ? 'positive' : 'negative',
          freeform: freeFormResponse,
          predefined_response: quickResponse,
        });
        setFeedbackState((prev) => ({
          ...prev,
          positive: isPositive,
          sent: true,
          sending: false,
          detailOpened: false,
          showFeedbackCompleted: true,
        }));
      } catch (error) {
        console.error('Error sending feedback:', error);
        setFeedbackState((prev) => ({ ...prev, sending: false }));
      }
    }
  }

  const messageActions = useMemo<{ [key: string]: ActionProps } | undefined>(() => {
    if (message.role === 'user') {
      return undefined;
    }

    return {
      positive: {
        onClick: () => setFeedbackState((prev) => ({ ...prev, positive: true, detailOpened: true })),
        isDisabled: feedbackState.sent || feedbackState.sending,
        id: `positive-feedback-${message.id}`,
      },
      negative: {
        onClick: () => setFeedbackState((prev) => ({ ...prev, positive: false, detailOpened: true })),
        isDisabled: feedbackState.sent || feedbackState.sending,
        id: `negative-feedback-${message.id}`,
      },
      copy: {
        id: `copy-message-${message.id}`,
        onClick: async () => {
          await navigator.clipboard.writeText(message.answer || '');
        },
      },
    };
  }, [message, feedbackState.sent, feedbackState.sending]);

  const userFeedbackForm = useMemo<MessageProps['userFeedbackForm'] | undefined>(() => {
    if (!feedbackState.detailOpened || feedbackState.positive === undefined) {
      return undefined;
    }
    return {
      quickResponses: (feedbackState.positive ? positiveQuickResponses : negativeQuickResponses).map((response) => ({
        content: response,
        id: response,
      })),
      hasTextArea: true,
      onSubmit: (quickResponse, freeFormResponse) => {
        if (feedbackState.positive === undefined) {
          return;
        }
        handleFeedbackSubmit(feedbackState.positive, quickResponse, freeFormResponse);
      },
      onClose: () => {
        setFeedbackState((prev) => ({ ...prev, detailOpened: false }));
      },
      title: feedbackState.positive ? 'Thank you. Any more feedback?' : 'Thank you. How can we improve?',
      submitWord: 'Send feedback',
    };
  }, [feedbackState.detailOpened, feedbackState.positive]);

  const feedbackCompleted = useMemo<MessageProps['userFeedbackComplete'] | undefined>(() => {
    if (!feedbackState.showFeedbackCompleted) {
      return undefined;
    }
    return {
      onClose: () => {
        setFeedbackState((prev) => ({ ...prev, showFeedbackCompleted: false }));
      },
      id: 'user-feedback-complete-message',
      title: 'Thank you.',
      body: (
        <div data-tracking-id="user-feedback-complete-message">
          <div>We appreciate your input.</div>
          <div> It helps us improve this experience.</div>
        </div>
      ),
    };
  }, [feedbackState.showFeedbackCompleted, feedbackState.positive]);

  return {
    messageActions,
    userFeedbackForm,
    feedbackCompleted,
  };
}
