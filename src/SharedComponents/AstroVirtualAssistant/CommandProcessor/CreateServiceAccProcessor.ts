import { CreateServiceAcc } from '../../../types/Command';
import { postCeateServiceAcc } from '../../../api/PostCreateServiceAccount';
import { MessageProcessorOptions } from '../../../Components/Message/MessageProcessor';

export const createServiceAccProcessor = async (command: CreateServiceAcc, options: MessageProcessorOptions) => {
  return await postCeateServiceAcc(command.params, options.auth);
};
