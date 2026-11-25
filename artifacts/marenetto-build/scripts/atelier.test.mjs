import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, access } from 'node:fs/promises';
import { copyWest } from '../src/content/atelier/copy-west.ts';
import { copyNorth } from '../src/content/atelier/copy-north.ts';

const copy = { ...copyWest, ...copyNorth };
const locales = ['it', 'en', 'fr', 'de', 'nl', 'es', 'pt', 'ru', 'pl', 'sv', 'no', 'da', 'ar'];
const len = s => [...s].length;
const all = c => JSON.stringify(c);

test('thirteen Atelier editions with SEO lengths and six steps in owner order', () => {
  assert.deepEqual(Object.keys(copy).sort(), [...locales].sort());
  const titles = new Set(), descs = new Set();
  for (const [locale, c] of Object.entries(copy)) {
    assert.ok(len(c.title) >= 50 && len(c.title) <= 60, `${locale} title ${len(c.title)}`);
    assert.ok(len(c.description) >= 140 && len(c.description) <= 160, `${locale} description ${len(c.description)}`);
    assert.ok(c.title.endsWith('| Marenetto Build'));
    titles.add(c.title); descs.add(c.description);
    assert.equal(c.steps.length, 6, locale);
    assert.equal(c.settings.length, 4, locale);
    assert.match(c.near[0], /60/); assert.match(c.far[0], /60/);
  }
  assert.equal(titles.size, 13); assert.equal(descs.size, 13);
  assert.equal(copy.en.steps.map(s => s[0]).join('|'), 'Confidential enquiry|Your measurements or plans|3D renders|Your approval|Materials prepared in Sicily and shipped|The Marenetto team builds on site');
});

test('no prices, emojis, invented proof or Latin-only Arabic body', () => {
  for (const [locale, c] of Object.entries(copy)) {
    const text = all(c);
    assert.doesNotMatch(text, /[€$£]\s?\d|\d\s?(?:€|EUR|USD|AED)/, locale);
    assert.doesNotMatch(text, /\p{Extended_Pictographic}/u, locale);
    assert.doesNotMatch(text, /ISO \d|certified|certificat/i, locale);
  }
  const arabic = Object.entries(copy.ar).filter(([k]) => !['slug', 'title', 'nav'].includes(k)).map(([, v]) => JSON.stringify(v)).join(' ');
  const latinWords = arabic.match(/\b[A-Za-z]{4,}\b/g) ?? [];
  assert.ok(latinWords.length < 3, `Latin words in Arabic body: ${latinWords}`);
});

const dist = new URL('../dist/public/', import.meta.url);
const built = await access(new URL('route-manifest.json', dist)).then(() => true, () => false);
test('built Atelier pages: SSR body, reciprocal hreflang, Worldwide Service, no Product/Offer, sitemap', { skip: !built && 'dist not built' }, async () => {
  const manifest = JSON.parse(await readFile(new URL('route-manifest.json', dist), 'utf8'));
  const family = Object.values(manifest.editions).filter(e => e.id === 'atelier');
  assert.equal(family.filter(e => e.locale !== 'ar').length, 12);
  const { ARABIC_PUBLIC_RELEASE } = await import('../src/localization/arabic-release.ts');
  if (!ARABIC_PUBLIC_RELEASE) assert.ok(!family.some(e => e.locale === 'ar'), 'Arabic must stay held');
  else assert.equal(family.length, 13, 'Every Atelier edition, including Arabic, must be complete');
  const sitemap = await readFile(new URL('sitemap.xml', dist), 'utf8');
  for (const entry of family) {
    const html = await readFile(new URL(manifest.pages[entry.path], dist), 'utf8');
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.ok(html.includes('data-testid="step-atelier-6"'), entry.path);
    for (const peer of family) assert.ok(html.includes(`href="https://www.marenettobuild.com${peer.path}"`), entry.path);
    const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1])['@graph'] ?? []);
    const service = graph.find(n => n['@type'] === 'Service');
    assert.equal(service.areaServed.name, 'Worldwide');
    assert.ok(!graph.some(n => ['Product', 'Offer', 'Review', 'AggregateRating'].includes(n['@type'])));
    assert.ok(sitemap.includes(`<loc>https://www.marenettobuild.com${entry.path}</loc>`));
  }
});
