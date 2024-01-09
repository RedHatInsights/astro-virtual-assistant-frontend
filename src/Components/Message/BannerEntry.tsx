import React, { FunctionComponent } from 'react';
import { MessageProps } from './MessageProps';
import { Banner } from '../../types/Message';
import { ConversationEndBanner } from '../Banners/ConversationEndBanner';

export const BannerEntry: FunctionComponent<MessageProps<Banner>> = ({ message }) => {
  return <>{message.type === 'finish_conversation_banner' && <ConversationEndBanner message={message} />}</>;
};
