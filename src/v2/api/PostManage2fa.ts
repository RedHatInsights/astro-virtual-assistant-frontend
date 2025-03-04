import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';
import { ChromeAPI } from '@redhat-cloud-services/types';

import { EnvType } from '../types/Common';

export interface PostManageOrg2faRequest {
  enable_org_2fa: string;
  environment: EnvType;
}

export const postManageOrg2fa = async (request: PostManageOrg2faRequest, auth: ChromeAPI['auth']) => {
  const token = await auth.getToken();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  let enable_org_2fa_bool = true;
  if (request.enable_org_2fa === 'false') {
    enable_org_2fa_bool = false;
  }

  const reqBody = { authenticationFactors: { otp: { required: enable_org_2fa_bool } } };

  let url = 'https://sso.stage.redhat.com/auth/realms/redhat-external/apis/organizations/v1/my/authentication-policy';
  if (request.environment === EnvType.PROD) {
    url = 'https://sso.redhat.com/auth/realms/redhat-external/apis/organizations/v1/my/authentication-policy';
  }

  return axiosInstance.post(url, reqBody, {
    headers: headers,
  });
};
