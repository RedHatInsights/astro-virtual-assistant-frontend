import { CreateServiceAcc } from '../../../types/Command';
import { postCreateServiceAcc } from '../../../api/PostCreateServiceAccount';
import { MessageProcessorOptions } from '../../../Components/Message/MessageProcessor';

export const createServiceAccProcessor = async (command: CreateServiceAcc, options: MessageProcessorOptions) => {
  return await postCreateServiceAcc(command.params, options.auth);
};
