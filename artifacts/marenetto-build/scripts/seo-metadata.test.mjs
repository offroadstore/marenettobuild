import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { homeMetadata } from '../src/localization/home-seo.mjs';
import { releaseMetadata, mergeActiveMetadata } from '../src/localization/public-seo.mjs';
import { renderDocument } from './seo-document.mjs';
import { publicEditions } from './public-release.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';

const root = new URL('../dist/public/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('route-manifest.json', root), 'utf8'));
const entries = Object.values(manifest.editions);
const unescape = value => value.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
const metadata = html => ({
  title: unescape(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''),
  ...Object.fromEntries(['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description'].map(key =>
    [key, unescape(html.match(new RegExp(`<meta\\b[^>]*(?:name|property)="${key}"[^>]*content="([^"]*)"`))?.[1] ?? '')])),
});
function check(html, label) {
  const m = metadata(html);
  assert.match(m.title, /Marenetto Build/, label);
  assert.doesNotMatch(m.title, /marenettobuild\.com/i, label);
  assert.ok(m.description.length >= 20, label);
  assert.equal(m['og:title'], m.title, label);
  assert.equal(m['og:description'], m.description, label);
  assert.equal(m['twitter:title'], m.title, label);
  assert.equal(m['twitter:description'], m.description, label);
  assert.equal((html.match(/<title>/g) ?? []).length, 1, label);
  return m;
}

test('all twelve home editions have native search copy before JavaScript', () => {
  assert.equal(Object.keys(homeMetadata).length, 12);
  const titles = new Set(), descriptions = new Set();
  for (const [locale, expected] of Object.entries(homeMetadata)) {
    const edition = { id: 'home', locale, path: locale === 'it' ? '/' : `/${locale}/`, title: 'Home | marenettobuild.com', description: 'Old generic description' };
    const html = renderDocument('<html><head><title>Old</title></head><body><div id="root"></div></body></html>', { edition, body: '<main><h1>Content</h1></main>' });
    const actual = check(html, locale);
    assert.equal(actual.title, expected.title);
    assert.equal(actual.description, expected.description);
    titles.add(actual.title); descriptions.add(actual.description);
  }
  assert.equal(titles.size, 12); assert.equal(descriptions.size, 12);
  assert.equal(homeMetadata.en.title, 'Renovation & Construction Company in Cefalù, Sicily | Marenetto Build');
  assert.equal(homeMetadata.de.title, 'Bauunternehmen & Hausrenovierung in Cefalù, Sizilien | Marenetto Build');
});

test('shared metadata keeps specific live SEO and replaces generic historical core labels', () => {
  const entry = { id: 'home', locale: 'en', path: '/en/', title: 'Home | marenettobuild.com', description: '' };
  const [generic] = mergeActiveMetadata([entry], [{ path: entry.path, revisionId: 'test', content: { seoTitle: entry.title } }]);
  assert.equal(releaseMetadata(generic).title, homeMetadata.en.title);
  const [specific] = mergeActiveMetadata([entry], [{ path: entry.path, revisionId: 'test', content: { seoTitle: 'Renovating your house in Cefalù', seoDescription: 'Specific description approved by the owner.' } }]);
  assert.deepEqual(releaseMetadata(specific), { title: 'Renovating your house in Cefalù | Marenetto Build', description: 'Specific description approved by the owner.' });
  const core = { ...entry, id: 'process', title: 'About us | marenettobuild.com', coreMetadata: { title: 'How we work in Cefalù | Marenetto Build', description: 'Construction project planning and communication in Cefalù.' } };
  assert.equal(releaseMetadata(core).title, core.coreMetadata.title);
});

test('guides and search have localized metadata rather than Italian fallbacks', () => {
  for (const id of ['guides', 'search']) {
    const titles = new Set(), descriptions = new Set();
    for (const locale of Object.keys(homeMetadata)) {
      const result = releaseMetadata({ id, locale, path: `/${locale}/${id}`, title: 'Ricerca | marenettobuild.com', description: 'Articoli di Marenetto Build: testi italiani.' });
      assert.match(result.title, /Marenetto Build/);
      if (locale !== 'it') assert.doesNotMatch(result.title + result.description, /Ricerca|testi italiani|Guide pratiche/);
      titles.add(result.title); descriptions.add(result.description);
    }
    assert.equal(titles.size, 12); assert.equal(descriptions.size, 12);
  }
});

test('every served edition has complete initial HTML metadata; sitemap metadata are unique', async () => {
  const topology = await editorialTopology({ publicIndexing: true });
  const rows = [];
  try {
    // A plain HTTP fetch executes no JavaScript.
    for (let i = 0; i < entries.length; i += 8) {
      await Promise.all(entries.slice(i, i + 8).map(async edition => {
        const response = await fetch(topology.origin + edition.path, { redirect: 'manual', headers: { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' } });
        const html = await response.text();
        const row = { path: edition.path, locale: edition.locale, status: response.status };
        if (response.status === 200) {
          Object.assign(row, check(html, edition.path));
          if (edition.id === 'home') assert.equal(row.title, homeMetadata[edition.locale].title);
        } else assert.ok([301, 302, 307, 308, 404, 410, 503].includes(response.status), `${edition.path}: HTTP ${response.status}`);
        rows.push(row);
      }));
    }
    const indexed = new Set(publicEditions(manifest, []).map(e => e.path));
    const titles = new Map(), descriptions = new Map();
    const duplicates = [];
    for (const row of rows.filter(r => indexed.has(r.path))) {
      assert.equal(row.status, 200, row.path);
      for (const [key, seen] of [['title', titles], ['description', descriptions]]) {
        if (seen.has(row[key])) duplicates.push({ field: key, paths: [seen.get(row[key]), row.path], value: row[key] });
        else seen.set(row[key], row.path);
      }
    }
    const report = new URL('../../../generated-artifacts/seo-audit/metadata-http.json', import.meta.url);
    await mkdir(new URL('.', report), { recursive: true });
    await writeFile(report, JSON.stringify({ source: 'Local actual production server; synthetic empty editorial snapshot; no browser JavaScript', indexed: indexed.size, duplicates, rows: rows.sort((a,b) => a.path.localeCompare(b.path)) }, null, 2));
    assert.deepEqual(duplicates, [], 'Duplicate metadata on indexable canonical pages');
    assert.equal(new Set(rows.filter(r => r.status === 200).map(r => r.locale)).size, 12);
  } finally { await topology.close(); }
});

test('live editorial rendering also sends the shared SEO metadata in the initial response', async () => {
  const article = entries.find(e => e.locale === 'en' && e.kind === 'article' && /^[\x00-\x7F]*$/.test(e.path));
  assert.ok(article);
  const snapshot = [{
    identity: article.id, locale: 'en', path: article.path, kind: 'article', revisionId: 'synthetic-metadata-check',
    content: {
      title: 'Synthetic editorial heading', summary: 'Synthetic summary', body: '<p>Synthetic local test content.</p>',
      category: 'Test', tags: [], image: '', imageAlt: '', sources: [],
      seoTitle: 'Specific editorial SEO for renovation in Cefalù',
      seoDescription: 'Specific SEO description supplied with a synthetic active revision for this local test.',
      contentLanguage: 'en',
    },
  }];
  const topology = await editorialTopology({ publicIndexing: true, snapshot });
  try {
    for (const edition of [article, ...entries.filter(e => e.id === 'home' && ['en','de'].includes(e.locale)), entries.find(e => e.id === 'services' && e.locale === 'en')]) {
      const response = await fetch(topology.origin + edition.path, { headers: { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' } });
      assert.equal(response.status, 200, edition.path);
      const html = await response.text();
      const actual = check(html, edition.path);
      const expected = releaseMetadata(mergeActiveMetadata([edition], snapshot)[0], html, publicEditions(manifest, snapshot));
      assert.equal(actual.title, expected.title, edition.path);
      assert.equal(actual.description, expected.description, edition.path);
    }
  } finally { await topology.close(); }
});
