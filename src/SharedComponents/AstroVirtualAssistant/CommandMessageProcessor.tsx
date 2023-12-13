import { CommandType } from '../../types/Command';
import { MessageProcessor } from '../../Components/Message/MessageProcessor';
import { From } from '../../types/Message';
import { feedbackCommandProcessor } from './CommandProcessor/FeedbackCommandProcessor';

const PERSONAL_INFORMATION_URL = 'https://www.redhat.com/wapps/ugc/protected/personalInfo.html';
const PASSWORD_URL = 'https://www.redhat.com/wapps/ugc/protected/password.html';
const SUPPORT_URL =
  'https://access.redhat.com/support/cases/#/case/new/get-support?seSessionId=54f5e479-9bcd-4186-be3b-701fe7f900f1&product=Other&version=Unknown&caseCreate=true';
type Url = typeof PERSONAL_INFORMATION_URL | typeof PASSWORD_URL | typeof SUPPORT_URL;

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

export const commandMessageProcessor: MessageProcessor = async (message, toggleFeedbackModal: (isOpen: boolean) => void) => {
  console.log('commandMessageProcessor', message);
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
      case CommandType.SUPPORT_REDIRECT:
        openInNewTab(SUPPORT_URL);
        break;
      case CommandType.TOUR_START:
        startPendoTour('tourId');
        break;
      case CommandType.FEEDBACK_MODAL:
        console.log('feedback modal');
        toggleFeedbackModal(true);
        break;
      case CommandType.FEEDBACK:
        await feedbackCommandProcessor(message.command);
        break;
    }
  }
};
