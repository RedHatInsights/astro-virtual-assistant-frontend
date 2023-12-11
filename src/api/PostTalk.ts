import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';

import { Metadata } from '../types/Metadata';

export interface PostTalkResponse {
  recipient_id: number;
  text: string;
  buttons?: Array<{
    title: string;
    payload: string;
  }>;
  custom?: CustomResponse;
}

export interface CustomResponse {
  type: string;
  command?: string;
  params?: object;
}

export const postTalk = async (message: string, metadata: Metadata) => {
  return axiosInstance.post<unknown, Array<PostTalkResponse>>('/api/virtual-assistant/v1/talk', {
    message,
    metadata,
  });
};
