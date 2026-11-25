import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);
const mottos = JSON.parse(await readFile(new URL('src/content/brand-mottos.json', root), 'utf8'));
const locales = JSON.parse(await readFile(new URL('src/localization/locales.json', root), 'utf8'));
const expectedLocales = ['it', 'en', 'de', 'fr', 'es', 'nl', 'pt', 'pl', 'ru', 'sv', 'no', 'da', 'ar'];
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const paragraph = placement => new RegExp(`<p[^>]*data-brand-motto="corporate"[^>]*data-motto-placement="${placement}"[^>]*>(.*?)</p>`, 'g');

test('thirteen complete motto sets retain every supplied exact formulation', () => {
  assert.deepEqual(Object.keys(mottos).sort(), expectedLocales.sort());
  for (const values of Object.values(mottos)) {
    assert.deepEqual(Object.keys(values).sort(), ['atelier', 'corporate', 'sicilianFire']);
    for (const text of Object.values(values)) assert.ok(text.trim().length > 10);
  }
  assert.equal(mottos.it.corporate, 'Con tanta passione, nulla è impossibile.');
  assert.equal(mottos.en.corporate, 'With great passion, nothing is impossible.');
  assert.equal(mottos.de.corporate, 'Mit viel Leidenschaft ist nichts unmöglich.');
  assert.equal(mottos.fr.corporate, "Avec beaucoup de passion, rien n'est impossible.");
  assert.equal(mottos.it.sicilianFire, 'Fuoco, pietra e passione. Dalla Sicilia, ovunque.');
  assert.equal(mottos.en.sicilianFire, 'Fire, stone and passion. From Sicily, anywhere.');
  assert.equal(mottos.it.atelier, 'Se lo immagini, noi lo costruiamo.');
  assert.equal(mottos.en.atelier, 'If you can imagine it, we can build it.');
  assert.equal(locales.find(locale => locale.code === 'ar').publication, 'published');
});

test('all active home editions render one localized presentation motto and one footer motto', async () => {
  const vite = await createServer({
    configFile: new URL('vite.config.ts', root).pathname,
    server: { middlewareMode: true }, appType: 'custom',
  });
  try {
    const { render, editions, historicalInventory } = await vite.ssrLoadModule('/src/entry-server.tsx');
    const activeCodes = locales.filter(locale => locale.publication === 'published').map(locale => locale.code);
    const homes = editions.filter(edition => activeCodes.includes(edition.locale) &&
      (edition.id === 'home' || historicalInventory.some(page => page.path === edition.path && page.family === '/')));
    for (const code of activeCodes) assert.ok(homes.some(home => home.locale === code), `No home for ${code}`);
    for (const home of homes) {
      const { body } = await render(home.path, home.locale);
      for (const placement of ['home', 'footer']) {
        const matches = [...body.matchAll(paragraph(placement))];
        assert.equal(matches.length, 1, `${home.path}: ${placement}`);
        assert.equal(matches[0][1], escape(mottos[home.locale].corporate), home.path);
        assert.ok(matches[0][0].includes(`lang="${home.locale}"`));
      }
      assert.equal(body.split(escape(mottos[home.locale].corporate)).length - 1, 2, home.path);
      assert.equal((body.match(/<h1\b/g) ?? []).length, 1, home.path);
      assert.doesNotMatch(body.match(/<h1\b[^>]*>(.*?)<\/h1>/s)?.[1] ?? '', /data-brand-motto/);
    }
    // Core service shells share only the footer; no accidental new line/Atelier content.
    for (const locale of activeCodes) {
      const service = editions.find(edition => edition.id === 'services' && edition.locale === locale);
      assert.ok(service);
      const { body } = await render(service.path, locale);
      assert.equal([...body.matchAll(paragraph('footer'))].length, 1, service.path);
      assert.equal([...body.matchAll(paragraph('home'))].length, 0, service.path);
      assert.doesNotMatch(body, /data-brand-motto="(?:atelier|sicilianFire)"/);
    }
    const arabic = await render('/ar/', 'ar');
    assert.match(arabic.body, /data-brand-motto/);
    console.log(`Verified ${homes.length} home routes and ${activeCodes.length} service footers, including Arabic.`);
  } finally {
    await vite.close();
  }
});
