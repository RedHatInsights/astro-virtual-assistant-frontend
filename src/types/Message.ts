import { Command } from './Command';

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

export interface MessageOption {
  title: string;
  payload: string;
}

// Brand Assistant
export interface AssistantMessage extends BaseMessage {
  messageId: string;
  from: From.ASSISTANT;
  options?: Array<MessageOption>;
  command?: Command;
  isLoading: boolean;
}

// Brand User
export interface UserMessage extends BaseMessage {
  from: From.USER;
}

// Brand feedback
export interface FeedbackMessage extends BaseMessage {
  messageId: string;
  from: From.FEEDBACK;
  isLoading: boolean;
}

export type Message = AssistantMessage | UserMessage | FeedbackMessage;
