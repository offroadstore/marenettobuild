import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';

process.env.PORT ||= '4188';
process.env.BASE_PATH ||= '/';
test('Arabic client navigation retains indexability, reciprocal verified peers and localized Service schema', async () => {
  const vite = await createServer({ configFile: new URL('../vite.config.ts', import.meta.url).pathname,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const savedDocument = globalThis.document, savedWindow = globalThis.window;
  try {
    const { applyPublicReleaseMetadata } = await vite.ssrLoadModule('/src/lib/public-release-meta.ts');
    const nodes = [];
    const matches = (node, selector) => node.tag === selector.split('[')[0] &&
      [...selector.matchAll(/\[([^\]=]+)(?:="([^"]*)")?\]/g)].every(([, key, value]) =>
        value === undefined ? node.getAttribute(key) !== undefined : node.getAttribute(key) === value);
    const head = {
      querySelector: selector => nodes.find(n => matches(n, selector)),
      querySelectorAll: selector => nodes.filter(n => matches(n, selector)),
      appendChild: node => nodes.push(node),
    };
    globalThis.document = {
      title: '', documentElement: { dataset: { publicIndexing: 'true' } }, head,
      querySelector: selector => selector === 'main' ? { outerHTML: '<main><h1>أتيليه مارينيتو</h1></main>' } : head.querySelector(selector),
      createElement: tag => ({
        tag, attrs: {}, textContent: '',
        setAttribute(key, value) { this.attrs[key] = value; },
        getAttribute(key) { return this.attrs[key] ?? this[key]; },
        remove() { nodes.splice(nodes.indexOf(this), 1); },
      }),
    };
    globalThis.window = { location: { hostname: 'www.marenettobuild.com' } };
    const path = '/ar/atelier-marenetto-outdoor-kitchens';
    assert.equal(applyPublicReleaseMetadata(path, []), true);
    assert.match(document.title, /\p{Script=Arabic}/u);
    assert.equal(head.querySelector('meta[name="robots"]').getAttribute('content'), 'index, follow');
    assert.equal(head.querySelector('link[rel="canonical"]').href, 'https://www.marenettobuild.com' + path);
    let links = head.querySelectorAll('link[rel="alternate"][hreflang]');
    assert.equal(links.length, 14); // Thirteen locales plus the Italian x-default.
    assert.equal(new Set(links.map(link => link.hreflang)).size, links.length);
    const graph = JSON.parse(head.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
    assert.equal(graph.find(n => n['@type'] === 'Service').inLanguage, 'ar');
    assert.equal(graph.find(n => n['@type'] === 'Service').areaServed.name, 'Worldwide');
    assert.ok(!graph.some(n => ['Offer', 'Product'].includes(n['@type'])));
    applyPublicReleaseMetadata('/ar/how-we-work', []);
    assert.equal(document.documentElement.lang,'ar');
    assert.equal(document.documentElement.dir,'rtl');
    links = head.querySelectorAll('link[rel="alternate"][hreflang]');
    const manifest = JSON.parse(await readFile(new URL('../dist/public/route-manifest.json', import.meta.url), 'utf8'));
    const initial = await readFile(new URL('../dist/public/' + manifest.pages['/ar/how-we-work'], import.meta.url), 'utf8');
    const expected = [...initial.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(([, locale, href]) => `${locale}:${href}`).sort();
    assert.deepEqual(links.map(link => `${link.hreflang}:${link.href}`).sort(), expected, 'Client peers must match initial HTML, without held counterparts');
    assert.ok(!links.some(link => link.href === 'https://www.marenettobuild.com/chi-siamo/'));
    // An indexable professional page must not carry its release status into
    // the adjacent empty resources area, including on client navigation.
    for (const professionalPath of ['/professionisti', '/ar/lil-muhandisin-al-miamariyin']) {
      assert.equal(applyPublicReleaseMetadata(professionalPath, []), true);
      assert.equal(head.querySelector('meta[name="robots"]').getAttribute('content'), 'index, follow');
      assert.equal(head.querySelectorAll('link[rel="alternate"][hreflang]').length, 14);
      const resource = professionalPath + (professionalPath.startsWith('/ar/') ? '/al-malaffat' : '/file-in-arrivo');
      assert.equal(applyPublicReleaseMetadata(resource, []), true);
      assert.equal(head.querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
      assert.equal(head.querySelectorAll('link[rel="alternate"][hreflang]').length, 0);
      assert.equal(head.querySelector('link[rel="canonical"]').href, 'https://www.marenettobuild.com' + resource);
    }
    window.location.hostname = 'preview.example.test';
    applyPublicReleaseMetadata(path, []);
    assert.equal(head.querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
    assert.equal(head.querySelectorAll('link[rel="alternate"][hreflang]').length, 0);
    window.location.hostname = 'www.marenettobuild.com';
    const catalog=JSON.parse(await readFile(new URL('../../../generated-artifacts/editorial/catalog.json',import.meta.url),'utf8'));
    const {seriesRelease}=await vite.ssrLoadModule('/src/content/series-release.mjs');
    const active=catalog.seriesDrafts.map(seed=>{
      const record=seriesRelease.records.find(r=>r.identity===seed.identity&&r.locale===seed.locale);
      return {...seed,path:record.path,revisionId:`synthetic-${seed.identity}-${seed.locale}`,revisionHash:record.hash,sourceHash:record.sourceHash};
    });
    for(const locale of ['it','de','it']) {
      const edition=active.find(e=>e.locale===locale&&e.content.guide.episode===1);
      assert.equal(applyPublicReleaseMetadata(edition.path,active),true);
      assert.equal(document.documentElement.lang,locale==='it'?'it-IT':locale);
      assert.equal(document.documentElement.dir,'ltr');
      assert.equal(head.querySelector('meta[property="og:locale"]').getAttribute('content'),locale==='it'?'it_IT':locale);
      assert.equal(head.querySelector('meta[name="robots"]').getAttribute('content'),'index, follow');
      assert.equal(head.querySelector('link[rel="canonical"]').href,'https://www.marenettobuild.com'+edition.path);
      const graphs=head.querySelectorAll('script[type="application/ld+json"]').flatMap(s=>JSON.parse(s.textContent)['@graph']);
      assert.equal(graphs.filter(s=>s['@type']==='GeneralContractor').length,1);
      assert.equal(graphs.filter(s=>s['@type']==='Article').length,1);
      assert.equal(graphs.filter(s=>s['@type']==='FAQPage').length,1);
      assert.equal(head.querySelectorAll('link[rel="alternate"][hreflang]').length,13);
    }
  } finally {
    if (savedDocument === undefined) delete globalThis.document; else globalThis.document = savedDocument;
    if (savedWindow === undefined) delete globalThis.window; else globalThis.window = savedWindow;
    await vite.close();
  }
});
