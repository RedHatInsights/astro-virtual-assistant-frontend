import { MessageProcessorOptions } from '../../../types/Common';

export const thumbsCommandProcessor = (args: Record<string, string>, options: MessageProcessorOptions) => {
  options.addThumbMessage();
};
