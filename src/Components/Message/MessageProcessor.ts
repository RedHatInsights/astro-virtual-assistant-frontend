import { AssistantMessage, FeedbackMessage } from '../../types/Message';

export type MessageProcessor = (message: AssistantMessage | FeedbackMessage, toggleFeedbackModal: (isOpen: boolean) => void) => Promise<void>;
