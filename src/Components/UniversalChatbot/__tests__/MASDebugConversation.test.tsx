import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { getModule, getScalprum } from '@scalprum/core';
import UniversalMessages from '../UniversalMessages';
import MASMessageEntry from '../../MASClient/MASMessageEntry';
import * as debug from '../../MASClient/MASDebug';
import { MAS_DEBUG_MESSAGE_EVENT } from '../../MASClient/MASDebug';
import { WidgetMeta } from '../../MASClient/types';

jest.unmock('@redhat-cloud-services/ai-react-state');
jest.unmock('@redhat-cloud-services/ai-client-state');
jest.mock('@scalprum/core', () => {
  const getModule = jest.fn();
  return {
    getModule,
    getScalprum: jest.fn(() => ({
      pluginStore: { getExposedModule: async (scope: string, module: string) => ({ getContract: await getModule(scope, module, 'getContract') }) },
    })),
  };
});
jest.mock('../../MASClient/MASAgentStatusPanel', () => () => null);
jest.mock('../UniversalBanner', () => () => null);
jest.mock('@patternfly/chatbot', () => ({
  ChatbotContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MessageBox: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChatbotWelcomePrompt: () => null,
  Message: ({ content, extraContent }: { content: string; extraContent?: { afterMainContent?: React.ReactNode } }) => (
    <div data-testid="entry">
      {content}
      {extraContent?.afterMainContent}
    </div>
  ),
}));

it('keeps debug replies out of the real manager and client while merging later replies and reloaded history', async () => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
  Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: jest.fn().mockReturnValue('generated-id') });
  const widget = { type: 'widget', widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0', instanceId: 'live', props: { runId: 'live-id' } };
  let hasLiveReply = false;
  const client = {
    getConversationHistory: jest.fn(async (id: string) =>
      id === 'one' && hasLiveReply
        ? [{ message_id: 'history-id', input: 'Live question', answer: 'Live reply', date: new Date(), additionalAttributes: { widgets: [widget] } }]
        : []
    ),
    sendMessage: jest.fn(async () => {
      hasLiveReply = true;
      return { messageId: 'live-id', conversationId: 'one', answer: 'Live reply', additionalAttributes: { widgets: [widget] } };
    }),
  };
  const manager = createClientStateManager(client as unknown as Parameters<typeof createClientStateManager>[0]);
  await manager.setActiveConversationId('one');
  const liveMeta: WidgetMeta[] = [];
  (getModule as jest.Mock).mockImplementation(async (_scope: string, _module: string, name: string) =>
    name === 'getContract'
      ? () => ({ widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0' })
      : ({ input, meta }: { input: { runId: string }; meta: WidgetMeta }) => {
          liveMeta.push(meta);
          return <span>Widget {input.runId}</span>;
        }
  );
  render(
    <AIStateProvider stateManager={manager}>
      <UniversalMessages
        avatar=""
        setIsBannerOpen={() => undefined}
        isBannerOpen={false}
        scrollToBottomRef={React.createRef()}
        isMas
        MessageEntryComponent={MASMessageEntry}
      />
    </AIStateProvider>
  );
  const historyReads = client.getConversationHistory.mock.calls.length;
  act(() => window.dispatchEvent(new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail: { answer: 'Debug reply', turnId: 'debug-turn', widgets: [] } })));
  expect(screen.getByText('Debug reply')).toBeInTheDocument();
  expect(manager.getActiveConversationMessages()).toEqual([]);
  expect(client.sendMessage).not.toHaveBeenCalled();
  expect(client.getConversationHistory).toHaveBeenCalledTimes(historyReads);

  await act(async () => {
    await manager.sendMessage('Live question', { stream: true });
  });
  expect(await screen.findByText('Widget live-id')).toBeInTheDocument();
  expect(liveMeta[0]).toEqual({ widget: widget.widget, schemaVersion: widget.schemaVersion, sessionId: 'one', instanceId: 'live' });
  expect(screen.getAllByTestId('entry').map((entry) => entry.textContent)).toEqual(['Debug reply', 'Live question', 'Live replyWidget live-id']);
  expect(manager.getActiveConversationMessages().map((message) => message.answer)).toEqual(['Live question', 'Live reply']);

  await act(async () => {
    await manager.setActiveConversationId('two');
  });
  expect(screen.queryByText('Debug reply')).not.toBeInTheDocument();
  await act(async () => {
    await manager.setActiveConversationId('one');
  });
  expect(await screen.findByText('Widget live-id')).toBeInTheDocument();
  expect(screen.getAllByTestId('entry').map((entry) => entry.textContent)).toEqual(['Debug reply', 'Live question', 'Live replyWidget live-id']);
  expect(manager.getActiveConversationMessages().map((message) => message.answer)).toEqual(['Live question', 'Live reply']);
  expect(client.sendMessage).toHaveBeenCalledTimes(1);
  jest.restoreAllMocks();
});

