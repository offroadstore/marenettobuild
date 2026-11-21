import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { APPROVED_LOCALES, PUBLIC_ORIGIN, canonicalRedirect, indexingEnabled, publicEditions } from './public-release.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';

const manifest = JSON.parse(await readFile(new URL('../dist/public/route-manifest.json', import.meta.url), 'utf8'));
const request = (host, path, proto = 'https') => ({ headers: { 'x-forwarded-host': host, 'x-forwarded-proto': proto }, url: path });

test('canonical host and historical normalization compose one application redirect', () => {
  for (const [host, proto] of [['marenettobuild.com', 'https'], ['marenettobuild.com', 'http'], ['www.marenettobuild.com', 'http']]) {
    assert.equal(canonicalRedirect(request(host, '/?utm_source=test', proto), manifest, { NODE_ENV: 'production' }), PUBLIC_ORIGIN + '/?utm_source=test');
  }
  assert.equal(canonicalRedirect(request('www.marenettobuild.com', '/'), manifest, { NODE_ENV: 'production' }), undefined);
  assert.equal(canonicalRedirect(request('preview.replit.app', '/'), manifest, { NODE_ENV: 'production' }), undefined);
  assert.equal(canonicalRedirect(request('marenettobuild.com', '/'), manifest, { NODE_ENV: 'development' }), undefined);
  assert.equal(canonicalRedirect(request('www.marenettobuild.com', '/en/articoli/'), manifest, { NODE_ENV: 'production' }), PUBLIC_ORIGIN + '/en/articles/');
  for (const [source, target] of Object.entries(manifest.redirects)) {
    assert.equal(canonicalRedirect(request('marenettobuild.com', source + '?utm_source=test'), manifest, { NODE_ENV: 'production' }), PUBLIC_ORIGIN + target + '?utm_source=test', source);
  }
});

test('indexing requires production, canonical WWW and explicit second release gate', () => {
  const env = { NODE_ENV: 'production', MARENETTO_PUBLIC_INDEXING: 'true' };
  assert.equal(indexingEnabled(request('www.marenettobuild.com', '/'), env), true);
  for (const host of ['marenettobuild.com', 'preview.replit.app', 'localhost']) assert.equal(indexingEnabled(request(host, '/'), env), false);
  assert.equal(indexingEnabled(request('www.marenettobuild.com', '/'), { NODE_ENV: 'production' }), false);
});

test('actual release handler: canonical, robots, XML sitemap, reciprocal alternates, private and blocked routes', { timeout: 120000 }, async () => {
  const topology = await editorialTopology({ publicIndexing: true });
  const headers = { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' };
  const get = (path, extra = {}) => fetch(topology.origin + path, { headers, redirect: 'manual', ...extra });
  try {
    const response = await get('/', { headers: { ...headers, 'x-forwarded-host': 'marenettobuild.com' } });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), PUBLIC_ORIGIN + '/');
    const robots = await (await get('/robots.txt')).text();
    assert.match(robots, /Allow: \//);
    assert.doesNotMatch(robots, /^Disallow: \/$/m);
    assert.match(robots, /Disallow: \/api\//);
    assert.match(robots, /Sitemap: https:\/\/www\.marenettobuild\.com\/sitemap.xml/);
    const xmlResponse = await get('/sitemap.xml');
    assert.equal(xmlResponse.headers.get('content-type'), 'application/xml');
    const xml = await xmlResponse.text();
    const entries = publicEditions(manifest);
    assert.ok(entries.length > 300);
    assert.deepEqual(new Set(entries.map(e => e.locale)), APPROVED_LOCALES);
    const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
      loc: block.match(/<loc>([^<]+)<\/loc>/)[1],
      links: [...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(([, lang, href]) => ({ lang, href })),
    }));
    assert.equal(urls.length, entries.length);
    for (const record of urls) {
      assert.ok(record.loc.startsWith(PUBLIC_ORIGIN + '/'));
      assert.equal(new Set(record.links.map(a => a.lang)).size, record.links.length);
      for (const alternate of record.links) {
        const target = urls.find(u => u.loc === alternate.href);
        assert.ok(target, alternate.href);
        assert.ok(target.links.some(a => a.href === record.loc), `Reciprocal alternate ${record.loc}`);
      }
      assert.ok(record.links.some(a => a.lang === 'it-IT'));
      assert.ok(record.links.some(a => a.lang === 'x-default'));
    }
    for (const lang of APPROVED_LOCALES) {
      const home = entries.find(e => e.locale === lang && e.id === 'home');
      assert.ok(home);
      const res = await get(home.path);
      const html = await res.text();
      assert.equal(res.status, 200, home.path);
      assert.equal(res.headers.get('x-robots-tag'), null);
      assert.match(html, /name="robots" content="index, follow"/);
      assert.match(html, /hreflang="x-default"/);
      assert.ok(html.includes(`rel="canonical" href="${PUBLIC_ORIGIN}${home.path}"`));
      const head = await get(home.path, { method: 'HEAD' });
      assert.equal(head.headers.get('x-robots-tag'), null);
    }
    const preview = await get('/', { headers: { ...headers, 'x-forwarded-host': 'preview.replit.app' } });
    assert.equal(preview.headers.get('x-robots-tag'), 'noindex, nofollow');
    const previewRobots = await (await get('/robots.txt', { headers: { ...headers, 'x-forwarded-host': 'preview.replit.app' } })).text();
    assert.match(previewRobots, /^Disallow: \/$/m);
    for (const path of ['/internal', '/owner-demo', '/__localization-review', '/ar/', '/he/', '/fi/', '/hu/', '/random-nonexistent']) {
      const r = await get(path);
      assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow', path);
    }
    for (const lang of ['ro', 'uk', 'cs', 'sk', 'sl', 'hr', 'sr', 'bg', 'bs', 'mk', 'be', 'ar', 'he', 'fi', 'hu', 'el', 'tr']) {
      assert.equal((await get(`/${lang}/`)).status, 404, lang);
    }
    assert.equal((await get('/')).headers.get('strict-transport-security'), null, 'production edge owns HSTS');
  } finally { await topology.close(); }
});

test('a withdrawn article is absent from release sitemap and remains noindex', async () => {
  const edition = publicEditions(manifest).find(e => e.kind === 'article');
  const snapshot = [{ identity: edition.id, locale: edition.locale, path: edition.path, kind: 'article', revisionId: 'withdrawn', content: { title: 'Ritirato', summary: '', body: '', category: '', tags: [], image: '', imageAlt: '', sources: [], seoTitle: '', seoDescription: '', contentLanguage: edition.locale } }];
  const topology = await editorialTopology({ publicIndexing: true, snapshot });
  const headers = { 'x-forwarded-host': 'www.marenettobuild.com' };
  try {
    const sitemap = await (await fetch(topology.origin + '/sitemap.xml', { headers })).text();
    assert.ok(!sitemap.includes(PUBLIC_ORIGIN + edition.path));
    const response = await fetch(topology.origin + edition.path, { headers });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    topology.setMode('http_status');
    assert.equal((await fetch(topology.origin + '/sitemap.xml', { headers })).status, 503);
  } finally { await topology.close(); }
});
