import { FeedbackCommand } from '../../../types/Command';
import { postFeedback } from '../../../api/PostFeedback';

export const feedbackCommandProcessor = async (command: FeedbackCommand) => {
  return await postFeedback(command.params);
};
