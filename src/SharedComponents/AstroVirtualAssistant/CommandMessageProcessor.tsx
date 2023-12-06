import { CommandType } from '../../types/Command';
import { MessageProcessor } from '../../Components/Message/MessageProcessor';
import { From } from '../../types/Message';
import { feedbackCommandProcessor } from './CommandProcessor/FeedbackCommandProcessor';

const PERSONAL_INFORMATION_URL = 'https://www.redhat.com/wapps/ugc/protected/personalInfo.html';
const PASSWORD_URL = 'https://www.redhat.com/wapps/ugc/protected/password.html';
type Url = typeof PERSONAL_INFORMATION_URL | typeof PASSWORD_URL;

const openInNewTab = (url: Url) => {
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
      case CommandType.PERSONAL_INFORMATION_REDIRECT:
        openInNewTab(PERSONAL_INFORMATION_URL);
        break;
      case CommandType.PASSWORD_REDIRECT:
        openInNewTab(PASSWORD_URL);
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
