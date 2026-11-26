// Captured handleChunk shape from ai-web-clients #73; also shown in README.
export const chunk = {
  messageId: 'message-1',
  conversationId: 'session-1',
  answer: 'Here is the starter widget.',
  additionalAttributes: {
    activeAgents: [],
    hasPendingInteraction: false,
    widgets: [
      {
        key: 'exec-7::inv-2::hello-1',
        executionId: 'exec-7',
        invocationId: 'inv-2',
        widgetId: 'hello-1',
        revision: 1,
        envelope: {
          type: 'widget',
          widgetId: 'hello-1',
          widget: 'frontendStarterApp.HelloWorld',
          schemaVersion: '1.0',
          revision: 1,
          input: { runId: 'FooBar', text: 'Hello from MAS' },
        },
      },
    ],
  },
};
