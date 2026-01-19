import React, { useEffect, useMemo } from 'react';
import { Message } from '@patternfly/chatbot';
import { Message as MessageType } from '@redhat-cloud-services/ai-client-state';

import { VAAdditionalAttributes } from '../../aiClients/vaClient';
import { ResponseCommand, ResponseOptions, ResponseText, isResponseCommand, isResponseOptions, isResponseText } from '../../api/PostTalk';
import ARH_BOT_ICON from '../../assets/Ask_Red_Hat_OFFICIAL-whitebackground.svg';
import { useSendMessage } from '@redhat-cloud-services/ai-react-state';
import { commandMessageProcessor } from '../../SharedComponents/AstroVirtualAssistant/CommandMessageProcessor';
import { AssistantMessage, Banner, From, SystemMessage } from '../../types/Message';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useBannerMessages, useSystemMessages } from './useLocalMessages';
import BannerEntry from './BannerMessage';
import useVAFeedback from './useVAFeedback';
import { MessageProcessorOptions } from '../../types/Common';

export function createSystemMessageContent(message: SystemMessage): string {
  let systemMessageText = '';

  switch (message.type) {
    case 'empty_response':
      systemMessageText = 'The Virtual Assistant had trouble responding. Please try a different question.';
      break;
    case 'finish_conversation_message':
      systemMessageText = 'End of conversation';
      break;
    case 'redirect_message':
      systemMessageText = `Your browser may block pop-ups. Please allow pop-ups or click [here](${message.additionalContent?.[0]}).`;
      break;
    case 'request_error':
      systemMessageText = 'Please try again later.';
  }

  return systemMessageText;
}

const TextResponseComponent = ({
  parentMessage,
  response,
  idx,
}: {
  parentMessage: MessageType<VAAdditionalAttributes>;
  response: ResponseText;
  idx: number;
}) => {
  const messageDate = `${parentMessage.date?.toLocaleDateString()} ${parentMessage.date?.toLocaleTimeString()}`;
  const { messageActions, userFeedbackForm, feedbackCompleted } = useVAFeedback(
    {
      answer: response.text,
      date: parentMessage.date,
      id: `${parentMessage.id}-${idx}-text`,
      role: 'bot',
    },
    (error) => {
      console.error('Error sending feedback:', error);
    }
  );
  return (
    <Message
      id={`${parentMessage.id}-${idx}`}
      isLoading={false}
      role="bot"
      avatar={ARH_BOT_ICON}
      content={response.text}
      aria-label={`AI response: ${response.text}`}
      timestamp={messageDate}
      actions={messageActions}
      userFeedbackForm={userFeedbackForm}
      userFeedbackComplete={feedbackCompleted}
    />
  );
};

const OptionsResponseComponent = ({
  parentMessage,
  response,
  idx,
}: {
  parentMessage: MessageType<VAAdditionalAttributes>;
  idx: number;
  response: ResponseOptions;
}) => {
  const sendMessage = useSendMessage();
  const messageDate = `${parentMessage.date?.toLocaleDateString()} ${parentMessage.date?.toLocaleTimeString()}`;
  const { messageActions, userFeedbackForm, feedbackCompleted } = useVAFeedback(
    {
      answer: response.text ?? '',
      date: parentMessage.date,
      id: `${parentMessage.id}-${idx}-text`,
      role: 'bot',
    },
    (error) => {
      console.error('Error sending feedback:', error);
    }
  );
  return (
    <Message
      key="options-text"
      id={`${parentMessage.id}-${idx}-options-text`}
      isLoading={false}
      role="bot"
      avatar={ARH_BOT_ICON}
      content={response.text ?? ''}
      aria-label={`AI response: ${response.text}`}
      timestamp={messageDate}
      quickResponses={response.options.map((option, index) => ({
        content: option.text,
        id: `${parentMessage.id}-${idx}-option-${index}`,
        onClick: () => {
          sendMessage(option.value, { requestPayload: { optionId: option.option_id } });
        },
      }))}
      actions={messageActions}
      userFeedbackForm={userFeedbackForm}
      userFeedbackComplete={feedbackCompleted}
    />
  );
};

