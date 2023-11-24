import { FINISH_CONVERSATION, PASSWORD_REDIRECT, PERSONAL_INFORMATION_REDIRECT, TOUR_START } from '../../types/Command';
import { MessageProcessor } from '../../Components/Message/MessageProcessor';
import { From } from '../../types/Message';

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
    switch (message.command) {
      case FINISH_CONVERSATION:
        finishConversation();
        break;
      case PERSONAL_INFORMATION_REDIRECT:
        openInNewTab(PERSONAL_INFORMATION_URL);
        break;
      case PASSWORD_REDIRECT:
        openInNewTab(PASSWORD_URL);
        break;
      case TOUR_START:
        startPendoTour('tourId');
        break;
    }
  }
};
