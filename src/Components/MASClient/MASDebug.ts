export const MAS_DEBUG_MESSAGE_EVENT = 'mas-debug-message';

export function isMASDebugEnabled(): boolean {
  return ['stage.foo.redhat.com', 'console.stage.redhat.com'].includes(window.location.hostname);
}
