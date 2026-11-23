import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { renderDocument } from './seo-document.mjs';
import { setWebSecurityHeaders } from './security-policy.mjs';

const bundle = await build({
  stdin: { contents: `export * from './src/lib/analytics/marketing'; export * from './src/lib/analytics/preferences'; export * from './src/content/legal'; export * from './src/lib/analytics/category-copy'; export * from './src/lib/analytics/copy';`, resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { MarketingRuntime, readPreferences, savePreferences, PREFERENCES_KEY, LEGAL_VERSION, categoryCopy, analyticsCopy } =
  await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const origin = 'https://www.marenettobuild.com';
const good = { schema: 2, statistics: false, marketing: true, at: Date.now(), version: LEGAL_VERSION };

test('preferences fail closed on legacy, malformed, changed notice, future and expired records', () => {
  for (const value of [null, '{', {}, { choice: 'accepted', at: Date.now() }, { ...good, schema: 1 }, { ...good, version: 'old' }, { ...good, at: Date.now() + 10000 }, { ...good, at: Date.now() - 180 * 86400000 }, { ...good, marketing: 'true' }]) {
    assert.equal(readPreferences(typeof value === 'string' ? value : JSON.stringify(value)), null);
  }
  assert.deepEqual(readPreferences(JSON.stringify(good)), good);
  globalThis.localStorage = { setItem() { throw Error('denied'); } };
  assert.equal(savePreferences(true, true), null);
  globalThis.localStorage = { setItem() {}, getItem() { return null; } };
  assert.equal(savePreferences(true, true), null);
});

test('manual Pixel transport: no SDK, sanitized URL, credentialless/referrerless, no replay or private events', () => {
  const images = [], deletions = [];
  let stored = JSON.stringify(good);
  globalThis.localStorage = { getItem: () => stored };
  globalThis.location = { hostname: 'www.marenettobuild.com', pathname: '/richiesta' };
  globalThis.window = { location };
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'img');
      const image = { remove() {}, removeAttribute() {} }; images.push(image); return image;
    },
    body: { append() {} },
    set cookie(value) { deletions.push(value); },
  };
  const runtime = new MarketingRuntime(origin);
  runtime.navigate('/richiesta');
  const pre = runtime.attempt(); runtime.sent(pre); runtime.contact();
  assert.equal(images.length, 0);
  runtime.consent(true);
  runtime.navigate('/richiesta');
  runtime.sent(pre); // success before consent is never replayed
  const token = runtime.attempt(); runtime.sent(token); runtime.sent(token);
  runtime.contact();
  assert.deepEqual(images.map(i => new URL(i.src).searchParams.get('ev')), ['PageView', 'Lead', 'Contact']);
  for (const image of images) {
    const url = new URL(image.src);
    assert.deepEqual([...url.searchParams.keys()], ['id', 'ev', 'dl', 'rl', 'ts']);
    assert.equal(url.searchParams.get('dl'), origin + '/richiesta');
    assert.equal(url.searchParams.get('rl'), '');
    assert.equal(image.referrerPolicy, 'no-referrer');
    assert.equal(image.crossOrigin, 'anonymous');
  }
  const interrupted = runtime.attempt();
  runtime.consent(false); runtime.consent(true);
  runtime.sent(interrupted);
  assert.equal(images.filter(i => new URL(i.src).searchParams.get('ev') === 'Lead').length, 1);
  const count = images.length;
  location.pathname = '/internal/leads';
  runtime.contact(); runtime.sent(runtime.attempt());
  assert.equal(images.length, count);
  location.pathname = '/richiesta';
  stored = JSON.stringify({ ...good, at: Date.now() - 180 * 86400000 });
  runtime.contact();
  assert.equal(images.length, count);
  runtime.consent(false);
  assert.ok(deletions.some(c => c.includes('_fbp=;') && c.includes('Domain=.marenettobuild.com')));
  assert.ok(deletions.some(c => c.includes('_fbc=;') && c.includes('Path=/richiesta')));
  const preview = new MarketingRuntime('https://preview.invalid');
  stored = JSON.stringify(good); preview.navigate('/'); preview.consent(true);
  assert.equal(images.length, count);
});

test('domain verification is exact and unique after repeated prerender; CSP grants only the image endpoint', async () => {
  const template = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const tag = '<meta name="facebook-domain-verification" content="5uk7oyoskduu3td99b45m9r58i1cd7" />';
  const first = renderDocument(template, { body: '', canonicalPath: '/' });
  const second = renderDocument(first, { body: '', canonicalPath: '/' });
  for (const html of [template, first, second]) {
    assert.equal(html.split(tag).length - 1, 1);
    assert.ok(html.indexOf(tag) < html.indexOf('</head>'));
    assert.doesNotMatch(html, /<noscript|preconnect[^>]*facebook/);
  }
  const headers = new Map();
  setWebSecurityHeaders({ setHeader: (key, value) => headers.set(key, value) });
  const csp = headers.get('Content-Security-Policy-Report-Only') ?? headers.get('Content-Security-Policy');
  assert.ok(csp.includes('https://www.facebook.com/tr/'));
  assert.ok(!csp.includes('connect.facebook.net'));
  assert.ok(!csp.includes('*.facebook'));
});

test('all existing preference languages have independent category controls and error copy', () => {
  assert.deepEqual(Object.keys(categoryCopy).sort(), Object.keys(analyticsCopy).sort());
  for (const copy of Object.values(categoryCopy)) for (const value of Object.values(copy)) assert.ok(value.length > 0);
});
