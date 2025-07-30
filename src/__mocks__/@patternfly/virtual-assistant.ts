// Mock for @patternfly/virtual-assistant to avoid react-jss ES module issues
import React from 'react';

// Mock UserMessageEntry component
export const UserMessageEntry = ({ children, icon, ...props }: any) => {
  return React.createElement(
    'div',
    {
      'data-testid': 'mock-user-message-entry',
      ...props,
    },
    children
  );
};

// Add other exports if needed
export default {
  UserMessageEntry,
};
