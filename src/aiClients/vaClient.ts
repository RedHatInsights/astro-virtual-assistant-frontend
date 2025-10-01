import { IAIClient, IConversation, IConversationMessage, IMessageResponse, ISendMessageOptions } from '@redhat-cloud-services/ai-client-common';
import {
  PostTalkResponseAPI,
  ResponseOptions,
  ResponseText,
  Response as VAResponse,
  isResponseOptions,
  isResponseText,
  postTalk,
} from '../api/PostTalk';
import { WelcomeButton, WelcomeConfig } from './types';

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
  private _isInitialized = false;
  private _isInitializing = false;
  private initialApiResponse: PostTalkResponseAPI | null = null;
  async createNewConversation(): Promise<IConversation> {
    // VA does not manage conversations
    return {
      createdAt: new Date(),
      id: this.sessionId,
      locked: false,
      title: 'Virtual Assistant',
    };
  }

  public async getConversationHistory(conversationId: string): Promise<any> {
    return [];
  }
  healthCheck(): Promise<unknown> {
    throw new Error('Method not implemented.');
  }

  async init() {
    if (this._isInitialized || this._isInitializing) {
      return {
        conversations: [await this.createNewConversation()],
      };
    }

    this._isInitializing = true;

    try {
      // VA initializes with a postTalk set message and empty session ID
      const response = await postTalk('/session_start');
      console.log('VA Client - initialization response:', response);

      // response usually has introduction message and potentially options
      // it also contains the session_id that maps to conversation ID
      // we will use promotion mechanism to show this message
      if (response.response.length === 0) {
        throw new Error('Failed to initialize VA session - no responses');
      }

      this.sessionId = response.session_id;
      this.initialApiResponse = response;

      this._isInitialized = true;
      this._isInitializing = false;

      // Create the initial conversation
      const initialConversation: IConversation = {
        createdAt: new Date(),
        id: this.sessionId,
        locked: false,
        title: 'Virtual Assistant',
      };

      return {
        conversations: [initialConversation],
      };
    } catch (error) {
      this._isInitializing = false;
      throw error;
    }
  }

  getWelcomeConfig(): WelcomeConfig {
    if (!this._isInitialized || !this.initialApiResponse) {
      // Return empty config to let useVaManager handle the default content
      return {
        buttons: [],
      };
    }

    let content = '';
    let buttons: WelcomeButton[] = [];

    // Process all responses to extract content and buttons
    for (const response of this.initialApiResponse.response) {
      if (isResponseText(response)) {
        // Accumulate text content
        content = content ? `${content}\n\n${response.text}` : response.text;
      } else if (isResponseOptions(response)) {
        // Add options text if present
        if (response.text) {
          content = content ? `${content}\n\n${response.text}` : response.text;
        }

        // Convert PostTalkOptions to WelcomeButtons
        buttons = response.options.map((option) => ({
          title: option.text,
          value: option.option_id ? `OPTION_ID:${option.option_id}` : option.value, // Prefix option_id to distinguish it
          message: option.text !== option.value ? option.value : undefined, // Show value as subtitle if different from text
        }));
      }
    }

    const result = {
      content,
      buttons,
    };

    return result;
  }

  // Methods for state manager integration
  isInitialized() {
    return this._isInitialized;
  }

  isInitializing() {
    return this._isInitializing;
  }

  // conversation maps to session ID
  async sendMessage(conversationId: string, text: string, options?: VASendMessageOptions) {
    let actualText = text;
    let option_id = options?.requestPayload?.optionId;

    // Handle special option ID format from welcome buttons
    if (text.startsWith('OPTION_ID:')) {
      option_id = text.replace('OPTION_ID:', '');
      actualText = ''; // When using option_id, typically no text is sent
    }

    const response = await postTalk(actualText, option_id, conversationId === TEMP_CONVERSATION_ID ? undefined : conversationId);

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
