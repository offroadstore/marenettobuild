import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';

process.env.PORT ||= '4188';
process.env.BASE_PATH ||= '/';
test('Arabic client navigation retains indexability, reciprocal verified peers and localized Service schema', async () => {
  const vite = await createServer({ configFile: new URL('../vite.config.ts', import.meta.url).pathname, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
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
    links = head.querySelectorAll('link[rel="alternate"][hreflang]');
    const manifest = JSON.parse(await readFile(new URL('../dist/public/route-manifest.json', import.meta.url), 'utf8'));
    const initial = await readFile(new URL('../dist/public/' + manifest.pages['/ar/how-we-work'], import.meta.url), 'utf8');
    const expected = [...initial.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(([, locale, href]) => `${locale}:${href}`).sort();
    assert.deepEqual(links.map(link => `${link.hreflang}:${link.href}`).sort(), expected, 'Client peers must match initial HTML, without held counterparts');
    assert.ok(!links.some(link => link.href === 'https://www.marenettobuild.com/chi-siamo/'));
    window.location.hostname = 'preview.example.test';
    applyPublicReleaseMetadata(path, []);
    assert.equal(head.querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
    assert.equal(head.querySelectorAll('link[rel="alternate"][hreflang]').length, 0);
  } finally {
    if (savedDocument === undefined) delete globalThis.document; else globalThis.document = savedDocument;
    if (savedWindow === undefined) delete globalThis.window; else globalThis.window = savedWindow;
    await vite.close();
  }
});
