import assert from 'node:assert/strict';
import test from 'node:test';
import { AnalyticsRuntime, CONSENT_MAX_AGE, consentValue, safePath, validConfig, excludedPath } from '../src/lib/analytics/runtime';
import { analyticsCopy } from '../src/lib/analytics/copy';
import locales from '../src/localization/locales.json' with { type: 'json' };
import publicHosts from '../src/config/public-hosts.json';

// Isolated test configuration only; never added to the shipped allowlist.
Object.assign(publicHosts, { siteHosts: ['www.example.com'], analyticsRuntimeHosts: ['metrics.example.net'] });

test('consent, revoke, SPA, expired/unavailable configuration and minimal event fields', () => {
  let now = Date.now();
  const config = { enabled: true, origin: 'https://www.example.com', runtimeOrigin: 'https://metrics.example.net', measurementId: 'G-ABCD1234', privacyUrl: 'https://www.example.com/privacy', privacyVersion: 'v1', expiresAt: new Date(now + 60000).toISOString() };
  const calls: unknown[][] = [];
  const runtime = new AnalyticsRuntime({
    start: (...args) => calls.push(['start', ...args]),
    stop: () => calls.push(['stop']),
    send: (...args) => calls.push(['event', ...args]),
    clearCookies: () => calls.push(['cookies-cleared']),
  }, config.origin, () => now);
  const events = () => calls.filter(c => c[0] === 'event');
  runtime.configure(config); runtime.navigate('/');
  runtime.contact('phone'); runtime.saved({ code: 'secret-receipt', isSynthetic: false });
  assert.equal(events().length, 0);
  runtime.consent('rejected'); assert.equal(events().length, 0);
  runtime.consent('accepted'); assert.deepEqual(events(), [['event', 'page_view', '/']]);
  runtime.navigate('/'); runtime.configure({ ...config });
  assert.equal(events().length, 1, 'no refresh or same-route duplicates');
  runtime.navigate('/servizi');
  runtime.contact('whatsapp'); runtime.contact('email'); runtime.contact('phone');
  runtime.saved({ code: 'synthetic', isSynthetic: true });
  runtime.saved({ code: 'secret-receipt', isSynthetic: false });
  runtime.saved({ code: 'secret-receipt', isSynthetic: false });
  assert.equal(events().filter(c => c[1] === 'generate_lead').length, 1);
  assert.ok(!JSON.stringify(events()).includes('secret-receipt'));
  assert.deepEqual(events().find(c => c[1] === 'contact_click'), ['event', 'contact_click', '/servizi', 'whatsapp']);
  const count = events().length;
  runtime.consent('rejected'); runtime.contact('email'); runtime.navigate('/contatti');
  assert.equal(events().length, count);
  assert.ok(calls.some(c => c[0] === 'cookies-cleared'));
  runtime.consent('accepted'); runtime.navigate(null);
  const excludedCount = events().length;
  runtime.contact('phone'); runtime.saved({ code: 'excluded', isSynthetic: false });
  assert.equal(events().length, excludedCount);
  runtime.navigate('/'); now += 65000;
  runtime.contact('phone'); runtime.saved({ code: 'expired', isSynthetic: false });
  runtime.configure(null);
  const expiredCount = events().length;
  runtime.navigate('/servizi'); runtime.consent('accepted');
  assert.equal(events().length, expiredCount);
  assert.equal(validConfig(config, 'https://anything.replit.dev', now), false);
  assert.equal(validConfig({ ...config, expiresAt: 'bad' }, config.origin, now), false);
  for (const runtimeOrigin of ['', config.origin, 'https://tracking.example.com', 'https://tracking.example.net/path', 'https://any.replit.dev', 'http://metrics.example.net']) {
    assert.equal(validConfig({ ...config, runtimeOrigin, expiresAt: new Date(now + 60000).toISOString() }, config.origin, now), false, runtimeOrigin);
  }
  for (const path of ['/internal', '/internal/leads', '/sign-in', '/sign-up', '/owner-demo', '/__localization-review/it/home', '/__mockup', '/content/it/private', '/preview']) assert.equal(excludedPath(path), true, path);
  const paths = new Set(['/', '/servizi']);
  for (const path of ['/servizi?email=private', '/servizi#private', '/unknown', '/internal']) assert.equal(safePath(path, paths), null);
  assert.equal(safePath('/servizi', paths), '/servizi');
});

test('persistent consent is scoped, expires, tolerates malformed storage; controls cover every locale', () => {
  const config = { enabled: true, origin: 'https://www.example.com', runtimeOrigin: 'https://metrics.example.net', measurementId: 'G-ABCD1234', privacyUrl: 'https://www.example.com/privacy', privacyVersion: 'v1', expiresAt: new Date(Date.now()+60000).toISOString() };
  const now = Date.now();
  const v = { choice: 'accepted', origin: config.origin, runtimeOrigin: config.runtimeOrigin, id: config.measurementId, version: config.privacyVersion, at: now };
  assert.equal(consentValue(JSON.stringify(v), config, now), 'accepted');
  assert.equal(consentValue(JSON.stringify({ ...v, choice: 'rejected' }), config, now), 'rejected');
  assert.equal(consentValue(JSON.stringify({ ...v, runtimeOrigin: 'https://elsewhere.example.net' }), config, now), null);
  for (const raw of [null, 'bad', '{}', JSON.stringify({ ...v, origin: 'https://evil.example.com' }), JSON.stringify({ ...v, version: 'old' }), JSON.stringify({ ...v, at: now - CONSENT_MAX_AGE - 1 })]) assert.equal(consentValue(raw, config, now), null);
  for (const locale of locales) {
    const text = analyticsCopy[locale.code];
    assert.ok(text && Object.values(text).every(value => typeof value === 'string' && value.length > 0), locale.code);
  }
  assert.equal(analyticsCopy.it.message + ' ' + analyticsCopy.it.info, 'Usiamo cookie di statistica solo con il tuo consenso. Info');
  for (const choice of ['accepted', 'rejected']) {
    const raw = JSON.stringify({ ...v, choice, at: now - CONSENT_MAX_AGE + 1 });
    assert.equal(consentValue(raw, config, now), choice);
    assert.equal(consentValue(raw, config, now + 1), null, 'exact expiry for both choices');
    for (const field of ['origin', 'runtimeOrigin', 'privacyVersion', 'measurementId', 'mode']) {
      assert.equal(consentValue(raw, { ...config, [field]: 'changed' }, now), null, field);
    }
    assert.equal(consentValue(JSON.stringify({ ...v, choice, at: now + 1 }), config, now), null);
  }
});
