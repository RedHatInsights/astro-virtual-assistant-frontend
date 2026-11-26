import { isMASDebugEnabled } from '../MASDebug';

it('rejects localhost even in development with the old opt-in', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });
  window.history.replaceState({}, '', '/?masComponentPreview=1');
  expect(isMASDebugEnabled()).toBe(false);
  jest.restoreAllMocks();
  window.history.replaceState({}, '', '/');
});
