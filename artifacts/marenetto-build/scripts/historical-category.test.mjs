import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const root = new URL('../src/content/', import.meta.url);
const moduleURL = async file => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(await readFile(new URL(file, root), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`;
const homeURL = await moduleURL('historical-home.ts');
const categoryCode = ts.transpileModule(await readFile(new URL('historical-category.ts', root), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace("'./historical-home'", JSON.stringify(homeURL));
const { extractHistoricalCategory, CATEGORY_FAMILIES, isCategoryFamily } = await import(`data:text/javascript;base64,${Buffer.from(categoryCode).toString('base64')}`);
const { plainText } = await import(homeURL);
const { recoverArticleThumbnails } = await import(await moduleURL('historical-thumbnails.ts'));
const index = JSON.parse(await readFile(new URL('historical/index.json', root), 'utf8'));
const media = JSON.parse(await readFile(new URL('historical-media.json', root), 'utf8'));
const expectedCounts = [1, 7, 0, 0, 5, 1];

test('only the six editorial families use the adapter', () => {
  assert.equal(CATEGORY_FAMILIES.size, 6);
  for (const family of ['/', '/articoli', '/gestione-manutenzione-immobile', '/contatti']) assert.equal(isCategoryFamily(family), false);
  assert.equal(index.filter(p => isCategoryFamily(p.family)).length, 54);
});

for (const page of index.filter(p => isCategoryFamily(p.family))) {
  test(`${page.path}: preserve original result order, excerpts, images and separate widgets`, async () => {
    const catalog = JSON.parse(await readFile(new URL(`historical/${page.locale}.json`, root), 'utf8'));
    const original = catalog[page.key].html;
    const covers = Object.fromEntries(index.filter(p => p.locale === page.locale && p.kind === 'article').flatMap(p => catalog[p.key]?.image ? [[p.key, catalog[p.key].image]] : []));
    let html = recoverArticleThumbnails(original, covers);
    for (const [from, to] of Object.entries(media)) html = html.replaceAll(from.replaceAll('&', '&amp;'), to).replaceAll(from, to);
    const data = extractHistoricalCategory(html);
    const resultRegion = html.split(/<h4\b[^>]*>(?!\s*<a\b)/i)[0];
    const headings = [...resultRegion.matchAll(/<h4[^>]*>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h4>/gi)];
    assert.deepEqual(data.articles.map(a => [a.href, a.title]), headings.map(h => [h[1], plainText(h[2])]));
    assert.equal(data.articles.length, expectedCounts[[...CATEGORY_FAMILIES].indexOf(page.family)]);
    assert.equal(new Set(data.articles.map(a => a.href)).size, data.articles.length);
    assert.equal(data.categories.links.length, 6);
    assert.equal(data.categories.links.filter(l => l.href === page.path).length, 1);
    assert.equal(data.latest.links.length, 5);
    assert.equal(data.breadcrumb.at(-1).label, page.h1);
    if (!data.articles.length) assert.ok(data.emptyMessage && plainText(original).includes(data.emptyMessage));
    for (const article of data.articles) {
      assert.ok(article.excerpt && plainText(original).includes(article.excerpt));
      assert.ok(article.readLabel && plainText(original).includes(article.readLabel));
      assert.ok(article.image?.startsWith('/api/historical-media/'), `Local recovered photo: ${article.href}`);
      assert.ok(html.includes(article.image));
    }
    for (const group of [data.categories, data.latest, data.tags].filter(Boolean)) {
      assert.ok(plainText(original).includes(group.heading));
      for (const link of group.links) assert.ok(plainText(original).includes(link.label));
    }
    assert.equal(catalog[page.key].html, original, 'Source catalog remains untouched');
    assert.deepEqual(extractHistoricalCategory(html), data, 'Extraction is deterministic');
  });
}

test('an unavailable document never substitutes archived category content', () => {
  const data = extractHistoricalCategory('');
  assert.deepEqual(data.articles, []);
  assert.equal(data.categories, null);
  assert.equal(data.latest, null);
});
