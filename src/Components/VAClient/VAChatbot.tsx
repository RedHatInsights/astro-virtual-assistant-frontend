import React from 'react';

import UniversalChatbot from '../UniversalChatbot/UniversalChatbot';
import { ChatbotProps } from '../UniversalChatbot/UniversalChatbotProvider';
import VAMessageEntry from './VAMessageEntry';

const VAChatbot = (props: ChatbotProps) => {
  return <UniversalChatbot {...props} MessageEntryComponent={VAMessageEntry} />;
};

export default VAChatbot;
