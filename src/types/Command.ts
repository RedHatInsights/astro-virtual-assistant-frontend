export enum CommandType {
  FINISH_CONVERSATION = 'core_finish_conversation',
  PERSONAL_INFORMATION_REDIRECT = 'personal_information_redirect',
  PASSWORD_REDIRECT = 'password_redirect',
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

export interface PersonalInformationRedirectCommand extends BaseCommand {
  type: CommandType.PERSONAL_INFORMATION_REDIRECT;
}

export interface PasswordRedirectCommand extends BaseCommand {
  type: CommandType.PASSWORD_REDIRECT;
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

export type Command = FinishConversationCommand | PersonalInformationRedirectCommand | PasswordRedirectCommand | TourStartCommand | FeedbackCommand;
