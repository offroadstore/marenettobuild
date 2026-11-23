import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CallAdvertisingConversions } from '../src/lib/analytics/call-conversions.ts';
import { AnalyticsRuntime } from '../src/lib/analytics/runtime.ts';

test('advertising is absent by default, blocked without specific consent, synthetic-safe, PII-free and deduplicated', () => {
  const runtime = new CallAdvertisingConversions(), events = [];
  const receipt = { code: 'LOCAL-ONLY', isSynthetic: false };
  runtime.saved(receipt); assert.equal(events.length, 0);
  runtime.configure({ meta: { configured: true, send: e => events.push(e) }, googleAds: { configured: false, send: () => assert.fail() } });
  runtime.saved(receipt); assert.equal(events.length, 0);
  runtime.consent({ meta: true, googleAds: true });
  runtime.saved({ ...receipt, isSynthetic: true }); assert.equal(events.length, 0);
  runtime.saved(receipt); runtime.saved(receipt);
  assert.deepEqual(events, [{ event: 'generate_lead' }]);
  runtime.revoke(); runtime.saved({ ...receipt, code: 'AFTER-REVOCATION' });
  assert.equal(events.length, 1);
  runtime.configure({ meta: { configured: true, send: e => events.push(e) } });
  runtime.saved({ ...receipt, code: 'NEW-CONFIG' }); assert.equal(events.length, 1);
});
test('GA4 cannot send a saved callback without configured collection and consent', () => {
  const events = [];
  const runtime = new AnalyticsRuntime({ start() {}, stop() {}, clearCookies() {}, send(...args) { events.push(args); } }, 'https://www.marenettobuild.com');
  runtime.navigate('/'); runtime.saved({ code: 'CALL-PRIVATE', isSynthetic: false });
  runtime.consent('accepted'); runtime.saved({ code: 'CALL-PRIVATE', isSynthetic: false });
  runtime.consent('rejected'); runtime.saved({ code: 'CALL-PRIVATE-2', isSynthetic: false });
  assert.deepEqual(events, []);
});
