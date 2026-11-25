import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UniversalMessages from '../UniversalMessages';
import { useActiveConversation, useInitLimitation, useIsInitializing, useMessages, useSendMessage } from '@redhat-cloud-services/ai-react-state';
import useArhMessageQuota from '../../ARHClient/useArhMessageQuota';
import * as debug from '../../MASClient/MASDebug';
import { getModule } from '@scalprum/core';
import MASMessageEntry from '../../MASClient/MASMessageEntry';
import { MAS_DEBUG_MESSAGE_EVENT } from '../../MASClient/MASDebug';

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

  it('ignores the removed arbitrary-component event even in debug mode', () => {
    jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
    render(<UniversalMessages {...defaultProps} isMas MessageEntryComponent={MASMessageEntry} />);
    act(() => window.dispatchEvent(new CustomEvent('mas-component-preview', { detail: { scope: 'demo', module: './Widget' } })));
    expect(getModule).not.toHaveBeenCalled();
    expect(screen.queryByText('Local component preview')).not.toBeInTheDocument();
    jest.restoreAllMocks();
  });

  it('retains debug replies while messages initialize', () => {
    jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
    mockUseIsInitializing.mockReturnValue(true);
    const { rerender } = render(<UniversalMessages {...defaultProps} isMas MessageEntryComponent={MASMessageEntry} />);
    act(() => window.dispatchEvent(new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail: { answer: 'Queued debug', turnId: 'turn', widgets: [] } })));
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    mockUseIsInitializing.mockReturnValue(false);
    rerender(<UniversalMessages {...defaultProps} isMas MessageEntryComponent={MASMessageEntry} />);
    expect(screen.getByText('Queued debug')).toBeInTheDocument();
    jest.restoreAllMocks();
  });

  it('removes the debug listener when unmounted', () => {
    jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
    const add = jest.spyOn(window, 'addEventListener');
    const remove = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<UniversalMessages {...defaultProps} isMas />);
    const listener = add.mock.calls.find((call: unknown[]) => call[0] === MAS_DEBUG_MESSAGE_EVENT)?.[1];
    expect(listener).toBeDefined();
    unmount();
    expect(remove).toHaveBeenCalledWith(MAS_DEBUG_MESSAGE_EVENT, listener);
    jest.restoreAllMocks();
  });

  it('renders live and debug widgets through the same contract path without trusting response coordinates', async () => {
    jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
    const sendMessage = jest.fn();
    mockUseSendMessage.mockReturnValue(sendMessage);
    const widget = {
      type: 'widget',
      widget: 'frontendStarterApp.HelloWorld',
      schemaVersion: '1.0',
      instanceId: 'hello-1',
      scope: 'evil',
      module: './evil',
      props: { text: 'Hello from MAS', runId: 'FooBar', scope: 'evil' },
    };
    const liveMessage = {
      id: 'live',
      role: 'bot' as const,
      answer: 'Live reply',
      date: new Date(),
      additionalAttributes: { widgets: [widget] },
    };
    const history = [liveMessage];
    mockUseMessages.mockReturnValue(history);
    (getModule as jest.Mock).mockImplementation(async (_scope: string, _module: string, name: string) =>
      name === 'getContract'
        ? () => ({ widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0' })
        : ({ input }: { input: { text: string; runId: string } }) => (
            <div>
              {input.text} {input.runId}
            </div>
          )
    );
    render(<UniversalMessages {...defaultProps} isMas MessageEntryComponent={MASMessageEntry} />);
    act(() =>
      window.dispatchEvent(new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail: { answer: 'Debug reply', turnId: 'debug-turn', widgets: [widget] } }))
    );
    expect(await screen.findAllByText('Hello from MAS FooBar')).toHaveLength(2);
    expect(screen.getByText('Live reply')).toBeInTheDocument();
    expect(screen.getByText('Debug reply')).toBeInTheDocument();
    expect(getModule).toHaveBeenCalledTimes(4);
    expect(getModule).toHaveBeenCalledWith('frontendStarterApp', './HelloWorld', 'getContract');
    expect(getModule).toHaveBeenCalledWith('frontendStarterApp', './HelloWorld', 'default');
    expect(history).toEqual([liveMessage]);
    expect(sendMessage).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('merges debug replies chronologically with subsequent live messages through the configured message entry', () => {
    jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
    const sendMessage = jest.fn();
    mockUseSendMessage.mockReturnValue(sendMessage);
    const before = { id: 'before', role: 'bot' as const, answer: 'Before', date: new Date() };
    const after = { id: 'after', role: 'bot' as const, answer: 'After', date: new Date() };
    const history = [before];
    Object.freeze(history);
    mockUseMessages.mockReturnValue(history);
    const Entry = ({ message }: { message: { answer: string } }) => <div data-testid="merged-entry">{message.answer}</div>;
    const { rerender } = render(<UniversalMessages {...defaultProps} isMas MessageEntryComponent={Entry} />);
    const sendDebug = (answer: string) =>
      act(() => window.dispatchEvent(new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail: { answer, turnId: 'debug-turn', widgets: [] } })));
    sendDebug('Debug 1');
    sendDebug('Debug 2');
    mockUseMessages.mockReturnValue([before, after]);
    rerender(<UniversalMessages {...defaultProps} isMas MessageEntryComponent={Entry} />);
    sendDebug('Debug 3');
    mockUseMessages.mockReturnValue([before, after, { ...after, id: 'last', answer: 'Last' }]);
    rerender(<UniversalMessages {...defaultProps} isMas MessageEntryComponent={Entry} />);
    expect(screen.getAllByTestId('merged-entry').map((element) => element.textContent)).toEqual([
      'Before',
      'Debug 1',
      'Debug 2',
      'After',
      'Debug 3',
      'Last',
    ]);
    expect(history).toEqual([before]);
    expect(sendMessage).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('isolates debug replies by conversation and ignores events outside MAS or without an active conversation', () => {
    jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
    const event = () =>
      window.dispatchEvent(new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail: { answer: 'Local debug', turnId: 'debug-turn', widgets: [] } }));
    const { rerender } = render(<UniversalMessages {...defaultProps} isMas />);
    act(event);
    expect(screen.getByText('Local debug')).toBeInTheDocument();
    mockUseActiveConversation.mockReturnValue({ id: 'other' } as any);
    rerender(<UniversalMessages {...defaultProps} isMas />);
    expect(screen.queryByText('Local debug')).not.toBeInTheDocument();
    rerender(<UniversalMessages {...defaultProps} isMas={false} />);
    act(event);
    rerender(<UniversalMessages {...defaultProps} isMas />);
    expect(screen.queryByText('Local debug')).not.toBeInTheDocument();
    mockUseActiveConversation.mockReturnValue(undefined);
    rerender(<UniversalMessages {...defaultProps} isMas />);
    act(event);
    mockUseActiveConversation.mockReturnValue({ id: 'test-conversation' } as any);
    rerender(<UniversalMessages {...defaultProps} isMas />);
    expect(screen.getAllByText('Local debug')).toHaveLength(1);
    jest.restoreAllMocks();
  });

  it('rejects malformed debug payloads and ignores debug events when disabled', () => {
    const enabled = jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { unmount } = render(<UniversalMessages {...defaultProps} isMas />);
    for (const detail of [
      null,
      {},
      { answer: 'bad', widgets: [] },
      { answer: 'bad', turnId: '', widgets: [] },
      { answer: 'bad', turnId: 'turn', widgets: [null] },
      { answer: 'bad', turnId: 'turn', widgets: [{ type: 'widget' }] },
    ]) {
      act(() => window.dispatchEvent(new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail })));
    }
    expect(log).toHaveBeenCalledTimes(6);
    expect(screen.queryByText('bad')).not.toBeInTheDocument();
    unmount();
    enabled.mockReturnValue(false);
    render(<UniversalMessages {...defaultProps} isMas />);
    act(() => window.dispatchEvent(new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail: { answer: 'disabled', turnId: 'debug-turn', widgets: [] } })));
    expect(screen.queryByText('disabled')).not.toBeInTheDocument();
    jest.restoreAllMocks();
  });

  it('ignores invalid widgets and never loads widgets from user messages', () => {
    const widget = { type: 'widget', widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0', instanceId: 'x', props: { runId: 'ok' } };
    mockUseMessages.mockReturnValue([
      { id: 'user', role: 'user', answer: 'User', date: new Date(), additionalAttributes: { widgets: [widget] } },
      {
        id: 'bot',
        role: 'bot',
        answer: 'Bot',
        date: new Date(),
        additionalAttributes: { widgets: [null, { ...widget, props: null }] },
      },
    ]);
    render(<UniversalMessages {...defaultProps} isMas MessageEntryComponent={MASMessageEntry} />);
    expect(getModule).not.toHaveBeenCalled();
  });
});
