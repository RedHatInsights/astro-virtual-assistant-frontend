/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://console.stage.redhat.com/"}
 */
import { isMASDebugEnabled } from '../MASDebug';

it('enables debug on the stage Console without a flag or development build', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });
  expect(isMASDebugEnabled()).toBe(true);
  jest.restoreAllMocks();
});
