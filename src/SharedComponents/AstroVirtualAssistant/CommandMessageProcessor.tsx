import { CommandType } from '../../types/Command';
import { MessageProcessor } from '../../Components/Message/MessageProcessor';
import { From } from '../../types/Message';
import { feedbackCommandProcessor } from './CommandProcessor/FeedbackCommandProcessor';

const openInNewTab = (url: string) => {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) newWindow.opener = null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const startPendoTour = (tourId: string) => {
  // TODO: Pendo tour
};

const finishConversation = (): void => {
  // TODO: finish conversation; load banner
};

export const commandMessageProcessor: MessageProcessor = async (message) => {
  if (message.from === From.ASSISTANT && message.command) {
    switch (message.command.type) {
      case CommandType.FINISH_CONVERSATION:
        finishConversation();
        break;
      case CommandType.REDIRECT:
        if (message.command.params.url) {
          openInNewTab(message.command.params.url);
        }
        break;
      case CommandType.TOUR_START:
        startPendoTour('tourId');
        break;
      case CommandType.FEEDBACK:
        await feedbackCommandProcessor(message.command);
        break;
    }
  }
};
