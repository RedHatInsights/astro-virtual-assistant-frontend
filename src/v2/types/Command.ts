import { EnvType } from './Common';

export enum CommandType {
  REDIRECT = 'redirect',
  FINISH_CONVERSATION = 'core_finish_conversation',
  TOUR_START = 'tour_start',
  FEEDBACK_MODAL = 'feedback_modal',
  FEEDBACK = 'feedback',
  THUMBS = 'thumbs',
  MANAGE_ORG_2FA = 'manage_org_2fa',
  CREATE_SERVICE_ACCOUNT = 'create_service_account',
  COMMAND = 'command',
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

export interface FeedbackModalCommand extends BaseCommand {
  type: CommandType.FEEDBACK_MODAL;
}

export interface FeedbackCommand extends BaseCommand {
  type: CommandType.FEEDBACK;
  params: {
    summary: string;
    description: string;
    labels: Array<string>;
  };
}

export interface ManageOrg2Fa extends BaseCommand {
  type: CommandType.MANAGE_ORG_2FA;
  params: {
    enable_org_2fa: string;
    environment: EnvType;
  };
}

export interface CreateServiceAcc extends BaseCommand {
  type: CommandType.CREATE_SERVICE_ACCOUNT;
  params: {
    name: string;
    description: string;
    environment: EnvType;
  };
}

export interface ThumbsCommand extends BaseCommand {
  type: CommandType.THUMBS;
}

export interface ResponseCommand extends BaseCommand {
  type: CommandType.COMMAND;
  params: {
    args: string[];
    channels?: string[];
    command: string;
  };
}

export type Command =
  | FinishConversationCommand
  | RedirectCommand
  | TourStartCommand
  | FeedbackCommand
  | FeedbackModalCommand
  | ThumbsCommand
  | ManageOrg2Fa
  | CreateServiceAcc
  | ResponseCommand;
