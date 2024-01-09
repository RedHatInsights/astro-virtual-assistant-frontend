import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { original, produce } from 'immer';

import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { AssistantMessage, Banner, FeedbackMessage, From, Message, SystemMessage } from '../../types/Message';
import { PostTalkResponse, postTalk } from '../../api/PostTalk';
import { asyncSleep } from '../../utils/Async';
import Config from '../../Config';
import { MessageProcessor, MessageProcessorOptions } from '../Message/MessageProcessor';
import { v4 as uuidv4 } from 'uuid';
import { Command } from '../../types/Command';
import { buildMetadata } from '../../utils/Metadata';

type SetMessages = Dispatch<SetStateAction<Array<Message>>>;

const findByMessageId = (messageId: string) => (message: { messageId?: string } | object) =>
  'messageId' in message && message.messageId === messageId;

const loadMessage = async (
  from: From.ASSISTANT | From.FEEDBACK,
  content: Promise<PostTalkResponse> | PostTalkResponse | string | undefined,
  setMessages: SetMessages,
  minTimeout: number,
  processors: Array<MessageProcessor>,
  options: MessageProcessorOptions
) => {
  const messageId = uuidv4();
  setMessages(
    produce((draft) => {
      draft.push({
        messageId,
        from,
        isLoading: true,
        content: '',
      });
    })
  );

  const startTime = new Date().getTime();
  const resolvedContent = await content;

  const endTime = new Date().getTime();
  const remainingTime = Math.max(minTimeout - endTime + startTime, 0);

  await asyncSleep(remainingTime);

  if (resolvedContent !== undefined) {
    const contentString = typeof resolvedContent === 'string' ? resolvedContent : resolvedContent.text;

    const message: AssistantMessage | FeedbackMessage = {
      messageId,
      from,
      isLoading: false,
      content: contentString,
    };

    if (typeof resolvedContent !== 'string' && from === From.ASSISTANT) {
      if (resolvedContent.buttons) {
        (message as AssistantMessage).options = resolvedContent.buttons.map((b) => ({
          title: b.title,
          payload: b.payload,
        }));
      }

      if (resolvedContent.custom) {
        if (resolvedContent.custom.type === 'command' && resolvedContent.custom.command) {
          (message as AssistantMessage).command = {
            type: resolvedContent.custom.command,
            params: resolvedContent.custom.params,
          } as Command;
        }
      }
    }

    await messageProcessor(message, processors, options);

    setMessages(
      produce((draft) => {
        const index = original(draft)?.findIndex(findByMessageId(messageId));
        if (index !== undefined && index !== -1) {
          draft[index] = message;
        } else {
          draft.push(message);
        }
      })
    );
  } else {
    setMessages(
      produce((draft) => {
        const index = original(draft)?.findIndex(findByMessageId(messageId));
        if (index !== undefined && index !== -1) {
          draft.splice(index, 1);
        }
      })
    );
  }
};

const messageProcessor = async (
  message: AssistantMessage | FeedbackMessage,
  processors: Array<MessageProcessor>,
  options: MessageProcessorOptions
) => {
  for (const processor of processors) {
    await processor(message, options);
  }
};

export interface AskOptions {
  hideMessage: boolean;
  hideResponse: boolean;
  label: string;
  waitResponses: boolean;
}

export const enum Status {
  LOADING = 'LOADING',
  STARTED = 'STARTED',
  NOT_STARTED = 'NOT_STARTED',
}

export const useAstro = (messageProcessors: Array<MessageProcessor>) => {
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [status, setStatus] = useState<Status>(Status.NOT_STARTED);
  const [loadingResponse, setLoadingResponse] = useState<boolean>(false);

  const { toggleFeedbackModal } = useChrome();

  const addSystemMessage = (systemMessageType: string, additionalContent: Array<string>): void => {
    const systemMessage: SystemMessage = {
      from: From.SYSTEM,
      content: 'system_message',
      type: systemMessageType,
      additionalContent: additionalContent,
    };
    setMessages(
      produce((draft) => {
        draft.push(systemMessage);
      })
    );
  };

  const addBanner = (bannerType: string, additionalContent: Array<string>): void => {
    const banner: Banner = {
      from: From.INTERFACE,
      content: 'banner',
      type: bannerType,
      additionalContent: additionalContent,
    };
    setMessages(
      produce((draft) => {
        draft.push(banner);
      })
    );
  };

  const ask = useCallback(
    async (message: string, options?: Partial<AskOptions>) => {
      if (loadingResponse) {
        return;
      }

      setLoadingResponse(true);
      const validOptions: AskOptions = {
        ...{
          hideMessage: false,
          label: message,
          waitResponses: true,
          hideResponse: false,
        },
        ...options,
      };

      if (message) {
        if (!options?.hideMessage) {
          setMessages(
            produce((draft) => {
              draft.push({
                from: From.USER,
                content: validOptions.label,
              });
            })
          );
        }

        const postTalkResponse = postTalk(message, buildMetadata());

        const waitResponses = async () => {
          if (options?.hideResponse) {
            return;
          }

          const messageProcessorOptions = {
            toggleFeedbackModal,
            addSystemMessage,
            addBanner,
          };

          await loadMessage(
            From.ASSISTANT,
            postTalkResponse.then((r) => r[0]),
            setMessages,
            Config.messages.delays.minAssistantResponse,
            messageProcessors,
            messageProcessorOptions
          );

          // responses has already been resolved
          const responses = await postTalkResponse;
          for (let i = 1; i < responses.length; i++) {
            await loadMessage(
              From.ASSISTANT,
              responses[i],
              setMessages,
              Config.messages.delays.minAssistantResponse,
              messageProcessors,
              messageProcessorOptions
            );
          }
        };

        if (validOptions.waitResponses) {
          await waitResponses();
          setLoadingResponse(false);
        } else {
          waitResponses().then(() => setLoadingResponse(false));
          await postTalkResponse;
        }
      }
    },
    [messageProcessors, loadingResponse]
  );

  const start = useCallback(async () => {
    if (status === Status.NOT_STARTED) {
      setStatus(Status.LOADING);

      await ask('/session_start', {
        hideMessage: true,
        hideResponse: true,
        waitResponses: false,
      });

      await ask('/intent_core_session_start', {
        hideMessage: true,
        waitResponses: false,
      });

      setStatus(Status.STARTED);
    }
  }, [ask, status]);

  const stop = useCallback(async () => {
    if (status === Status.STARTED) {
      setMessages([]);
      setStatus(Status.NOT_STARTED);
    }
  }, [ask, status]);

  return {
    ask,
    messages,
    setMessages,
    start,
    stop,
    status,
    loadingResponse,
  };
};
