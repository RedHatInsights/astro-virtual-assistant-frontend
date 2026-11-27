/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://stage.foo.redhat.com:1337/"}
 */
import { isMASDebugEnabled } from '../MASDebug';

it('enables debug on the stage proxy without a flag or development build', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });
  expect(isMASDebugEnabled()).toBe(true);
  window.history.replaceState({}, '', '/?masComponentPreview=0');
  expect(isMASDebugEnabled()).toBe(true);
  jest.restoreAllMocks();
});
