import { MessageProcessorOptions } from '../../../Components/Message/MessageProcessor';

export const thumbsCommandProcessor = (args: Record<string, string>, options: MessageProcessorOptions) => {
  options.addThumbMessage();
};
