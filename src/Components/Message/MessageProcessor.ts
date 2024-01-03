import { AssistantMessage, FeedbackMessage } from '../../types/Message';

export type MessageProcessor = (message: AssistantMessage | FeedbackMessage, options: MessageProcessorOptions) => Promise<void>;

export type MessageProcessorOptions = {
  toggleFeedbackModal: (isOpen: boolean) => void;
};
