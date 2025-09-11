import React, { useMemo, useState } from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';
import { ActionProps, MessageProps } from '@patternfly/chatbot';

import { FeedbackState } from '../UniversalChatbot/types';
import { Message } from '@redhat-cloud-services/ai-client-state';
import { VAAdditionalAttributes } from '../../aiClients/vaClient';
import { postFeedback } from '../../api/PostFeedback';

// update this for VA cases
const positiveQuickResponses = ['Solved my issue', 'Easy to understand', 'Accurate'];
const negativeQuickResponses = ["Didn't solve my issue", 'Confusing', 'Inaccurate'];

const useVAFeedback = (message: Message<VAAdditionalAttributes>, onError: (error: Error) => void) => {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    positive: undefined,
    sent: false,
    sending: false,
    detailOpened: false,
    freeFormValue: '',
    showFeedbackCompleted: false,
  });
  const chrome = useChrome();
  const env = chrome.getEnvironment();
  const isAvailable = useFlag('platform.chrome.feedback');
  const addFeedbackTag = () => (chrome.isProd() ? `[PROD]` : '[PRE-PROD]');
  async function handleFeedbackSubmit(isPositive: boolean, freeFormResponse = '', quickResponse = '') {
    if (feedbackState.sent || feedbackState.sending || !message.id) {
      return;
    }
    const user = await chrome.auth.getUser();
    if (!user) {
      // should never happen but technically the chrome API can return no user
      throw new Error('User not found');
    }

    if (isAvailable) {
      try {
        setFeedbackState((prev) => ({ ...prev, sending: true }));
        await postFeedback({
          summary: addFeedbackTag() + 'App Feedback',
          description: `${quickResponse ? quickResponse + '; ' : ''}${freeFormResponse}` || 'No description provided',
          labels: ['VA', isPositive ? 'positive' : 'negative', env],
        });

        setFeedbackState((prev) => ({
          ...prev,
          positive: isPositive,
          sent: true,
          sending: false,
          detailOpened: false,
          showFeedbackCompleted: true,
        }));
      } catch (err) {
        let errorInternal: Error;
        if (err instanceof Error) {
          errorInternal = err;
        } else {
          const errMessage = `Error: ${JSON.stringify(err)}`;
          errorInternal = new Error('Unable to send feedback', { cause: errMessage });
        }
        onError(errorInternal);
        setFeedbackState((prev) => ({ ...prev, sending: false }));
      }
    } else {
      onError(new Error('Submitting feedback is not available on this environment'));
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
};

export default useVAFeedback;
