import { AxiosRequestConfig } from 'axios';
import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/interceptors/interceptors';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

export interface PostManageOrg2faRequest {
  enable_org_2fa: boolean;
}

export const postManageOrg2fa = async (request: PostManageOrg2faRequest) => {
  const chrome = useChrome()
  const token = await chrome.auth.getToken()

  const headers = {
    'Content-Type':'application/json',
    'Authorization': `Bearer ${token}`
  }

  const config: AxiosRequestConfig = {
    headers: headers
  }

  const reqBody = {"authenticationFactors":{"otp":{"required": request.enable_org_2fa}}}

  return axiosInstance.post('https://sso.stage.redhat.com/auth/realms/redhat-external/apis/organizations/v1/my/authentication-policy', reqBody, config);
};
