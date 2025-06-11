export enum CommandType {
  REDIRECT = 'redirect',
  FINISH_CONVERSATION = 'core_finish_conversation',
  TOUR = 'tour',
  FEEDBACK_MODAL = 'feedback_modal',
  FEEDBACK = 'feedback',
  THUMBS = 'thumbs',
  MANAGE_ORG_2FA = 'manage_org_2fa',
  CREATE_SERVICE_ACCOUNT = 'create_service_account',
}

export const CommandArgsMap: Record<CommandType, string[]> = {
  [CommandType.FINISH_CONVERSATION]: [],
  [CommandType.REDIRECT]: ['url'],
  [CommandType.TOUR]: ['name'],
  [CommandType.FEEDBACK_MODAL]: [],
  [CommandType.FEEDBACK]: ['summary', 'description', 'labels'],
  [CommandType.MANAGE_ORG_2FA]: ['enable_org_2fa', 'environment'],
  [CommandType.CREATE_SERVICE_ACCOUNT]: ['name', 'description', 'environment'],
  [CommandType.THUMBS]: ['rating'],
};

interface BaseCommand {
  type: unknown;
  params: {
    args: string[];
  };
}

export interface FinishConversationCommand extends BaseCommand {
  type: CommandType.FINISH_CONVERSATION;
}

export interface RedirectCommand extends BaseCommand {
  type: CommandType.REDIRECT;
}

export interface TourCommand extends BaseCommand {
  type: CommandType.TOUR;
}

export interface FeedbackModalCommand extends BaseCommand {
  type: CommandType.FEEDBACK_MODAL;
}

export interface FeedbackCommand extends BaseCommand {
  type: CommandType.FEEDBACK;
}

export interface ManageOrg2Fa extends BaseCommand {
  type: CommandType.MANAGE_ORG_2FA;
}

export interface CreateServiceAcc extends BaseCommand {
  type: CommandType.CREATE_SERVICE_ACCOUNT;
}

export interface ThumbsCommand extends BaseCommand {
  type: CommandType.THUMBS;
}

export type Command =
  | FinishConversationCommand
  | RedirectCommand
  | TourCommand
  | FeedbackCommand
  | FeedbackModalCommand
  | ThumbsCommand
  | ManageOrg2Fa
  | CreateServiceAcc;
