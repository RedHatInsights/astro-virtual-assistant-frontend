import { isMASDebugEnabled } from '../MASDebug';

afterEach(() => {
  jest.restoreAllMocks();
  window.history.replaceState({}, '', '/');
});

it('requires a development build and explicit opt-in on localhost', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });
  window.history.replaceState({}, '', '/');
  expect(isMASDebugEnabled()).toBe(false);
  window.history.replaceState({}, '', '/?masComponentPreview=0');
  expect(isMASDebugEnabled()).toBe(false);
  window.history.replaceState({}, '', '/?masComponentPreview=1');
  expect(isMASDebugEnabled()).toBe(true);
});

it('rejects production even on localhost with opt-in', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });
  window.history.replaceState({}, '', '/?masComponentPreview=1');
  expect(isMASDebugEnabled()).toBe(false);
});
