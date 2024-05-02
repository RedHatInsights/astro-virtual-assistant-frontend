import { ManageOrg2Fa } from '../../../types/Command';
import { postManageOrg2fa } from '../../../api/PostManage2fa';

export const manageOrg2FaCommandProcessor = async (command: ManageOrg2Fa) => {
  return await postManageOrg2fa(command.params);
};
