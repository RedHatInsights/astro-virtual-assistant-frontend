import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';

interface PostTalkResponse {
  recipient_id: number;
  text: string;
}

export const postTalk = async (message: string) => {
  return axiosInstance.post<unknown, Array<PostTalkResponse>>('/api/virtual-assistant/talk', {
    message,
  });
};
