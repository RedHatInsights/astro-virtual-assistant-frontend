import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';

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

export const postTalk = async (message: string) => {
  return axiosInstance.post<unknown, Array<PostTalkResponse>>('/api/virtual-assistant/v1/talk', {
    message,
  });
};
