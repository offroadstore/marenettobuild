import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../dist/public/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('route-manifest.json', root), 'utf8'));
const editions = Object.values(manifest.editions);
const italian = editions.find(edition => edition.path === '/sicilia-e-trasferte');
const readPage = edition => readFile(new URL(manifest.pages[edition.path], root), 'utf8');
const mainOf = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? html;

test('one substantial travel page per active language, not a separate doorway per destination', async () => {
  assert.ok(italian);
  const family = editions.filter(edition => edition.id === italian.id);
  assert.equal(family.length, 12);
  const expected = ['Palermo', 'Taormina', 'Messina', 'Siracusa'];
  for (const edition of family) {
    const html = await readPage(edition);
    const main = mainOf(html);
    assert.ok(main.includes('60'), edition.path);
    assert.equal((main.match(/<h1\b/g) ?? []).length, 1, edition.path);
    assert.ok(main.replace(/<[^>]*>/g, ' ').length > 1800, edition.path);
    if (edition.locale === 'it') for (const city of expected) {
      assert.ok(main.includes(city), `${edition.path}: missing destination example ${city}`);
    }
    assert.ok(main.includes('data-testid="text-destinations-note"'), edition.path);
    assert.ok(html.includes('mailto:info@marenetto.com'), edition.path);
    const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .flatMap(match => JSON.parse(match[1])['@graph'] ?? []);
    assert.ok(graph.some(node => node['@type'] === 'Service'), edition.path);
    assert.ok(graph.some(node => node['@type'] === 'FAQPage'), edition.path);
  }
  // Only the owner-authorised twenty local pages, never four new city families.
  const placeIds = new Set(editions.filter(edition => edition.source.startsWith('phase3:') &&
    edition.id.startsWith('place-')).map(edition => edition.id));
  assert.equal(placeIds.size, 20);
  for (const city of expected) assert.ok(!placeIds.has(`place-${city.toLowerCase()}`));
});

test('ordinary zones, furniture and core services visibly explain conditional travel in their own language', async () => {
  assert.ok(italian);
  const travelPages = new Map(editions.filter(edition => edition.id === italian.id).map(edition => [edition.locale, edition.path]));
  const targets = editions.filter(edition => travelPages.has(edition.locale) &&
    (edition.id === 'services' || edition.id === 'zones' || edition.id === 'custom-furniture' ||
      (edition.source.startsWith('phase3:') && edition.id.startsWith('place-'))) &&
    manifest.pages[edition.path]);
  assert.equal(new Set(targets.map(edition => edition.locale)).size, 12);
  for (const edition of targets) {
    const main = mainOf(await readPage(edition));
    assert.ok(main.includes('60'), `No ordinary-area explanation: ${edition.path}`);
    assert.ok(main.includes(`href="${travelPages.get(edition.locale)}`), `No native travel link: ${edition.path}`);
  }
});

test('llms describes an ordinary area and project-dependent mobilisation, not an exclusive radius', async () => {
  const text = await readFile(new URL('../public/llms.txt', import.meta.url), 'utf8');
  assert.match(text, /area ordinaria/i);
  assert.match(text, /non un limite esclusivo/i);
  assert.match(text, /preventivo dedicato/i);
  assert.match(text, /trasferta.*logistica/i);
  assert.match(text, /contractor locale autorizzato/i);
  assert.match(text, /https:\/\/www\.marenettobuild\.com\/sicilia-e-trasferte/);
  assert.doesNotMatch(text, /prezzi più alti|solo entro|soltanto entro/i);
});
