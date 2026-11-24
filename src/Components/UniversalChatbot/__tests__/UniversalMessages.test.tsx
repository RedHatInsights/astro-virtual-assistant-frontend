import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UniversalMessages from '../UniversalMessages';
import { useActiveConversation, useInitLimitation, useIsInitializing, useMessages, useSendMessage } from '@redhat-cloud-services/ai-react-state';
import useArhMessageQuota from '../../ARHClient/useArhMessageQuota';
import * as preview from '../../MASClient/ComponentPreview';
import { getModule } from '@scalprum/core';

// Mock hooks used by UniversalMessages
const mockUseMessages = useMessages as jest.MockedFunction<typeof useMessages>;
const mockUseInitLimitation = useInitLimitation as jest.MockedFunction<typeof useInitLimitation>;
const mockUseActiveConversation = useActiveConversation as jest.MockedFunction<typeof useActiveConversation>;
const mockUseIsInitializing = useIsInitializing as jest.MockedFunction<typeof useIsInitializing>;
const mockUseSendMessage = useSendMessage as jest.MockedFunction<typeof useSendMessage>;
const mockUseArhMessageQuota = useArhMessageQuota as jest.MockedFunction<typeof useArhMessageQuota>;

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useMessages: jest.fn(),
  useInitLimitation: jest.fn(),
  useActiveConversation: jest.fn(),
  useIsInitializing: jest.fn(),
  useSendMessage: jest.fn(),
  useCreateNewConversation: jest.fn(() => jest.fn()),
}));

// Mock PatternFly components
jest.mock('@patternfly/chatbot', () => ({
  ChatbotContent: ({ children }: { children: React.ReactNode }) => <div data-testid="chatbot-content">{children}</div>,
  MessageBox: ({ children }: { children: React.ReactNode }) => <div data-testid="message-box">{children}</div>,
  ChatbotWelcomePrompt: ({ title, description, content }: any) => (
    <div data-testid="welcome-prompt">
      <div data-testid="welcome-title">{title}</div>
      <div data-testid="welcome-description">{description}</div>
      <div data-testid="welcome-content">{content}</div>
    </div>
  ),
  Message: ({ content, role, extraContent, timestamp }: any) => (
    <div data-testid={`message-${role}`} data-timestamp={timestamp}>
      {content}
      {extraContent?.afterMainContent}
    </div>
  ),
}));

jest.mock('@scalprum/core', () => ({ getModule: jest.fn() }));
jest.mock('../../MASClient/MASAgentStatusPanel', () => () => null);

jest.mock('@patternfly/react-core', () => ({
  Bullseye: ({ children }: { children: React.ReactNode }) => <div data-testid="bullseye">{children}</div>,
  Spinner: () => <div data-testid="spinner">Loading...</div>,
  Alert: ({ children, ...props }: any) => (
    <div data-testid="alert" {...props}>
      {children}
    </div>
  ),
}));

// Mock ARH hooks
jest.mock('../../ARHClient/useArhMessageQuota', () => jest.fn());

// Mock UniversalBanner component
jest.mock('../UniversalBanner', () => ({
  __esModule: true,
  default: function MockUniversalBanner(props: any) {
    return <div data-testid="universal-banner" {...props} />;
  },
}));

describe('UniversalMessages', () => {
  const defaultProps = {
    avatar: 'test-avatar.png',
    setIsBannerOpen: jest.fn(),
    isBannerOpen: false,
    scrollToBottomRef: React.createRef<HTMLDivElement>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock return values
    mockUseMessages.mockReturnValue([]);
    mockUseInitLimitation.mockReturnValue(undefined);
    mockUseActiveConversation.mockReturnValue({
      id: 'test-conversation',
      title: 'Test',
      messages: [],
      locked: false,
      createdAt: new Date(),
    } as any);
    mockUseIsInitializing.mockReturnValue(false);
    mockUseSendMessage.mockReturnValue(jest.fn());
    mockUseArhMessageQuota.mockReturnValue(undefined);
  });

  it('should render without crashing', () => {
    render(<UniversalMessages {...defaultProps} />);

    expect(screen.getByTestId('chatbot-content')).toBeInTheDocument();
  });

  it('should show spinner when useIsInitializing is true', () => {
    mockUseIsInitializing.mockReturnValue(true);

    render(<UniversalMessages {...defaultProps} />);

    expect(screen.getByTestId('bullseye')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('chatbot-content')).not.toBeInTheDocument();
  });

  it('should show chatbot content when not initializing', () => {
    mockUseIsInitializing.mockReturnValue(false);

    render(<UniversalMessages {...defaultProps} />);

    expect(screen.getByTestId('chatbot-content')).toBeInTheDocument();
    expect(screen.queryByTestId('bullseye')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('injects local replies into the real message list without trusting message attributes', async () => {
    jest.spyOn(preview, 'isComponentPreviewEnabled').mockReturnValue(true);
    const mockGetModule = getModule as jest.Mock;
    mockGetModule.mockImplementation(async (_scope: string, module: string, name: string) => {
      if (module === './bad') throw new Error('missing');
      return function PreviewExport() {
        return <div>{name}</div>;
      };
    });
    mockUseMessages.mockReturnValue([
      { id: 'server', role: 'bot', answer: 'Server response', date: new Date(), additionalAttributes: { scope: 'untrusted', module: './bad' } },
    ]);
    render(<UniversalMessages {...defaultProps} />);
    act(() => {
      for (const target of [
        { scope: 'demo', module: './Widget', props: '{}' },
        { scope: 'demo', module: './bad', props: '{}' },
        { scope: 'demo', module: './Widget', importName: 'Second', props: '{}' },
      ])
        window.dispatchEvent(new CustomEvent(preview.MAS_PREVIEW_EVENT, { detail: target }));
    });
    expect(await screen.findByText('default')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load');
    expect(await screen.findByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Server response')).toBeInTheDocument();
    expect(mockGetModule).toHaveBeenCalledTimes(3);
    jest.restoreAllMocks();
  });

  it('ignores preview events when the local preview is disabled', () => {
    jest.spyOn(preview, 'isComponentPreviewEnabled').mockReturnValue(false);
    const mockGetModule = getModule as jest.Mock;
    mockGetModule.mockClear();
    render(<UniversalMessages {...defaultProps} />);
    act(() => window.dispatchEvent(new CustomEvent(preview.MAS_PREVIEW_EVENT, { detail: { scope: 'test', module: './Widget' } })));
    expect(mockGetModule).not.toHaveBeenCalled();
    expect(screen.queryByText('Local component preview')).not.toBeInTheDocument();
    jest.restoreAllMocks();
  });

  it('keeps each preview timestamp when later replies arrive', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    jest.spyOn(preview, 'isComponentPreviewEnabled').mockReturnValue(true);
    (getModule as jest.Mock).mockImplementation(() => new Promise(() => undefined));
    render(<UniversalMessages {...defaultProps} />);
    const send = () => window.dispatchEvent(new CustomEvent(preview.MAS_PREVIEW_EVENT, { detail: { scope: 'demo', module: './Widget' } }));
    act(send);
    const firstTimestamp = screen.getByTestId('message-bot').getAttribute('data-timestamp');
    jest.setSystemTime(new Date('2026-01-01T01:00:00Z'));
    act(send);
    const replies = screen.getAllByTestId('message-bot');
    expect(replies[0]).toHaveAttribute('data-timestamp', firstTimestamp);
    expect(replies[1].getAttribute('data-timestamp')).not.toEqual(firstTimestamp);
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
});
