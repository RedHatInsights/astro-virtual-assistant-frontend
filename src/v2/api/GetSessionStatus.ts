import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';
import { SessionStatus } from '../types/Session';

export interface GetSessionStatusResponse {
  first_visit: boolean;
}

export const getSessionStatus = async (): Promise<SessionStatus> => {
  const response = await axiosInstance.get<unknown, GetSessionStatusResponse>('/api/virtual-assistant/v1/session/status');
  return {
    firstVisit: response.first_visit,
  };
};
