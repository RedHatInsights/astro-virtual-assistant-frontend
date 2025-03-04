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
}

export type Response = ResponseText | ResponsePause | ResponseOptions | ResponseCommand;

export interface PostTalkResponseAPI {
  response: Response[];
  session_id: string;
}

export const postTalk = async (message: string, session_id: Metadata) => {
  return axiosInstance.post<unknown, PostTalkResponseAPI>('/api/virtual-assistant/v2/talk', {
    input: {
      text: message,
    },
    session_id: null,
  });
};
