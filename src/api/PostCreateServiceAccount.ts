import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';
import { ChromeAPI } from '@redhat-cloud-services/types';

import { EnvType } from '../types/Common';

export interface PostCeateServiceAccRequest {
  name: string;
  description: string;
  environment: EnvType;
}

export interface PostCreateServiceAccountResponse {
  name: string;
  description: string;
  clientId: string;
  secret: string;
}

export const postCreateServiceAcc = async (request: PostCeateServiceAccRequest, auth: ChromeAPI['auth']) => {
  const token = await auth.getToken();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const reqBody = { name: request.name, description: request.description };

  let url = 'https://sso.stage.redhat.com/auth/realms/redhat-external/apis/service_accounts/v1';
  if (request.environment === EnvType.PROD) {
    url = 'https://sso.redhat.com/auth/realms/redhat-external/apis/service_accounts/v1';
  }

  return axiosInstance.post<unknown, PostCreateServiceAccountResponse>(url, reqBody, {
    headers: headers,
  });
};
