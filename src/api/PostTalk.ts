import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';

import { Metadata } from '../types/Metadata';
import { CommandType } from '../types/Command';

export interface ResponseText {
  channels?: string[] | null;
  text: string;
  type: 'TEXT';
}

export function isResponseText(response: Response): response is ResponseText {
  return response.type === 'TEXT';
}

export interface ResponsePause {
  channels?: string[];
  is_typing: boolean;
  time: number;
  type: 'PAUSE';
}

export interface ResponseOptions {
  channels?: string[];
  options: PostTalkOption[];
  options_type: string | null;
  text: string | null;
  type: 'OPTIONS';
}

export function isResponseOptions(response: Response): response is ResponseOptions {
  return response.type === 'OPTIONS';
}

export interface ResponseCommand {
  args: string[];
  channels?: string[];
  command: CommandType;
  type: 'COMMAND';
}

export function isResponseCommand(res: unknown): res is ResponseCommand {
  return (
    typeof res === 'object' &&
    res !== null &&
    (res as ResponseCommand).type === 'COMMAND' &&
    typeof (res as ResponseCommand).command === 'string' &&
    Array.isArray((res as ResponseCommand).args)
  );
}

export interface PostTalkOption {
  text: string;
  value: string;
  option_id: string | undefined;
}

export type Response = ResponseText | ResponsePause | ResponseOptions | ResponseCommand;

export interface PostTalkResponseAPI {
  response: Response[];
  session_id: string;
}

export const postTalk = async (message: string, optionId?: string | undefined, session_id?: string | undefined) => {
  return axiosInstance.post<unknown, PostTalkResponseAPI>('/api/virtual-assistant-v2/v2/talk', {
    input: {
      text: message,
      option_id: optionId,
    },
    session_id: session_id,
  });
};