it('keeps the assistant answer and other widgets visible for a nested contract mismatch', async () => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
  const client = { getConversationHistory: jest.fn(async () => []), sendMessage: jest.fn() };
  const manager = createClientStateManager(client as unknown as Parameters<typeof createClientStateManager>[0]);
  await manager.setActiveConversationId('session');
  (getModule as jest.Mock).mockImplementation(async (_scope: string, _module: string, name: string) =>
    name === 'getContract' ? () => ({ widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0' }) : () => <span>Working widget</span>
  );
  render(
    <AIStateProvider stateManager={manager}>
      <UniversalMessages
        avatar=""
        setIsBannerOpen={() => undefined}
        isBannerOpen={false}
        scrollToBottomRef={React.createRef()}
        isMas
        MessageEntryComponent={MASMessageEntry}
      />
    </AIStateProvider>
  );
  const widget = { type: 'widget', widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0', instanceId: 'one', props: {} };
  act(() =>
    window.dispatchEvent(
      new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, {
        detail: {
          answer: 'Answer remains',
          turnId: 'turn',
          widgets: [
            { ...widget, widget: 'frontendStarterApp.widgets/HelloWorld' },
            { ...widget, instanceId: 'two' },
          ],
        },
      })
    )
  );
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Requested by message: frontendStarterApp.widgets/HelloWorld');
  expect(alert).toHaveTextContent('Returned by getContract(): frontendStarterApp.HelloWorld');
  expect(await screen.findByText('Working widget')).toBeInTheDocument();
  expect(screen.getByText('Answer remains')).toBeInTheDocument();
  expect(client.sendMessage).not.toHaveBeenCalled();
  jest.restoreAllMocks();
});

it('passes the debug turn and originating session to widget actions after switching conversations', async () => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
  const log = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  const client = { getConversationHistory: jest.fn(async () => []), sendMessage: jest.fn() };
  const manager = createClientStateManager(client as unknown as Parameters<typeof createClientStateManager>[0]);
  await manager.setActiveConversationId('origin-session');
  let savedCallback: ((event: unknown) => void) | undefined;
  let savedMeta: WidgetMeta | undefined;
  (getModule as jest.Mock).mockImplementation(async (_scope: string, _module: string, name: string) =>
    name === 'getContract'
      ? () => ({ widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0', outputSchema: { type: 'object' } })
      : ({ input, onOutput, meta }: { input: unknown; onOutput?: (event: unknown) => void; meta: WidgetMeta }) => {
          savedCallback = onOutput;
          savedMeta = meta;
          expect(input).toEqual(widgetInput);
          return <button onClick={() => onOutput?.({ type: 'approve' })}>Approve widget</button>;
        }
  );
  render(
    <AIStateProvider stateManager={manager}>
      <UniversalMessages
        avatar=""
        setIsBannerOpen={() => undefined}
        isBannerOpen={false}
        scrollToBottomRef={React.createRef()}
        isMas
        MessageEntryComponent={MASMessageEntry}
      />
    </AIStateProvider>
  );
  const widgetInput = { turnId: 'spoof', sessionId: 'spoof', instanceId: 'spoof', source: 'live', meta: { source: 'history' } };
  const widget = {
    type: 'widget',
    widget: 'frontendStarterApp.HelloWorld',
    schemaVersion: '1.0',
    instanceId: 'instance',
    source: 'history',
    props: widgetInput,
  };
  act(() =>
    window.dispatchEvent(
      new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, {
        detail: { answer: 'Debug', turnId: 'origin-turn', sessionId: 'spoof', source: 'live', widgets: [widget] },
      })
    )
  );
  fireEvent.click(await screen.findByText('Approve widget'));
  expect(savedMeta).toEqual({
    widget: widget.widget,
    schemaVersion: widget.schemaVersion,
    sessionId: 'origin-session',
    turnId: 'origin-turn',
    instanceId: 'instance',
    source: 'debug',
  });
  await act(async () => {
    await manager.setActiveConversationId('other-session');
  });
  savedCallback?.({ type: 'reject' });
  expect(savedMeta).toEqual({
    widget: widget.widget,
    schemaVersion: widget.schemaVersion,
    sessionId: 'origin-session',
    turnId: 'origin-turn',
    instanceId: 'instance',
    source: 'debug',
  });
  expect(log.mock.calls.map(([, payload]) => payload)).toEqual([
    {
      widget: widget.widget,
      schemaVersion: widget.schemaVersion,
      sessionId: 'origin-session',
      turnId: 'origin-turn',
      instanceId: 'instance',
      actionId: expect.any(String),
      output: { type: 'approve' },
    },
    {
      widget: widget.widget,
      schemaVersion: widget.schemaVersion,
      sessionId: 'origin-session',
      turnId: 'origin-turn',
      instanceId: 'instance',
      actionId: expect.any(String),
      output: { type: 'reject' },
    },
  ]);
  expect(manager.getActiveConversationMessages()).toEqual([]);
  expect(client.sendMessage).not.toHaveBeenCalled();
  jest.restoreAllMocks();
});

it('renders a read-only widget in a debug reply without providing an action callback', async () => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
  const log = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  const client = { getConversationHistory: jest.fn(async () => []), sendMessage: jest.fn() };
  const manager = createClientStateManager(client as unknown as Parameters<typeof createClientStateManager>[0]);
  await manager.setActiveConversationId('session');
  const Widget = jest.fn<React.ReactElement, [{ input: unknown; onOutput?: (output: unknown) => void }]>(() => <span>Read-only widget</span>);
  (getModule as jest.Mock).mockResolvedValue(Widget);
  (getScalprum as jest.Mock).mockReturnValueOnce({ pluginStore: { getExposedModule: async () => ({ default: Widget }) } });
  render(
    <AIStateProvider stateManager={manager}>
      <UniversalMessages
        avatar=""
        setIsBannerOpen={() => undefined}
        isBannerOpen={false}
        scrollToBottomRef={React.createRef()}
        isMas
        MessageEntryComponent={MASMessageEntry}
      />
    </AIStateProvider>
  );
  const widget = { type: 'widget', widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0', instanceId: 'read-only', props: { text: 'hello' } };
  act(() =>
    window.dispatchEvent(new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail: { answer: 'Answer remains', turnId: 'turn', widgets: [widget] } }))
  );
  expect(await screen.findByText('Read-only widget')).toBeInTheDocument();
  expect(screen.getByText('Answer remains')).toBeInTheDocument();
  expect(Widget.mock.calls[0][0]).toEqual({
    input: widget.props,
    meta: {
      widget: widget.widget,
      schemaVersion: widget.schemaVersion,
      sessionId: 'session',
      turnId: 'turn',
      instanceId: 'read-only',
      source: 'debug',
    },
  });
  expect(log).not.toHaveBeenCalled();
  expect(client.sendMessage).not.toHaveBeenCalled();
  expect(manager.getActiveConversationMessages()).toEqual([]);
  jest.restoreAllMocks();
});
