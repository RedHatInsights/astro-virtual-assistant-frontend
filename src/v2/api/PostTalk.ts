import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';

import { Metadata } from '../types/Metadata';

export interface ResponseText {
  channels?: string[] | null;
  text: string;
  type: 'TEXT';
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

export interface ResponseCommand {
  args: string[];
  channels?: string[];
  command: string;
  type: 'COMMAND';
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

export const postTalk = async (message: string, optionId: string | undefined, session_id: string | undefined, metadata: Metadata) => {
  return axiosInstance.post<unknown, PostTalkResponseAPI>('/api/virtual-assistant-v2/v2/talk', {
    input: {
      text: message,
      option_id: optionId,
    },
    session_id: session_id,
  });
};
