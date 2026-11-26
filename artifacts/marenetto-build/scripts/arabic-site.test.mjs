import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { inspect, plain } from './global-seo-audit.mjs';
import { alternateEditions, publicEditions, releaseSitemap } from './public-release.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';

const sourceRoot = new URL('../', import.meta.url);
const root = new URL('../dist/public/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('route-manifest.json', root), 'utf8'));
const entries = publicEditions(manifest);
const arabic = entries.filter(e => e.locale === 'ar');
const htmlFor = entry => readFile(new URL(manifest.pages[entry.path], root), 'utf8');
const escaped = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll("'", '&#x27;').replaceAll('"', '&quot;');
const sha = value => createHash('sha256').update(value).digest('hex');
const result = await build({ stdin: {
  contents: `export * from './src/content/arabic-editorial/index'; export * from './src/content/arabic-archives';`,
  resolveDir: sourceRoot.pathname,
}, bundle: true, write: false, platform: 'node', format: 'esm' });
const content = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));

test('Arabic initial documents have Arabic bodies, metadata, RTL, one H1 and a local font preload', async () => {
  assert.equal(arabic.filter(e => e.id !== 'professionals').length, 76); // Previous 86 + four pillars - fourteen noindex topic archives.
  assert.equal(arabic.filter(e => e.id === 'professionals').length, 1);
  assert.ok(!arabic.some(e => e.id === 'professional-downloads'), 'Empty resources never inherit Arabic release approval');
  assert.equal(arabic.filter(e => e.source.startsWith('network:')).length, 12);
  const titles = new Set(), descriptions = new Set();
  for (const entry of arabic) {
    const html = await htmlFor(entry);
    const row = inspect(html, entry);
    assert.match(html, /<html\b[^>]*\blang="ar"[^>]*\bdir="rtl"/, entry.path);
    assert.equal(row.h1, 1, entry.path);
    assert.deepEqual(row.hierarchy, [], entry.path);
    assert.deepEqual(row.inadequateAlt, [], entry.path);
    assert.deepEqual(row.jsonldIssues, [], entry.path);
    assert.match(row.title, /\p{Script=Arabic}/u, entry.path);
    assert.match(row.description, /\p{Script=Arabic}/u, entry.path);
    assert.ok([...row.title.normalize('NFC')].length >= 30 && [...row.title.normalize('NFC')].length <= 65, entry.path);
    assert.ok([...row.description.normalize('NFC')].length >= 70 && [...row.description.normalize('NFC')].length <= 165, entry.path);
    assert.ok(!titles.has(row.title), entry.path); titles.add(row.title);
    assert.ok(!descriptions.has(row.description), entry.path); descriptions.add(row.description);
    assert.ok((row.countedText.match(/\p{Script=Arabic}/gu) ?? []).length > 80, entry.path);
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com|Bozza tradotta|Traduzione da approvare|Learn More|Read article/);
    assert.match(html, /rel="preload"[^>]*noto-sans-arabic[^"]+\.woff2/);
    assert.equal(row.canonical, 'https://www.marenettobuild.com' + entry.path);
    assert.equal(entry.contentLanguage, 'ar');
  }
});

test('every Arabic adaptation has its complete reviewed body and unchanged source fingerprint', async () => {
  const reviews = JSON.parse(await readFile(new URL('src/content/arabic-editorial/reviews.json', sourceRoot), 'utf8'));
  assert.equal(reviews.nativeSpeakerCertification, false);
  assert.equal(reviews.professionalSignOff, false);
  const original = { ...JSON.parse(await readFile(new URL('src/content/historical/it.json', sourceRoot), 'utf8')),
    ...JSON.parse(await readFile(new URL('src/content/historical-editorial/it.json', sourceRoot), 'utf8')) };
  assert.equal(content.ARABIC_EDITORIAL_ARTICLES.length, 14);
  for (const article of content.ARABIC_EDITORIAL_ARTICLES) {
    const receipt = reviews.receipts.find(r => r.id === article.id);
    assert.ok(receipt, article.id);
    assert.equal(receipt.translationSHA256, sha(JSON.stringify(article)), article.id);
    assert.equal(receipt.sourceDocumentSHA256, sha(JSON.stringify(original[article.sourcePath.replace(/\/+$/, '')])), article.id);
    const entry = arabic.find(e => e.path === content.arabicEditorialPath(article.slug));
    assert.ok(entry, article.slug);
    const html = await htmlFor(entry);
    for (const text of [article.h1, article.intro, ...article.sections.flatMap(s => [s.heading, ...s.paragraphs]), ...(article.faq ?? []).flat()]) {
      assert.ok(html.includes(escaped(text)), `${article.slug}: ${text.slice(0, 40)}`);
    }
    assert.match(plain(html), /الذكاء الاصطناعي/);
    const source = entries.find(e => e.locale === 'it' && e.path.replace(/\/+$/, '') === article.sourcePath.replace(/\/+$/, ''));
    assert.equal(source.id, entry.id, article.slug);
  }
});

test('Arabic covers the active historical families without fabricated original-source records', async () => {
  const historical = JSON.parse(await readFile(new URL('src/content/historical/index.json', sourceRoot), 'utf8'));
  const sourceFamilies = historical.filter(p => p.locale === 'it' && p.state !== 'technical-source');
  for (const source of sourceFamilies) {
    const existing = entries.find(e => e.locale === 'it' && e.path.replace(/\/+$/, '') === source.path.replace(/\/+$/, ''));
    if (!existing) continue; // Runtime withdrawals never acquire an alternate.
    assert.ok(arabic.some(e => e.id === existing.id), source.path);
  }
  assert.equal(historical.filter(p => p.locale === 'ar').length, 0);
  assert.equal(content.ARABIC_ARCHIVES.length, 22);
});

test('hreflang is reciprocal; only verified Arabic pages enter sitemap and llms', async () => {
  const sitemap = releaseSitemap(entries);
  const llms = await readFile(new URL('llms.txt', root), 'utf8');
  for (const entry of arabic) {
    const html = await htmlFor(entry);
    assert.ok(sitemap.includes(`<loc>https://www.marenettobuild.com${entry.path}</loc>`), entry.path);
    assert.ok(llms.includes('https://www.marenettobuild.com' + entry.path), entry.path);
    const peers = alternateEditions(entry, entries.filter(e => e.state === 'published' && e.sitemap !== false));
    for (const peer of peers) {
      assert.ok(html.includes(`hreflang="${peer.locale === 'it' ? 'it-IT' : peer.locale}" href="https://www.marenettobuild.com${peer.path}"`), `${entry.path} -> ${peer.path}`);
      const peerHtml = await htmlFor(peer);
      assert.ok(peerHtml.includes(`hreflang="ar" href="https://www.marenettobuild.com${entry.path}"`), `${peer.path} -> ${entry.path}`);
    }
  }
  assert.ok(!sitemap.includes('/__localization-review/'));
  assert.ok(!llms.includes('/__localization-review/'));
  assert.ok(!sitemap.includes('/ar/search'));
});

test('all released Arabic URLs return 200 with initial Arabic RTL and indexable canonical metadata', async () => {
  const topology = await editorialTopology({ publicIndexing: true });
  const headers = { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' };
  try {
    for (let offset = 0; offset < arabic.length; offset += 5) await Promise.all(arabic.slice(offset, offset + 5).map(async entry => {
      const response = await fetch(topology.origin + entry.path, { headers, redirect: 'manual' });
      assert.equal(response.status, 200, entry.path);
      const html = await response.text();
      assert.match(html, /<html\b[^>]*lang="ar"[^>]*dir="rtl"/, entry.path);
      assert.match(html, /name="robots" content="index, follow"/, entry.path);
      assert.ok(html.includes(`rel="canonical" href="https://www.marenettobuild.com${entry.path}"`), entry.path);
    }));
    const search = Object.values(manifest.editions).find(e => e.locale === 'ar' && e.kind === 'search');
    const response = await fetch(topology.origin + search.path, { headers });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  } finally { await topology.close(); }
});

test('Arabic archive review paths never produce soft-404 pages from historical family identifiers', async () => {
  assert.ok(!Object.keys(manifest.pages).some(path => path.startsWith('/__localization-review/ar/historical:')));
  const privateRtl = Object.entries(manifest.pages).filter(([path]) => /^\/__localization-review\/(?:ar|he)\//.test(path));
  assert.ok(privateRtl.length > 10, 'Preserve the existing private RTL previews');
  for (const [path, file] of privateRtl) {
    const html = await readFile(new URL(file, root), 'utf8');
    assert.ok(html.includes('class="site-shell"'), path);
    assert.doesNotMatch(plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? ''), /404.*Pagina non trovata/, path);
  }
});
