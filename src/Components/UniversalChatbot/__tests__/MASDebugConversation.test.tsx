import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { getModule } from '@scalprum/core';
import UniversalMessages from '../UniversalMessages';
import MASMessageEntry from '../../MASClient/MASMessageEntry';
import * as preview from '../../MASClient/ComponentPreview';
import { MAS_DEBUG_MESSAGE_EVENT } from '../../MASClient/MASWidgets';

jest.unmock('@redhat-cloud-services/ai-react-state');
jest.unmock('@redhat-cloud-services/ai-client-state');
jest.mock('@scalprum/core', () => ({ getModule: jest.fn() }));
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
  jest.spyOn(preview, 'isComponentPreviewEnabled').mockReturnValue(true);
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
  (getModule as jest.Mock).mockImplementation(async (_scope: string, _module: string, name: string) =>
    name === 'getContract'
      ? () => ({ widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0' })
      : ({ input }: { input: { runId: string } }) => <span>Widget {input.runId}</span>
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
  act(() => window.dispatchEvent(new CustomEvent(MAS_DEBUG_MESSAGE_EVENT, { detail: { answer: 'Debug reply', widgets: [] } })));
  expect(screen.getByText('Debug reply')).toBeInTheDocument();
  expect(manager.getActiveConversationMessages()).toEqual([]);
  expect(client.sendMessage).not.toHaveBeenCalled();
  expect(client.getConversationHistory).toHaveBeenCalledTimes(historyReads);

  await act(async () => {
    await manager.sendMessage('Live question', { stream: true });
  });
  expect(await screen.findByText('Widget live-id')).toBeInTheDocument();
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
