import React from 'react';

// Mock state for testing
const mockConversations = [
  { id: 'conv-1', title: 'Test Conversation 1' },
  { id: 'conv-2', title: 'Test Conversation 2' },
];

const mockMessages = [
  {
    id: 'msg-1',
    role: 'user' as const,
    answer: 'Hello, how can I help?',
    additionalAttributes: {},
  },
  {
    id: 'msg-2',
    role: 'bot' as const,
    answer: 'I can help you with various tasks.',
    additionalAttributes: {
      sources: [
        {
          title: 'Red Hat Documentation',
          body: 'This is helpful documentation',
          link: 'https://docs.redhat.com',
        },
      ],
    },
  },
];

const mockActiveConversation = {
  id: 'conv-1',
  title: 'Test Conversation 1',
  locked: false,
};

// Mock provider
export const AIStateProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'ai-state-provider' }, children);
};

// Mock hooks
export const useConversations = jest.fn(() => mockConversations);
export const useCreateNewConversation = jest.fn(() => jest.fn().mockResolvedValue(undefined));
export const useIsInitializing = jest.fn(() => false);
export const useSetActiveConversation = jest.fn(() => jest.fn());
export const useActiveConversation = jest.fn(() => mockActiveConversation);
export const useMessages = jest.fn(() => mockMessages);
export const useInProgress = jest.fn(() => false);
export const useSendMessage = jest.fn(() => jest.fn());

// Allow mocking different states for tests
export const __setMockState = (overrides: any) => {
  if (overrides.conversations) useConversations.mockReturnValue(overrides.conversations);
  if (overrides.messages) useMessages.mockReturnValue(overrides.messages);
  if (overrides.activeConversation) useActiveConversation.mockReturnValue(overrides.activeConversation);
  if (overrides.isInitializing !== undefined) useIsInitializing.mockReturnValue(overrides.isInitializing);
  if (overrides.inProgress !== undefined) useInProgress.mockReturnValue(overrides.inProgress);
};

export const __resetMocks = () => {
  useConversations.mockReturnValue(mockConversations);
  useMessages.mockReturnValue(mockMessages);
  useActiveConversation.mockReturnValue(mockActiveConversation);
  useIsInitializing.mockReturnValue(false);
  useInProgress.mockReturnValue(false);
};
