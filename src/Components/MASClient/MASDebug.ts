export const MAS_DEBUG_MESSAGE_EVENT = 'mas-debug-message';

export function isMASDebugEnabled(): boolean {
  return ['stage.foo.redhat.com', 'console.stage.redhat.com'].includes(window.location.hostname);
}

// IStreamChunk from mas-client's handleChunk. No wire-event parsing is needed:
// additionalAttributes already contains the client's processed snapshot.
export function isMASChunk(value: unknown): value is {
  messageId: string;
  conversationId: string;
  answer: string;
  additionalAttributes: Record<string, unknown>;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const chunk = value as Record<string, unknown>;
  return (
    typeof chunk.messageId === 'string' &&
    chunk.messageId.length > 0 &&
    typeof chunk.conversationId === 'string' &&
    chunk.conversationId.length > 0 &&
    typeof chunk.answer === 'string' &&
    !!chunk.additionalAttributes &&
    typeof chunk.additionalAttributes === 'object' &&
    !Array.isArray(chunk.additionalAttributes)
  );
}
