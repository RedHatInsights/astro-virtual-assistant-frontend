import { CommandArgsMap, CommandType } from '../../types/Command';
import { MessageProcessor } from '../../Components/Message/MessageProcessor';
import { From } from '../../types/Message';
import { feedbackCommandProcessor } from './CommandProcessor/FeedbackCommandProcessor';
import { thumbsCommandProcessor } from './CommandProcessor/ThumbsCommandProcessor';
import { manageOrg2FaCommandProcessor } from './CommandProcessor/ManageOrg2FaProcessor';
import { createServiceAccProcessor } from './CommandProcessor/CreateServiceAccProcessor';

// in case we need more tours
const TOUR_DICT = {
  general: '60TJ9PZKMXQ9tDS-WC6bMr46C-U',
};

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

const commandArgsToDict = (type: CommandType, args: string[]) => {
  const keys = CommandArgsMap[type];
  return keys?.reduce((acc, key, index) => {
    acc[key] = args[index] || ''; // Default to an empty string if the argument is missing
    return acc;
  }, {} as Record<string, string>);
};

export const commandMessageProcessor: MessageProcessor = async (message, options) => {
  if (message.from === From.ASSISTANT && message.command) {
    const args = commandArgsToDict(message.command.type, message.command.params.args);

    switch (message.command.type) {
      case CommandType.FINISH_CONVERSATION:
        options.addSystemMessage('finish_conversation_message', []);
        options.addBanner('finish_conversation_banner', []);
        break;
      case CommandType.REDIRECT:
        if (!args.url) {
          console.error('URL is required for redirect command');
          return;
        }
        openInNewTab(args.url, options.isPreview);
        options.addSystemMessage('redirect_message', [args.url]);
        break;
      case CommandType.TOUR: {
        const name = args.name as keyof typeof TOUR_DICT;
        if (name in TOUR_DICT) {
          startPendoGuide(TOUR_DICT[name]);
        } else {
          console.error(`Unknown tour name: ${name}`);
        }
        break;
      }
      case CommandType.FEEDBACK_MODAL:
        options.toggleFeedbackModal(true);
        break;
      case CommandType.FEEDBACK:
        await feedbackCommandProcessor(args);
        break;
      case CommandType.MANAGE_ORG_2FA:
        try {
          const response = await manageOrg2FaCommandProcessor(args, options);
          if (response.status > 299) {
            options.addBanner('toggle_org_2fa_failed', [args.enable_org_2fa]);
          } else {
            options.addBanner('toggle_org_2fa', [args.enable_org_2fa]);
          }
        } catch (error) {
          options.addBanner('toggle_org_2fa_failed', [args.enable_org_2fa]);
        }
        break;
      case CommandType.CREATE_SERVICE_ACCOUNT: {
        try {
          const serviceAccInfo = await createServiceAccProcessor(args, options);
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
        thumbsCommandProcessor(args, options);
    }
  }
};
