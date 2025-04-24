import { EnvType } from '../../../types/Common';
import { PostCeateServiceAccRequest, postCreateServiceAcc } from '../../../api/PostCreateServiceAccount';
import { MessageProcessorOptions } from '../../../Components/Message/MessageProcessor';

export const createServiceAccProcessor = async (args: Record<string, string>, options: MessageProcessorOptions) => {
  const requestPayload: PostCeateServiceAccRequest = {
    name: args.name,
    description: args.description,
    environment: args.environment as EnvType,
  };
  return await postCreateServiceAcc(requestPayload, options.auth);
};
