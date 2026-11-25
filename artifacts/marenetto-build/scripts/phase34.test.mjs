import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { editorialTopology } from './test-support/editorial-topology.mjs';

const root = new URL('../dist/public/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('route-manifest.json', root), 'utf8'));
const registry = JSON.parse(await readFile(new URL('../src/localization/locales.json', import.meta.url), 'utf8'));
const active = registry.filter(locale => locale.publication === 'published').map(locale => locale.code).sort();
const entries = Object.values(manifest.editions);
const places = ['cefalu', 'lascari', 'campofelice-di-roccella', 'collesano', 'gratteri', 'isnello',
  'castelbuono', 'pollina', 'san-mauro-castelverde', 'castel-di-tusa', 'termini-imerese',
  'caccamo', 'polizzi-generosa', 'petralia-sottana', 'petralia-soprana', 'gangi', 'geraci-siculo',
  'cerda', 'sciara', 'trabia'];
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"')
  .replaceAll('&#x27;', "'").replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const headValue = (html, name) => decode(html.match(new RegExp(`<meta\\b[^>]*(?:name|property)="${name}"[^>]*content="([^"]*)"`))?.[1] ?? '');
const text = html => decode(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
const italian = entries.filter(entry => entry.locale === 'it' &&
  (entry.path === '/zone-servite' || entry.path.startsWith('/zone-servite/') ||
    entry.path === '/arredi-su-misura-cemento-microcemento' || entry.path === '/uso-intelligenza-artificiale' ||
    entry.path === '/sicilia-e-trasferte'));
const newIds = new Set(italian.map(entry => entry.id));
const fresh = entries.filter(entry => newIds.has(entry.id));
const pageHtml = entry => readFile(new URL(manifest.pages[entry.path], root), 'utf8');

test('an editorial withdrawal overrides a new static service page rather than republishing it', async () => {
  const { render } = await import('../dist/server/entry-server.mjs');
  const result = await render('/zone-servite/cefalu', 'it', [{
    identity: 'place-cefalu', locale: 'it', path: '/zone-servite/cefalu', kind: 'page',
    revisionId: 'withdrawn', content: { title: 'Ritirato', summary: '', body: '', category: '',
      tags: [], image: '', imageAlt: '', sources: [], seoTitle: '', seoDescription: '', contentLanguage: 'it' },
  }]);
  assert.doesNotMatch(result.body, /data-testid="page-place-cefalu"|data-testid="text-place-brief"/);
  assert.ok(result.body.includes('<h1'));
});

test('ordinary places, index, furniture, AI and travel have complete active-language families', () => {
  assert.equal(active.length, 13);
  assert.equal(italian.length, 24);
  assert.equal(fresh.length, 24 * active.length);
  for (const slug of places) assert.ok(italian.some(entry => entry.path === `/zone-servite/${slug}`), slug);
  for (const entry of italian) {
    const family = fresh.filter(candidate => candidate.id === entry.id);
    assert.deepEqual(family.map(candidate => candidate.locale).sort(), active, entry.path);
    assert.equal(new Set(family.map(candidate => candidate.path)).size, active.length);
    for (const candidate of family) {
      assert.equal(candidate.contentLanguage, candidate.locale);
      assert.equal(candidate.state, 'published');
      assert.equal(candidate.sitemap, true);
    }
  }
});

test('all new pages have complete initial HTML, coherent schema, unique metadata and working local links', async () => {
  const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8');
  const titles = new Set(), descriptions = new Set(), localBodies = new Map();
  for (const entry of fresh) {
    const html = await pageHtml(entry);
    const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
    const description = headValue(html, 'description');
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, entry.path);
    assert.ok(title.includes('Marenetto Build'), entry.path);
    assert.ok(description.length >= 40, entry.path);
    assert.ok(!titles.has(title), `Duplicate title: ${entry.path}`);
    assert.ok(!descriptions.has(description), `Duplicate description: ${entry.path}`);
    titles.add(title); descriptions.add(description);
    assert.equal(headValue(html, 'og:title'), title, entry.path);
    assert.equal(headValue(html, 'og:description'), description, entry.path);
    assert.equal(headValue(html, 'og:url'), `https://www.marenettobuild.com${entry.path}`, entry.path);
    assert.ok(html.includes(`rel="canonical" href="https://www.marenettobuild.com${entry.path}"`), entry.path);
    assert.ok(sitemap.includes(`<loc>https://www.marenettobuild.com${entry.path}</loc>`), entry.path);
    for (const peer of fresh.filter(candidate => candidate.id === entry.id)) {
      assert.ok(html.includes(`hreflang="${peer.locale === 'it' ? 'it-IT' : peer.locale}" href="https://www.marenettobuild.com${peer.path}"`), entry.path);
    }
    assert.equal(headValue(html, 'robots'), 'noindex, nofollow', 'Build assets must remain preview-safe');
    assert.ok(html.includes('tel:+393339363007'), entry.path);
    assert.ok(html.includes('mailto:info@marenetto.com'), entry.path);
    assert.doesNotMatch(html, /info@marenettobuild\.com/i, entry.path);
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
    assert.ok(text(main).length > 400, `Incomplete server content at ${entry.path}`);
    const graphs = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .flatMap(match => JSON.parse(match[1])['@graph'] ?? []);
    const organization = graphs.find(node => [node['@type']].flat().includes('GeneralContractor'));
    assert.ok(organization, entry.path);
    assert.equal(organization.areaServed.length, 24, entry.path);
    assert.ok(organization.areaServed.some(place => place.name === 'Madonie'));
    assert.ok(organization.areaServed.some(place => place.name === 'Castel di Tusa' && place['@type'] === 'Place'));
    assert.ok(organization.areaServed.some(place => place.name === 'Sicilia' && place['@type'] === 'AdministrativeArea'));
    assert.ok(organization.areaServed.some(place => place.name === 'Italia' && place['@type'] === 'Country'));
    assert.ok(organization.areaServed.some(place => place.name === 'Worldwide (on request)'));
    assert.equal(organization.telephone, '+393339363007');
    assert.equal(organization.email, 'info@marenetto.com');
    assert.ok(!graphs.some(node => ['Review', 'AggregateRating'].includes(node['@type'])), entry.path);
    for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
      const href = new URL(decode(match[1]), 'https://www.marenettobuild.com').pathname;
      const normalized = href.replace(/\/+$/, '') || '/';
      if (/\.[a-z0-9]+$/i.test(normalized)) continue;
      assert.ok(Object.keys(manifest.pages).some(path => (path.replace(/\/+$/, '') || '/') === normalized) ||
        manifest.redirects[normalized], `Broken local link ${entry.path} -> ${href}`);
    }
    if (places.some(slug => entry.id === `place-${slug}`)) {
      let brief = text(main.match(/<p\b[^>]*data-testid="text-place-brief"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '');
      assert.ok(brief.length >= 100, `Missing original local brief at ${entry.path}`);
      // Inspect the editorial paragraph, not differing menus or city names.
      for (const place of organization.areaServed) brief = brief.replaceAll(place.name, '');
      const key = `${entry.locale}:${brief.toLowerCase()}`;
      assert.ok(!localBodies.has(key), `City-token-only local paragraph at ${entry.path}`);
      localBodies.set(key, entry.path);
    }
  }
});

test('privacy and AI link reciprocally; worldwide furniture has Service and no invented product', async () => {
  const privacy = await pageHtml(entries.find(entry => entry.path === '/privacy'));
  assert.ok(privacy.includes('href="/uso-intelligenza-artificiale"'));
  for (const entry of fresh.filter(candidate => candidate.id === italian.find(page => page.path === '/uso-intelligenza-artificiale')?.id)) {
    assert.ok((await pageHtml(entry)).includes(`href="${entry.locale === 'it' ? '' : '/' + entry.locale}/privacy"`), entry.path);
  }
  const premium = italian.find(entry => entry.path === '/arredi-su-misura-cemento-microcemento');
  assert.ok(premium, 'Premium service page');
  for (const entry of fresh.filter(candidate => candidate.id === premium.id)) {
    const html = await pageHtml(entry);
    const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .flatMap(match => JSON.parse(match[1])['@graph'] ?? []);
    assert.ok(graph.some(node => node['@type'] === 'Service'), entry.path);
    assert.ok(!graph.some(node => ['Product', 'Offer'].includes(node['@type'])), entry.path);
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
    assert.doesNotMatch(main, /<img\b/, 'No illustrative image should masquerade as a finished furniture project');
  }
});

test('candidate production server serves new URLs indexably only on the authorised host', async () => {
  const server = await editorialTopology({ publicIndexing: true, viaProxy: true });
  const headers = { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' };
  try {
    for (const entry of fresh) {
      const response = await fetch(server.origin + entry.path, { headers, redirect: 'manual' });
      assert.equal(response.status, 200, entry.path);
      assert.equal(response.headers.get('x-robots-tag'), null, entry.path);
      const html = await response.text();
      assert.equal(headValue(html, 'robots'), 'index, follow', entry.path);
      assert.equal(headValue(html, 'og:url'), `https://www.marenettobuild.com${entry.path}`);
    }
    const preview = await fetch(server.origin + '/zone-servite', { headers: {
      'x-forwarded-host': 'preview.invalid', 'x-forwarded-proto': 'https',
    } });
    assert.match(headValue(await preview.text(), 'robots'), /noindex/);
  } finally { await server.close(); }
});
