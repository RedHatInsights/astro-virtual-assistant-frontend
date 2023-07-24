export enum From {
  ASSISTANT = 'assistant',
  USER = 'user',
}

// Base
interface BaseMessage {
  from: unknown;
  content: string;
}

// Brand Assistant
export interface AssistantMessage extends BaseMessage {
  from: From.ASSISTANT;
  options?: Array<string>;
  isLoading: boolean;
}

// Brand User
export interface UserMessage extends BaseMessage {
  from: From.USER;
}

export type Message = AssistantMessage | UserMessage;
