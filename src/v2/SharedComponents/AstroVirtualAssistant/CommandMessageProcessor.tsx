import { CommandType } from '../../types/Command';
import { MessageProcessor } from '../../Components/Message/MessageProcessor';
import { From } from '../../types/Message';
import { feedbackCommandProcessor } from './CommandProcessor/FeedbackCommandProcessor';
import { thumbsCommandProcessor } from './CommandProcessor/ThumbsCommandProcessor';
import { manageOrg2FaCommandProcessor } from './CommandProcessor/ManageOrg2FaProcessor';
import { createServiceAccProcessor } from './CommandProcessor/CreateServiceAccProcessor';

const CONSOLE_TOUR_ID = '60TJ9PZKMXQ9tDS-WC6bMr46C-U';

const openInNewTab = (url: string, isPreview: boolean) => {
  setTimeout(() => {
    if (url && url.startsWith('/')) {
      if (isPreview) {
        url = `/preview${url}`;
      }
      url = `${window.location.origin}${url}`;
    }

    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;
  }, 3000);
};

const startPendoGuide = (tourId: string) => {
  if (window.pendo) {
    window?.pendo?.showGuideById(tourId);
  }
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
          openInNewTab(message.command.params.url, options.isPreview);
          options.addSystemMessage('redirect_message', [message.command.params.url]);
        }
        break;
      case CommandType.TOUR_START:
        startPendoGuide(CONSOLE_TOUR_ID);
        break;
      case CommandType.FEEDBACK_MODAL:
        options.toggleFeedbackModal(true);
        break;
      case CommandType.FEEDBACK:
        await feedbackCommandProcessor(message.command);
        break;
      case CommandType.MANAGE_ORG_2FA:
        try {
          const response = await manageOrg2FaCommandProcessor(message.command, options);
          if (response.status > 299) {
            options.addBanner('toggle_org_2fa_failed', [message.command.params.enable_org_2fa]);
          } else {
            options.addBanner('toggle_org_2fa', [message.command.params.enable_org_2fa]);
          }
        } catch (error) {
          options.addBanner('toggle_org_2fa_failed', [message.command.params.enable_org_2fa]);
        }
        break;
      case CommandType.CREATE_SERVICE_ACCOUNT: {
        try {
          const serviceAccInfo = await createServiceAccProcessor(message.command, options);
          options.addBanner('create_service_account', [
            serviceAccInfo.name,
            serviceAccInfo.description,
            serviceAccInfo.clientId,
            serviceAccInfo.secret,
          ]);
        } catch (error) {
          options.addBanner('create_service_account_failed', []);
        }
        break;
      }
      case CommandType.THUMBS:
        thumbsCommandProcessor(message.command, options);
    }
  }
};
