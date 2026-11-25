/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://example.com/?masComponentPreview=1"}
 */
import { isMASDebugEnabled } from '../MASDebug';

it('rejects non-local hosts even in development with opt-in', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });
  expect(isMASDebugEnabled()).toBe(false);
  jest.restoreAllMocks();
});
