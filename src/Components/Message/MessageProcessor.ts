import { AssistantMessage, FeedbackMessage } from '../../types/Message';

export type MessageProcessor = (message: AssistantMessage | FeedbackMessage) => Promise<void>;
