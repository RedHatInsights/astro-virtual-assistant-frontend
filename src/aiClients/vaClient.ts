import { IAIClient, IConversation, IConversationMessage, IMessageResponse, ISendMessageOptions } from '@redhat-cloud-services/ai-client-common';
import { Response as VAResponse, postTalk } from '../api/PostTalk';

const TEMP_CONVERSATION_ID = 'va-conversation';

export type VAAdditionalAttributes = {
  vaResponse: VAResponse[];
};

export type VASendMessageOptions = ISendMessageOptions<
  Record<string, unknown>,
  {
    optionId?: string;
  }
>;

class VAClient implements IAIClient<VAAdditionalAttributes> {
  private sessionId: string = TEMP_CONVERSATION_ID;
  private initialMessage: IConversationMessage<VAAdditionalAttributes> = {
    answer: '',
    date: new Date(),
    input: '/session_start',
    message_id: crypto.randomUUID(),
    role: 'bot',
    additionalAttributes: {
      vaResponse: [
        {
          text: 'Hello! How can I assist you today?',
          type: 'TEXT',
        },
      ],
    },
  };
  async createNewConversation(): Promise<IConversation> {
    // VA does not manage conversations
    return {
      createdAt: new Date(),
      id: this.sessionId,
      locked: false,
      title: 'Virtual Assistant',
    };
  }

  async getConversationHistory() {
    return [this.initialMessage];
  }
  healthCheck(): Promise<unknown> {
    throw new Error('Method not implemented.');
  }

  async init() {
    // VA initializes with a postTalk set message and empty session ID
    const response = await postTalk('/session_start');
    // response always have a single response of type text and introduction message
    // it also contains the session_id that maps to conversation ID
    // we will use promotion mechanism to show this message
    if (response.response.length !== 1) {
      throw new Error('Failed to initialize VA session');
    }

    console.log('VA initialized', response);

    this.sessionId = response.session_id;
    const initialConversation: IConversation = {
      createdAt: new Date(),
      id: this.sessionId,
      locked: false,
      title: 'Virtual Assistant',
    };

    // override the initial message with the bot response
    this.initialMessage = {
      role: 'bot',
      input: '/session_start',
      message_id: crypto.randomUUID(),
      answer: '',
      date: new Date(),
      additionalAttributes: {
        vaResponse: response.response,
      },
    };
    return {
      conversations: [initialConversation],
    };
  }

  getInitialMessage() {
    return this.initialMessage;
  }

  // conversation maps to session ID
  async sendMessage(conversationId: string, text: string, options?: VASendMessageOptions) {
    const option_id = options?.requestPayload?.optionId;
    const response = await postTalk(text, option_id, conversationId === TEMP_CONVERSATION_ID ? undefined : conversationId);

    const newConversationId = response.session_id;

    const clientResponse: IMessageResponse<VAAdditionalAttributes> = {
      answer: '', // messages will be generated based on the responses in additional attributes
      conversationId: newConversationId ?? TEMP_CONVERSATION_ID,
      messageId: crypto.randomUUID(), // VA does not return message IDs
      date: new Date(),
      additionalAttributes: {
        vaResponse: response.response,
      },
    };

    return clientResponse;
  }
}

export default VAClient;
