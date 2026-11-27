/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://console.stage.redhat.com.example.com/?masComponentPreview=1"}
 */
import { isMASDebugEnabled } from '../MASDebug';

it('rejects lookalike hosts even in development with the old opt-in', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });
  expect(isMASDebugEnabled()).toBe(false);
  jest.restoreAllMocks();
});
