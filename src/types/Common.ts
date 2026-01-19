import { ChromeAPI } from '@redhat-cloud-services/types';
import { AssistantMessage, FeedbackMessage } from './Message';

export enum EnvType {
  STAGE = 'stage',
  PROD = 'prod',
}

export type MessageProcessor = (message: AssistantMessage | FeedbackMessage, options: MessageProcessorOptions) => Promise<void>;

export type MessageProcessorOptions = {
  toggleFeedbackModal: (isOpen: boolean) => void;
  addSystemMessage: (systemMessageType: string, additionalContent: Array<string>) => void;
  addBanner: (bannerType: string, additionalContent: Array<string>) => void;
  addThumbMessage: () => void;
  isPreview: boolean;
  auth: ChromeAPI['auth'];
};
