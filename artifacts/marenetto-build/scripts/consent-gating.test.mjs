import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const result = await build({
  stdin: {
    contents: `export * from './src/lib/analytics/runtime';
      export * from './src/lib/analytics/direct';
      export * from './src/lib/analytics/marketing';
      export * from './src/lib/analytics/preferences';
      export { LEGAL_VERSION } from './src/content/legal';`,
    resolveDir: new URL('../', import.meta.url).pathname,
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { AnalyticsRuntime, directPort, MarketingRuntime, PREFERENCES_KEY, LEGAL_VERSION } =
  await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);

test('actual GA4 and Meta transports stay silent before consent, after refusal and after revocation', () => {
  const origin = 'https://www.marenettobuild.com';
  const scripts = [], images = [], removed = [], cookies = [];
  let stored = null, reloads = 0;
  globalThis.location = { origin, hostname: 'www.marenettobuild.com', pathname: '/servizi' };
  globalThis.window = { location };
  globalThis.localStorage = { getItem: key => key === PREFERENCES_KEY ? stored : null };
  globalThis.document = {
    createElement(tag) {
      assert.ok(['script', 'img'].includes(tag), 'Only the reviewed transports may be created');
      return { tag, remove() { removed.push(this); }, removeAttribute() {} };
    },
    head: { append(script) { scripts.push(script); } },
    body: { append(image) { images.push(image); } },
    set cookie(value) { cookies.push(value); },
  };
  const config = {
    enabled: true, mode: 'direct', origin, runtimeOrigin: '',
    measurementId: 'G-D0QJL17CVC', privacyUrl: `${origin}/cookie`,
    privacyVersion: LEGAL_VERSION, expiresAt: new Date(Date.now() + 60000).toISOString(),
  };
  const analytics = new AnalyticsRuntime(directPort(() => {}, () => { reloads++; }), origin);
  const marketing = new MarketingRuntime(origin);
  analytics.configure(config);
  analytics.navigate('/servizi'); marketing.navigate('/servizi');
  analytics.contact('email'); marketing.contact();
  assert.equal(scripts.length, 0);
  assert.equal(images.length, 0);

  analytics.consent('rejected'); marketing.consent(false);
  analytics.contact('phone'); marketing.contact();
  assert.equal(scripts.length, 0);
  assert.equal(images.length, 0);

  // Statistics permission alone never implies marketing permission.
  stored = JSON.stringify({ schema: 2, statistics: true, marketing: false, version: LEGAL_VERSION, at: Date.now() });
  analytics.consent('accepted'); marketing.consent(false);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-D0QJL17CVC$/);
  assert.equal(images.length, 0);
  const commands = window.dataLayer.map(args => [...args]);
  assert.equal(commands[0][0], 'consent');
  assert.equal(commands[0][2].analytics_storage, 'denied');
  assert.equal(commands[1][2].analytics_storage, 'granted');
  assert.equal(commands[1][2].ad_storage, 'denied');

  stored = JSON.stringify({ schema: 2, statistics: true, marketing: true, version: LEGAL_VERSION, at: Date.now() });
  marketing.consent(true);
  assert.equal(images.length, 1);
  assert.equal(new URL(images[0].src).searchParams.get('ev'), 'PageView');
  analytics.consent('rejected'); marketing.consent(false);
  stored = JSON.stringify({ schema: 2, statistics: false, marketing: false, version: LEGAL_VERSION, at: Date.now() });
  const eventCount = window.dataLayer.length;
  const imageCount = images.length;
  analytics.navigate('/contatti'); marketing.navigate('/contatti');
  analytics.contact('whatsapp'); marketing.contact();
  assert.equal(scripts.length, 1, 'Revocation must not load another script');
  assert.equal(window.dataLayer.length, eventCount, 'No new analytics events after revocation');
  assert.equal(images.length, imageCount, 'No new marketing requests after revocation');
  assert.ok(removed.includes(scripts[0]));
  assert.ok(cookies.some(value => value.startsWith('_fbp=;')));
  assert.ok(cookies.some(value => value.startsWith('_fbc=;')));

  // directPort intentionally schedules a document reload to unload Google's timers.
  assert.equal(reloads, 0);
});
