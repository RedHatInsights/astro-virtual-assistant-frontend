import { AxiosRequestConfig } from 'axios';
import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';
import { ChromeAPI } from '@redhat-cloud-services/types';

export enum EnvType {
  STAGE = 'stage',
  PROD = 'prod',
}

export interface PostManageOrg2faRequest {
  enable_org_2fa: boolean;
  environment: EnvType;
}

export const postManageOrg2fa = async (request: PostManageOrg2faRequest, auth: ChromeAPI['auth']) => {
  const token = await auth.getToken();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const config: AxiosRequestConfig = {
    headers: headers,
  };

  const reqBody = { authenticationFactors: { otp: { required: request.enable_org_2fa } } };

  let url = 'https://sso.stage.redhat.com/auth/realms/redhat-external/apis/organizations/v1/my/authentication-policy';
  if (request.environment === EnvType.PROD) {
    url = 'https://sso.redhat.com/auth/realms/redhat-external/apis/organizations/v1/my/authentication-policy';
  }

  return axiosInstance.post(url, reqBody, config);
};
