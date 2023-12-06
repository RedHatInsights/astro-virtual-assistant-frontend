import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';

export interface PostFeedbackRequest {
  summary: string;
  description: string;
  labels: Array<string>;
}

export const postFeedback = async (request: PostFeedbackRequest) => {
  return axiosInstance.post('/api/platform-feedback/v1/issues', request);
};
