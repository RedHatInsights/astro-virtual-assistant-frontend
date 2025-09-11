import React from 'react';

import ARHFooter from './ARHFooter';
import ARHNewChatModal from './ARHNewChatModal';
import UniversalChatbot from '../UniversalChatbot/UniversalChatbot';
import ARHMessageEntry from './ARHMessageEntry';
import { ChatbotProps } from '../UniversalChatbot/UniversalChatbotProvider';

const ChromeConnector = (props: ChatbotProps) => {
  return (
    <UniversalChatbot {...props} MessageEntryComponent={ARHMessageEntry} FooterComponent={ARHFooter}>
      <ARHNewChatModal />
    </UniversalChatbot>
  );
};

export default ChromeConnector;
