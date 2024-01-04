export enum CommandType {
  REDIRECT = 'redirect',
  FINISH_CONVERSATION = 'core_finish_conversation',
  TOUR_START = 'tour_start',
  FEEDBACK = 'feedback',
}

interface BaseCommand {
  type: unknown;
  params: unknown;
}

export interface FinishConversationCommand extends BaseCommand {
  type: CommandType.FINISH_CONVERSATION;
}

export interface RedirectCommand extends BaseCommand {
  type: CommandType.REDIRECT;
  params: {
    url: string;
  };
}

export interface TourStartCommand extends BaseCommand {
  type: CommandType.TOUR_START;
}

export interface FeedbackCommand extends BaseCommand {
  type: CommandType.FEEDBACK;
  params: {
    summary: string;
    description: string;
    labels: Array<string>;
  };
}

export type Command = FinishConversationCommand | RedirectCommand | TourStartCommand | FeedbackCommand;
