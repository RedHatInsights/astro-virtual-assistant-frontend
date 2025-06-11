import { EnvType } from '../../../types/Common';
import { PostManageOrg2faRequest, postManageOrg2fa } from '../../../api/PostManage2fa';
import { MessageProcessorOptions } from '../../../Components/Message/MessageProcessor';

export const manageOrg2FaCommandProcessor = async (args: Record<string, string>, options: MessageProcessorOptions) => {
  const requestPayload: PostManageOrg2faRequest = {
    enable_org_2fa: args.enable_org_2fa,
    environment: args.environment as EnvType,
  };
  return await postManageOrg2fa(requestPayload, options.auth);
};
