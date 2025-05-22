import { EnvType } from '../../../types/Common';
import { PostCreateServiceAccRequest, postCreateServiceAcc } from '../../../api/PostCreateServiceAccount';
import { MessageProcessorOptions } from '../../../Components/Message/MessageProcessor';

export const createServiceAccProcessor = async (args: Record<string, string>, options: MessageProcessorOptions) => {
  if (options.auth === null || options.auth === undefined) {
    throw new Error('Auth is not defined');
  }
  const requestPayload: PostCreateServiceAccRequest = {
    name: args.name,
    description: args.description,
    environment: args.environment as EnvType,
  };
  return await postCreateServiceAcc(requestPayload, options.auth);
};
