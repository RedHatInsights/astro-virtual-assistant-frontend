import { PostFeedbackRequest, postFeedback } from '../../../api/PostFeedback';

export const feedbackCommandProcessor = async (args: Record<string, string>) => {
  const request: PostFeedbackRequest = {
    summary: args.summary,
    description: args.description,
    labels: args.labels ? args.labels.split(',') : [],
  };
  return await postFeedback(request);
};
