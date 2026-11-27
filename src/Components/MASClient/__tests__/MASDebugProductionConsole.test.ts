/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://console.redhat.com/?masComponentPreview=1"}
 */
import { isMASDebugEnabled } from '../MASDebug';

it('rejects the production Console even with the old opt-in', () => {
  expect(isMASDebugEnabled()).toBe(false);
});
