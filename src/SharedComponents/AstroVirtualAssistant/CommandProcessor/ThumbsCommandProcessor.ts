import { ThumbsCommand } from '../../../types/Command';
import { MessageProcessorOptions } from '../../../Components/Message/MessageProcessor';

export const thumbsCommandProcessor = (command: ThumbsCommand, options: MessageProcessorOptions) => {
  options.addThumbMessage(command.params.thumbsUp, command.params.thumbsDown);
};
