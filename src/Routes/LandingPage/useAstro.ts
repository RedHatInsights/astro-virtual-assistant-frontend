import { produce } from 'immer';
import { AssistantMessage, FeedbackMessage, From, Message } from '../../types/Message';
import { PostTalkResponse, postTalk } from '../../api/PostTalk';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { asyncSleep } from '../../utils/Async';
import Config from '../../Config';

type SetMessages = Dispatch<SetStateAction<Array<Message>>>;

const loadMessage = async (
  from: From.ASSISTANT | From.FEEDBACK,
  content: Promise<PostTalkResponse> | PostTalkResponse | string | undefined,
  setMessages: SetMessages,
  minTimeout: number
) => {
  setMessages(
    produce((draft) => {
      draft.push({
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
      from,
      isLoading: false,
      content: contentString,
    };

    if (typeof resolvedContent !== 'string' && from === From.ASSISTANT && resolvedContent.buttons) {
      (message as AssistantMessage).options = resolvedContent.buttons.map((b) => b.payload);
    }

    setMessages(
      produce((draft) => {
        draft.pop();
        draft.push(message);
      })
    );
  } else {
    setMessages(
      produce((draft) => {
        draft.pop();
      })
    );
  }
};

export const useAstro = () => {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Array<Message>>([
    {
      from: From.ASSISTANT,
      content: 'Which set of Hybrid Cloud Console services can I help you with?',
      options: ['OpenShift', 'Ansible', 'RHEL', 'Cloud Native Development', 'Console Services'],
      isLoading: false,
    },
  ]);

  const ask = useCallback(
    async (optionalMessage?: string) => {
      const message = optionalMessage ?? input;
      if (message) {
        setMessages(
          produce((draft) => {
            draft.push({
              from: From.USER,
              content: message,
            });
          })
        );

        setInput('');

        const postTalkResponse = postTalk(message);

        await loadMessage(
          From.ASSISTANT,
          postTalkResponse.then((r) => r[0]),
          setMessages,
          Config.messages.delays.minAssistantResponse
        );

        // responses has already been resolved
        const responses = await postTalkResponse;
        for (let i = 1; i < responses.length; i++) {
          await loadMessage(From.ASSISTANT, responses[i], setMessages, Config.messages.delays.minAssistantResponse);
        }

        await loadMessage(From.FEEDBACK, '', setMessages, Config.messages.delays.feedback);
      }
    },
    [input]
  );

  return {
    ask,
    messages,
    input,
    setInput,
  };
};
