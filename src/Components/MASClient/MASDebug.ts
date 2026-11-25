export const MAS_DEBUG_MESSAGE_EVENT = 'mas-debug-message';

// Retain the original opt-in name for existing local development links.
export function isMASDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    ['localhost', '127.0.0.1', 'stage.foo.redhat.com'].includes(window.location.hostname) &&
    new URLSearchParams(window.location.search).get('masComponentPreview') === '1'
  );
}