const SystemMessageComponent = ({ message }: { message: SystemMessage }) => {
  const content = createSystemMessageContent(message);
  const { messageActions, userFeedbackForm, feedbackCompleted } = useVAFeedback(
    {
      answer: content,
      date: new Date(),
      id: content,
      role: 'bot',
    },
    (error) => {
      console.error('Error sending feedback:', error);
    }
  );
  return (
    <Message
      id="system-message"
      role="bot"
      avatar={ARH_BOT_ICON}
      content={content}
      aria-label={`System message: ${content}`}
      timestamp={''}
      actions={messageActions}
      userFeedbackForm={userFeedbackForm}
      userFeedbackComplete={feedbackCompleted}
    />
  );
};

const BannerMessageComponent = ({ message }: { message: Banner }) => {
  return <BannerEntry message={message} />;
};

const CommandResponseComponent = ({
  parentMessage,
  response,
  idx,
}: {
  parentMessage: MessageType<VAAdditionalAttributes>;
  idx: number;
  response: ResponseCommand;
}) => {
  const { auth, isBeta } = useChrome();
  const { systemMessages, addSystemMessage } = useSystemMessages();
  const { bannerMessages, addBanner } = useBannerMessages();
  function handleCommand(command: ResponseCommand) {
    const message: AssistantMessage = {
      content: '',
      messageId: `${parentMessage.id}-${idx}-command`,
      from: From.ASSISTANT,
      isLoading: false,
      command: {
        type: command.command,
        params: {
          args: command.args,
        },
      },
    };
    const commandOptions: MessageProcessorOptions = {
      addBanner,
      addSystemMessage,
      // Not going to be used, we will use the feedback functionality from PF chatbot
      addThumbMessage: () => undefined,
      // Not going to be used, we will use the feedback functionality from PF chatbot
      toggleFeedbackModal: () => undefined,
      isPreview: isBeta(),
      auth,
    };
    commandMessageProcessor(message, commandOptions);
  }
  useEffect(() => {
    handleCommand(response);
  }, []);

  const mixedMessages = useMemo(
    () => [
      ...systemMessages.map((msg, index) => <SystemMessageComponent key={`system-message-${index}`} message={msg} />),
      ...bannerMessages.map((msg, index) => <BannerMessageComponent key={`banner-message-${index}`} message={msg} />),
    ],
    [systemMessages, bannerMessages]
  );

  if (mixedMessages.length > 0) {
    return mixedMessages;
  }
  return null;
};

const VAMessageEntry = ({ message, avatar }: { message: MessageType<VAAdditionalAttributes>; avatar: string }) => {
  if (message.role === 'user') {
    return (
      <Message
        id={message.id}
        // Don't want users to paste MD and display it
        isMarkdownDisabled={true}
        isLoading={false}
        role="user"
        avatar={avatar}
        content={message.answer}
        aria-label={`User message: ${message.answer}`}
        timestamp={`${message.date?.toLocaleDateString()} ${message.date?.toLocaleTimeString()}`}
      />
    );
  }
  const vaMessages = message.additionalAttributes?.vaResponse ?? [];
  const messagesData = vaMessages
    .map((response, index) => {
      if (isResponseText(response)) {
        return <TextResponseComponent key={`${message.id}-${index}`} response={response} parentMessage={message} idx={index} />;
      }
      if (isResponseOptions(response)) {
        return <OptionsResponseComponent key={`${message.id}-${index}`} response={response} parentMessage={message} idx={index} />;
      }
      if (isResponseCommand(response)) {
        return <CommandResponseComponent key={`${message.id}-${index}`} response={response} parentMessage={message} idx={index} />;
      }
      return '';
    })
    .flat();
  return messagesData;
};

export default VAMessageEntry;
