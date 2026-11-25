import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { APPROVED_LOCALES, PUBLIC_ORIGIN, alternateEditions, canonicalRedirect, indexingEnabled, publicEditions } from './public-release.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { isNativeEdition, releaseMetadata, mergeActiveMetadata } from '../src/localization/public-seo.mjs';
import { build } from 'esbuild';

test('Google ownership file is permanent, exact, unredirected and outside the sitemap', async () => {
  const topology = await editorialTopology({ publicIndexing: true });
  const path = '/googledaf4e170f04727ce.html';
  const headers = { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https', 'accept-language': 'fr-FR' };
  try {
    const get = (url, options = {}) => fetch(topology.origin + url, { headers, redirect: 'manual', ...options });
    const response = await get(path);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('x-robots-tag'), null);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    assert.equal(await response.text(), 'google-site-verification: googledaf4e170f04727ce.html');
    const head = await get(path, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('x-robots-tag'), null);
    assert.equal(await head.text(), '');
    assert.ok(!(await (await get('/sitemap.xml')).text()).includes(path));
    topology.setMode('http_status');
    assert.equal((await get(path)).status, 200, 'independent of editorial availability');
    const preview = await get(path, { headers: { ...headers, 'x-forwarded-host': 'preview.replit.dev' } });
    assert.equal(preview.status, 200);
    assert.equal(preview.headers.get('x-robots-tag'), 'noindex, nofollow', 'preview remains excluded');
  } finally {
    await topology.close();
  }
});

test('all generated HTML documents use only the official public email', async () => {
  const root = new URL('../dist/public/', import.meta.url);
  const files = (await readdir(root, { recursive: true })).filter(file => file.endsWith('.html'));
  assert.ok(files.length > 300, 'check the full generated multilingual site, not one page');
  for (const file of files) {
    const html = await readFile(new URL(file, root), 'utf8');
    assert.doesNotMatch(html, /info@marenettobuild\.com/i, file);
  }
});

test('the official public email replaces retired legacy text and mailto links', async () => {
  const built = await build({ entryPoints: [new URL('../src/config/contact.ts', import.meta.url).pathname], bundle: true, write: false, platform: 'node', format: 'esm' });
  const contact = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
  assert.equal(contact.COMPANY_CONTACT.email, 'info@marenetto.com');
  assert.equal(contact.companyStructuredData(PUBLIC_ORIGIN).email, 'info@marenetto.com');
  assert.equal(contact.emailHref('Preventivo'), 'mailto:info@marenetto.com?subject=Preventivo');
  assert.equal(
    contact.normalizePublicContact('<a href="mailto:info@marenettobuild.com?subject=Progetto">INFO@MARENETTOBUILD.COM</a>'),
    '<a href="mailto:info@marenetto.com?subject=Progetto">info@marenetto.com</a>',
  );
  assert.equal(contact.normalizePublicContact('info@marenetto.com'), 'info@marenetto.com');
});

test('public SEO excludes language wrappers and preserves active editorial metadata', () => {
  const original = { id: 'articles', path: '/articoli/', locale: 'it', contentLanguage: 'it', title: 'Articoli | marenettobuild.com', description: '' };
  assert.equal(isNativeEdition(original), true);
  assert.equal(isNativeEdition({ ...original, locale: 'en' }), false);
  const active = [{ path: original.path, revisionId: 'active-revision', content: { seoTitle: 'Titolo scelto dal titolare', seoDescription: 'Descrizione scelta dal titolare' } }];
  const [merged] = mergeActiveMetadata([original], active);
  assert.deepEqual(releaseMetadata(merged), { title: active[0].content.seoTitle + ' | Marenetto Build', description: active[0].content.seoDescription });
  const snippet = '<main><p>Un testo pertinente alla pagina con informazioni sufficientemente dettagliate per la descrizione nei risultati di ricerca.</p></main>';
  // Curated native search copy takes precedence for known public families.
  // Body-paragraph recovery remains available for uncatalogued editorial pages.
  assert.ok(releaseMetadata({ ...original, id:'uncatalogued', title:'Argomento specifico' }, snippet).description.includes('testo pertinente'));
  const first = { ...original, id: 'first', path: '/first', title: 'Prima pagina', description: 'Una descrizione ripetuta.' };
  const second = { ...first, id: 'second', path: '/second', title: 'Seconda pagina' };
  assert.notEqual(releaseMetadata(first, '', [first, second]).description, releaseMetadata(second, '', [first, second]).description);
});

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
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), PUBLIC_ORIGIN + '/');
    const robots = await (await get('/robots.txt')).text();
    assert.match(robots, /Allow: \//);
    assert.doesNotMatch(robots, /^Disallow: \/$/m);
    assert.match(robots, /Disallow: \/api\//);
    assert.match(robots, /Sitemap: https:\/\/www\.marenettobuild\.com\/sitemap.xml/);
    const xmlResponse = await get('/sitemap.xml');
    assert.equal(xmlResponse.headers.get('content-type'), 'application/xml');
    assert.equal(xmlResponse.headers.get('x-robots-tag'), null);
    assert.equal((await get('/robots.txt')).headers.get('x-robots-tag'), null);
    const xml = await xmlResponse.text();
    const entries = publicEditions(manifest);
    assert.ok(entries.length > 200);
    assert.ok(entries.every(e => e.locale === e.contentLanguage), 'do not index foreign wrappers around Italian copy');
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
      const current = entries.find(e => PUBLIC_ORIGIN + e.path === record.loc);
      const hasItalian = alternateEditions(current, entries).some(e => e.locale === 'it');
      assert.equal(record.links.some(a => a.lang === 'it-IT'), hasItalian);
      assert.equal(record.links.some(a => a.lang === 'x-default'), hasItalian);
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
    for (const host of ['preview.replit.app', 'preview.replit.dev']) {
      const preview = await get('/', { headers: { ...headers, 'x-forwarded-host': host } });
      assert.equal(preview.headers.get('x-robots-tag'), 'noindex, nofollow');
      assert.match(await preview.text(), /name="robots" content="noindex, nofollow"/);
    }
    const previewRobots = await (await get('/robots.txt', { headers: { ...headers, 'x-forwarded-host': 'preview.replit.app' } })).text();
    assert.match(previewRobots, /^Disallow: \/$/m);
    for (const path of ['/internal', '/owner-demo', '/__localization-review', '/__localization-review/ar/home', '/he/', '/fi/', '/hu/', '/random-nonexistent']) {
      const r = await get(path);
      assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow', path);
    }
    for (const lang of ['ro', 'uk', 'cs', 'sk', 'sl', 'hr', 'sr', 'bg', 'bs', 'mk', 'be', 'he', 'fi', 'hu', 'el', 'tr']) {
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
