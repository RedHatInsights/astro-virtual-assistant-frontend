import { CommandType } from '../../types/Command';
import { MessageProcessor } from '../../Components/Message/MessageProcessor';
import { From } from '../../types/Message';
import { feedbackCommandProcessor } from './CommandProcessor/FeedbackCommandProcessor';
import { thumbsCommandProcessor } from './CommandProcessor/ThumbsCommandProcessor';

const openInNewTab = (url: string) => {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) newWindow.opener = null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const startPendoTour = (tourId: string) => {
  // TODO: Pendo tour
};

export const commandMessageProcessor: MessageProcessor = async (message, options) => {
  if (message.from === From.ASSISTANT && message.command) {
    switch (message.command.type) {
      case CommandType.FINISH_CONVERSATION:
        options.addSystemMessage('finish_conversation_message', []);
        options.addBanner('finish_conversation_banner', []);
        break;
      case CommandType.REDIRECT:
        if (message.command.params.url) {
          openInNewTab(message.command.params.url);
          options.addSystemMessage('redirect_message', [message.command.params.url]);
        }
        break;
      case CommandType.TOUR_START:
        startPendoTour('tourId');
        break;
      case CommandType.FEEDBACK_MODAL:
        options.toggleFeedbackModal(true);
        break;
      case CommandType.FEEDBACK:
        await feedbackCommandProcessor(message.command);
        break;
      case CommandType.THUMBS:
        thumbsCommandProcessor(message.command, options);
    }
  }
};
