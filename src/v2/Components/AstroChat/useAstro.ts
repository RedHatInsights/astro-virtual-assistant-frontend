import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { original, produce } from 'immer';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { AssistantMessage, Banner, FeedbackMessage, From, Message, SystemMessage } from '../../types/Message';
import { Response, ResponseCommand, ResponseOptions, postTalk } from '../../api/PostTalk';
import { asyncSleep } from '../../utils/Async';
import Config from '../../../Config';
import { MessageProcessor, MessageProcessorOptions } from '../Message/MessageProcessor';
import { v4 as uuidv4 } from 'uuid';
import { buildMetadata } from '../../utils/Metadata';

type SetMessages = Dispatch<SetStateAction<Array<Message>>>;

const findByMessageId = (messageId: string) => (message: { messageId?: string } | object) =>
  'messageId' in message && message.messageId === messageId;

function isAssistantMessage(message: AssistantMessage | FeedbackMessage | string | Response): message is AssistantMessage {
  return typeof message !== 'string';
}

const isResponseOptions = (res: Response): res is ResponseOptions => {
  return res.type === 'OPTIONS';
};

const isCommandType = (res: unknown): res is ResponseCommand => {
  return (
    typeof res === 'object' &&
    res !== null &&
    (res as ResponseCommand).type === 'COMMAND' &&
    typeof (res as ResponseCommand).command === 'string' &&
    Array.isArray((res as ResponseCommand).args)
  );
};

const loadMessage = async (
  from: From.ASSISTANT | From.FEEDBACK,
  content: Promise<Response> | Response | string | undefined,
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

  const [resolvedContent] = await Promise.all([content, asyncSleep(minTimeout)]);
  if (resolvedContent !== undefined) {
    const contentString = typeof resolvedContent === 'string' ? resolvedContent : 'text' in resolvedContent ? resolvedContent.text : '';
    const message: AssistantMessage | FeedbackMessage = {
      messageId,
      from,
      isLoading: false,
      content: contentString,
    };

    if (typeof resolvedContent !== 'string' && from === From.ASSISTANT && isAssistantMessage(message)) {
      if (isResponseOptions(resolvedContent)) {
        message.options = resolvedContent.options?.map((b) => ({
          value: b.value,
          text: b.text,
          optionId: b.option_id,
        }));
      }

      if (isCommandType(resolvedContent)) {
        message.command = {
          type: resolvedContent.command,
          params: {
            args: resolvedContent.args ?? [],
          },
        };
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
  } else {
    // The bot received an empty response from watson; append a banner
    setMessages(
      produce((draft) => {
        const index = original(draft)?.findIndex(findByMessageId(messageId));
        if (index !== undefined && index !== -1) {
          draft[index] = <SystemMessage>{
            from: From.SYSTEM,
            type: 'empty_response',
          };
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
  hideMessage?: boolean;
  hideResponse?: boolean;
  label: string;
  waitResponses?: boolean;
  optionId?: string;
}

export const enum Status {
  LOADING = 'LOADING',
  STARTED = 'STARTED',
  NOT_STARTED = 'NOT_STARTED',
}

export interface AstroOptions {
  isPreview: boolean;
  auth: ChromeAPI['auth'];
}

export const useAstro = (messageProcessors: Array<MessageProcessor>, astroOptions: AstroOptions) => {
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [status, setStatus] = useState<Status>(Status.NOT_STARTED);
  const [loadingResponse, setLoadingResponse] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>();

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

  const addThumbMessage = (): void => {
    setMessages(
      produce((draft) => {
        draft.push({
          from: From.THUMBS,
        });
      })
    );
  };

  const ask = useCallback(
    async (message: string, options?: Partial<AskOptions>) => {
      if (loadingResponse) {
        return;
      }

      if (message) {
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

        const postTalkResponse = postTalk(message, options?.optionId, sessionId, buildMetadata());

        const waitResponses = async () => {
          if (options?.hideResponse) {
            return;
          }

          const messageProcessorOptions = {
            toggleFeedbackModal,
            addSystemMessage,
            addBanner,
            addThumbMessage,
            isPreview: astroOptions.isPreview,
            auth: astroOptions.auth,
          };

          await loadMessage(
            From.ASSISTANT,
            postTalkResponse.then((r) => r.response[0]),
            setMessages,
            Config.messages.delays.minAssistantResponse,
            messageProcessors,
            messageProcessorOptions
          );

          // responses has already been resolved
          const resolvedResponse = await postTalkResponse;
          if (resolvedResponse.session_id) {
            setSessionId(resolvedResponse.session_id);
          }

          const responses = resolvedResponse.response;
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
        waitResponses: false,
        label: 'Session Start',
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
