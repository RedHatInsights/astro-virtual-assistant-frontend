export enum From {
  ASSISTANT = 'assistant',
  USER = 'user',
  FEEDBACK = 'feedback',
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

// Brand feedback
export interface FeedbackMessage extends BaseMessage {
  from: From.FEEDBACK;
  isLoading: boolean;
}

export type Message = AssistantMessage | UserMessage | FeedbackMessage;
