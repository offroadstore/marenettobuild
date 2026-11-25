import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const root = new URL('../dist/public/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('route-manifest.json', root), 'utf8'));
const entries = Object.values(manifest.editions);
const family = entries.filter(e => e.id === 'property-management');
const locales = ['it', 'en', 'fr', 'de', 'nl', 'es', 'pt', 'ru', 'pl', 'sv', 'no', 'da', 'ar'];
const pageHtml = entry => readFile(new URL(manifest.pages[entry.path], root), 'utf8');
const plain = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8');

test('one canonical property-management family covers all active languages without collisions', () => {
  assert.deepEqual(family.map(e => e.locale).sort(), [...locales].sort());
  assert.equal(new Set(family.map(e => e.path)).size, 13);
  assert.equal(family.find(e => e.locale === 'it').path, '/gestione-affitti-brevi-cefalu');
  for (const entry of family) {
    assert.equal(entries.filter(e => e.path.replace(/\/+$/, '') === entry.path).length, 1);
    assert.equal(entry.contentLanguage, entry.locale);
    assert.equal(entry.sitemap, true);
    assert.equal(entry.state, 'published');
    assert.ok(sitemap.includes(`<loc>https://www.marenettobuild.com${entry.path}</loc>`));
  }
});

test('initial HTML has substantial native content, reciprocal SEO, visible FAQ and distinct partner schema', async () => {
  const titles = new Set(), descriptions = new Set(), bodies = new Set();
  for (const entry of family) {
    const html = await pageHtml(entry);
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, entry.path);
    // Content target is approximate, not a reason to pad a concise translation.
    assert.ok(plain(main).split(/\s+/).length >= 520, `Thin content: ${entry.path}`);
    assert.ok(!bodies.has(plain(main)), entry.path); bodies.add(plain(main));
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const description = html.match(/name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && !titles.has(title), entry.path); titles.add(title);
    assert.ok(description && !descriptions.has(description), entry.path); descriptions.add(description);
    assert.ok(html.includes(`rel="canonical" href="https://www.marenettobuild.com${entry.path}"`));
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    for (const peer of family) assert.ok(html.includes(`hreflang="${peer.locale === 'it' ? 'it-IT' : peer.locale}" href="https://www.marenettobuild.com${peer.path}"`), entry.path);
    const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1])['@graph'] ?? []);
    const service = graph.find(n => n['@type'] === 'Service');
    assert.equal(service.provider['@id'], 'https://www.marenettobuild.com/#organization');
    assert.equal(service.inLanguage, entry.locale);
    assert.ok(graph.some(n => n['@type'] === 'Organization' && n.name === 'Cefalù Apartments'));
    assert.ok(graph.some(n => n['@type'] === 'BreadcrumbList'));
    const faq = graph.find(n => n['@type'] === 'FAQPage');
    assert.ok(faq.mainEntity.length >= 3);
    for (const q of faq.mainEntity) {
      const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll("'", '&#x27;').replaceAll('"', '&quot;');
      assert.ok(main.includes(escape(q.name)), q.name);
      assert.ok(main.includes(escape(q.acceptedAnswer.text)), q.name);
    }
    assert.doesNotMatch(JSON.stringify(graph), /"@type":"(?:Review|AggregateRating|partner)"/);
    assert.match(main, /CIN/); assert.match(main, /2008/); assert.match(main, /Booking/);
    assert.match(main, /https:\/\/www.cefaluapartments.it/);
    assert.match(main, /https:\/\/wa.me\/393339363007\?text=/);
    assert.match(html, /mailto:info@marenetto.com/);
    assert.doesNotMatch(main, /Rentero|24\/7|<iframe|<form|<script[^>]*src=/i);
    assert.match(main, /[?&](?:amp;)?service=property_care/);
    for (const match of main.matchAll(/href="(\/[^"#]*)"/g)) {
      const url = new URL(match[1].replaceAll('&amp;', '&'), 'https://www.marenettobuild.com');
      assert.ok(manifest.pages[url.pathname] || manifest.redirects?.[url.pathname], `${entry.path} -> ${url.pathname}`);
      if (url.searchParams.has('service')) assert.deepEqual([...url.searchParams], [['service', 'property_care']]);
    }
  }
});

test('existing public entry points link to the localized service, including recovered homes and renovations', async () => {
  for (const entry of family) {
    const localeEntries = entries.filter(e => e.locale === entry.locale);
    const sources = localeEntries.filter(e => ['home', 'services', 'abroad', 'service-local'].includes(e.id) ||
      e.id === 'historical:/ristrutturazioni-chiavi-in-mano-cefalu-e-palermo-marenetto' || e.id === 'historical:/general-contractor');
    assert.ok(sources.length >= 3, entry.locale);
    for (const source of sources) assert.ok((await pageHtml(source)).includes(`href="${entry.path}"`), `${source.path} -> ${entry.path}`);
  }
});

test('preselection accepts only known service codes and never copies visitor values', async () => {
  const compiled = await build({ entryPoints: [new URL('../src/lib/request-service.ts', import.meta.url).pathname], bundle: true, write: false, format: 'esm' });
  const { requestServiceSelection } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
  assert.equal(requestServiceSelection('?service=property_care'), 'property_care');
  assert.equal(requestServiceSelection('?service=bespoke-furniture'), 'bespoke-furniture');
  assert.equal(requestServiceSelection('?service=local-building'), 'renovation');
  for (const search of ['', '?service=unknown', '?service=property_care&service=other', '?service=synthetic%40example.invalid']) assert.equal(requestServiceSelection(search), undefined);
  assert.equal(requestServiceSelection('?service=property_care&name=Synthetic&email=synthetic%40example.invalid'), 'property_care');
});

test('document language changes before the production metadata early return', async () => {
  const compiled = await build({
    entryPoints: [new URL('../src/components/InformationMetadata.tsx', import.meta.url).pathname],
    bundle: true, write: false, format: 'esm',
    plugins: [{ name: 'metadata-hooks', setup(b) {
      b.onResolve({ filter: /^(react|wouter|@\/)/ }, args => ({ path: args.path, namespace: 'metadata-test' }));
      b.onLoad({ filter: /.*/, namespace: 'metadata-test' }, args => ({ loader: 'js', contents:
        args.path === 'react' ? 'export const useEffect=fn=>fn();' :
        args.path === 'wouter' ? 'export const useLocation=()=>["/en/short-let-property-management-cefalu"];' :
        args.path.endsWith('edition-inventory') ? 'export const editionByPath=new Map();' :
        args.path.endsWith('structured-data') ? 'export const updateStructuredData=()=>{};' :
        args.path.endsWith('public-release-meta') ? 'export const applyPublicReleaseMetadata=()=>true; export const PUBLIC_SITE_ORIGIN="https://www.marenettobuild.com";' :
        args.path.endsWith('editorial-runtime') ? 'export const useActiveEditorial=()=>[];' :
        'export const getLocaleDirection=lang=>lang==="ar"?"rtl":"ltr";',
      }));
    } }],
  });
  const { InformationMetadata } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
  const previous = globalThis.document;
  try {
    globalThis.document = { documentElement: { lang: 'it-IT', dir: 'ltr' } };
    InformationMetadata({ lang: 'en' });
    assert.equal(document.documentElement.lang, 'en');
    assert.equal(document.documentElement.dir, 'ltr');
    InformationMetadata({ lang: 'it' });
    assert.equal(document.documentElement.lang, 'it-IT');
  } finally { if (previous) globalThis.document = previous; else delete globalThis.document; }
});
