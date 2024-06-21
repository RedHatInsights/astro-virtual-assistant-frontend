import React, { FunctionComponent } from 'react';
import { MessageProps } from './MessageProps';
import { Banner } from '../../types/Message';
import { ConversationEndBanner } from '../Banners/ConversationEndBanner';
import { CreateServiceAccBanner, CreateServiceAccFailedBanner } from '../Banners/CreateServiceAccBanner';

export const BannerEntry: FunctionComponent<MessageProps<Banner>> = ({ message }) => {
  return (
    <>
      {message.type === 'finish_conversation_banner' && <ConversationEndBanner message={message} />}
      {message.type == 'create_service_account' && <CreateServiceAccBanner message={message} />}
      {message.type == 'create_service_account_failed' && <CreateServiceAccFailedBanner message={message} />}
    </>
  );
};
