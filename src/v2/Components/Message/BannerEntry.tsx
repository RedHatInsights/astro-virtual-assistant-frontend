import React, { FunctionComponent } from 'react';
import { MessageProps } from './MessageProps';
import { Banner } from '../../types/Message';
import { ConversationEndBanner } from '../Banners/ConversationEndBanner';
import { CreateServiceAccBanner, CreateServiceAccFailedBanner } from '../Banners/CreateServiceAccBanner';
import { ToggleOrg2FaBanner, ToggleOrg2FaFailedBanner } from '../Banners/ToggleOrg2Fa';
import { MessageTooLongBanner } from '../Banners/MessageTooLongBanner';

export const BannerEntry: FunctionComponent<MessageProps<Banner>> = ({ message }) => {
  return (
    <>
      {message.type === 'finish_conversation_banner' && <ConversationEndBanner message={message} />}
      {message.type == 'create_service_account' && <CreateServiceAccBanner message={message} />}
      {message.type == 'create_service_account_failed' && <CreateServiceAccFailedBanner message={message} />}
      {message.type == 'toggle_org_2fa' && <ToggleOrg2FaBanner message={message} />}
      {message.type == 'toggle_org_2fa_failed' && <ToggleOrg2FaFailedBanner message={message} />}
      {message.type == 'message_too_long' && <MessageTooLongBanner message={message} />}
    </>
  );
};
