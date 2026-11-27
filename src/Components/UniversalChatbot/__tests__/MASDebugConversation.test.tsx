import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { getModule, getScalprum } from '@scalprum/core';
import UniversalMessages from '../UniversalMessages';
import MASMessageEntry from '../../MASClient/MASMessageEntry';
import * as debug from '../../MASClient/MASDebug';
import { MAS_DEBUG_MESSAGE_EVENT } from '../../MASClient/MASDebug';
import { WidgetMeta } from '../../MASClient/types';
import { chunk } from '../../MASClient/testFixtures/chunkFixture';

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

it('renders the same captured chunk live and in debug, replaying and updating one local reply', async () => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
  const log = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  const client = {
    getConversationHistory: jest.fn(async () => []),
    sendMessage: jest.fn(async (_session: string, _query: string, options: { handleChunk: (value: typeof chunk) => void }) => {
      options.handleChunk(chunk);
      return chunk;
    }),
  };
  const manager = createClientStateManager(client as unknown as Parameters<typeof createClientStateManager>[0]);
  await manager.setActiveConversationId(chunk.conversationId);
  const inputs: unknown[] = [];
  const metas: WidgetMeta[] = [];
  (getModule as jest.Mock).mockImplementation(async (_scope: string, _module: string, name: string) =>
    name === 'getContract'
      ? () => ({ widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0', outputSchema: { type: 'object' } })
      : ({ input, meta, onOutput }: { input: { runId: string; text: string }; meta: WidgetMeta; onOutput?: (value: unknown) => void }) => {
          inputs.push(input);
          metas.push(meta);
          return (
            <button onClick={() => onOutput?.({ type: 'approve' })}>
              {input.text} {input.runId}
            </button>
          );
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
  await act(async () => {
    await manager.sendMessage('Question', { stream: true });
  });
  const reads = client.getConversationHistory.mock.calls.length;
  const sends = client.sendMessage.mock.calls.length;
  const dispatch = (detail: unknown) => act(() => window.dispatchEvent(new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail })));
  dispatch(chunk);
  await waitFor(() => expect(screen.getAllByText('Hello from MAS FooBar')).toHaveLength(2));
  expect(inputs).toContainEqual({ runId: 'FooBar', text: 'Hello from MAS' });
  expect(inputs[metas.findIndex((meta) => meta.source === undefined)]).toEqual({ runId: 'FooBar', text: 'Hello from MAS' });
  expect(inputs[metas.findIndex((meta) => meta.source === 'debug')]).toEqual({ runId: 'FooBar', text: 'Hello from MAS' });
  expect(metas).toContainEqual({
    widget: 'frontendStarterApp.HelloWorld',
    schemaVersion: '1.0',
    instanceId: 'exec-7::inv-2::hello-1',
    turnId: 'exec-7',
    sessionId: 'session-1',
  });
  expect(metas).toContainEqual({
    widget: 'frontendStarterApp.HelloWorld',
    schemaVersion: '1.0',
    instanceId: 'exec-7::inv-2::hello-1',
    turnId: 'exec-7',
    sessionId: 'session-1',
    source: 'debug',
  });
  const debugWidget = screen.getAllByText('Hello from MAS FooBar')[1];
  fireEvent.click(debugWidget);
  expect(log).toHaveBeenCalledWith(
    '[Astro → MAS client] Would send widget action',
    expect.objectContaining({ output: { type: 'approve' }, turnId: 'exec-7', instanceId: 'exec-7::inv-2::hello-1' })
  );
  dispatch(chunk);
  expect(screen.getAllByText('Hello from MAS FooBar')).toHaveLength(2);
  expect(screen.getAllByText(chunk.answer)).toHaveLength(2);
  const widget = chunk.additionalAttributes.widgets[0];
  dispatch({
    ...chunk,
    additionalAttributes: {
      ...chunk.additionalAttributes,
      widgets: [{ ...widget, revision: 2, envelope: { ...widget.envelope, revision: 2, input: { runId: 'FooBar', text: 'Updated from MAS' } } }],
    },
  });
  expect(await screen.findByText('Updated from MAS FooBar')).toBe(debugWidget);
  expect(screen.getAllByText(chunk.answer)).toHaveLength(2);
  expect(screen.getAllByTestId('entry')).toHaveLength(3); // question + live reply + debug reply
  expect(client.sendMessage).toHaveBeenCalledTimes(sends);
  expect(client.getConversationHistory).toHaveBeenCalledTimes(reads);
  expect(manager.getActiveConversationMessages()).toHaveLength(2);
  jest.restoreAllMocks();
});

it('keeps debug replies out of the real manager and client while merging later replies and reloaded history', async () => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
  Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: jest.fn().mockReturnValue('generated-id') });
  const widget = {
    ...chunk.additionalAttributes.widgets[0],
    key: 'live',
    executionId: 'live-turn',
    envelope: { ...chunk.additionalAttributes.widgets[0].envelope, input: { runId: 'live-id', text: '' } },
  };
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
  act(() =>
    window.dispatchEvent(
      new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail: { ...chunk, conversationId: 'one', answer: 'Debug reply', additionalAttributes: {} } })
    )
  );
  expect(screen.getByText('Debug reply')).toBeInTheDocument();
  expect(manager.getActiveConversationMessages()).toEqual([]);
  expect(client.sendMessage).not.toHaveBeenCalled();
  expect(client.getConversationHistory).toHaveBeenCalledTimes(historyReads);

  await act(async () => {
    await manager.sendMessage('Live question', { stream: true });
  });
  expect(await screen.findByText('Widget live-id')).toBeInTheDocument();
  expect(liveMeta[0]).toEqual({
    widget: widget.envelope.widget,
    schemaVersion: widget.envelope.schemaVersion,
    sessionId: 'one',
    instanceId: 'live',
    turnId: 'live-turn',
  });
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
  const widget = chunk.additionalAttributes.widgets[0];
  act(() =>
    window.dispatchEvent(
      new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, {
        detail: {
          ...chunk,
          conversationId: 'session',
          answer: 'Answer remains',
          additionalAttributes: {
            widgets: [
              { ...widget, envelope: { ...widget.envelope, widget: 'frontendStarterApp.widgets/HelloWorld' } },
              { ...widget, key: 'two' },
            ],
          },
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
    ...chunk.additionalAttributes.widgets[0],
    key: 'instance',
    executionId: 'origin-turn',
    envelope: { ...chunk.additionalAttributes.widgets[0].envelope, input: widgetInput },
  };
  act(() =>
    window.dispatchEvent(
      new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, {
        detail: { ...chunk, conversationId: 'origin-session', answer: 'Debug', source: 'live', additionalAttributes: { widgets: [widget] } },
      })
    )
  );
  fireEvent.click(await screen.findByText('Approve widget'));
  expect(savedMeta).toEqual({
    widget: widget.envelope.widget,
    schemaVersion: widget.envelope.schemaVersion,
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
    widget: widget.envelope.widget,
    schemaVersion: widget.envelope.schemaVersion,
    sessionId: 'origin-session',
    turnId: 'origin-turn',
    instanceId: 'instance',
    source: 'debug',
  });
  expect(log.mock.calls.map(([, payload]) => payload)).toEqual([
    {
      widget: widget.envelope.widget,
      schemaVersion: widget.envelope.schemaVersion,
      sessionId: 'origin-session',
      turnId: 'origin-turn',
      instanceId: 'instance',
      actionId: expect.any(String),
      output: { type: 'approve' },
    },
    {
      widget: widget.envelope.widget,
      schemaVersion: widget.envelope.schemaVersion,
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
  const widget = {
    ...chunk.additionalAttributes.widgets[0],
    key: 'read-only',
    executionId: 'turn',
    envelope: { ...chunk.additionalAttributes.widgets[0].envelope, input: { text: 'hello' } },
  };
  act(() =>
    window.dispatchEvent(
      new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, {
        detail: { ...chunk, conversationId: 'session', answer: 'Answer remains', additionalAttributes: { widgets: [widget] } },
      })
    )
  );
  expect(await screen.findByText('Read-only widget')).toBeInTheDocument();
  expect(screen.getByText('Answer remains')).toBeInTheDocument();
  expect(Widget.mock.calls[0][0]).toEqual({
    input: widget.envelope.input,
    meta: {
      widget: widget.envelope.widget,
      schemaVersion: widget.envelope.schemaVersion,
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
