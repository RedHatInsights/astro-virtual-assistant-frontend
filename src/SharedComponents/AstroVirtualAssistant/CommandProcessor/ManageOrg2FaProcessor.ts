import { ManageOrg2Fa } from '../../../types/Command';
import { postManageOrg2fa } from '../../../api/PostManage2fa';
import { MessageProcessorOptions } from '../../../Components/Message/MessageProcessor';

export const manageOrg2FaCommandProcessor = async (command: ManageOrg2Fa, options: MessageProcessorOptions) => {
  return await postManageOrg2fa(command.params, options.auth);
};
