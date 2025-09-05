import React from 'react';
import { ChatbotProps } from '../UniversalChatbot/UniversalChatbotProvider';
import UniversalChatbot from '../UniversalChatbot/UniversalChatbot';

const RHELChatBot = (props: ChatbotProps) => {
  return <UniversalChatbot {...props} />;
};

export default RHELChatBot;
