import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const root = new URL('../src/content/', import.meta.url);
const source = await readFile(new URL('historical-thumbnails.ts', root), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { recoverArticleThumbnails } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const index = JSON.parse(await readFile(new URL('historical/index.json', root), 'utf8'));
const mapping = JSON.parse(await readFile(new URL('historical-media.json', root), 'utf8'));

test('all nine historical article archives regain fourteen original thumbnails without changing text', async () => {
  for (const locale of ['it', 'en', 'de', 'es', 'fr', 'nl', 'pl', 'pt', 'ru']) {
    const catalog = JSON.parse(await readFile(new URL(`historical/${locale}.json`, root), 'utf8'));
    const covers = Object.fromEntries(index.filter(p => p.locale === locale && p.kind === 'article')
      .map(p => [p.key, catalog[p.key].image]));
    const archive = index.find(p => p.locale === locale && p.family === '/articoli');
    const before = catalog[archive.key].html;
    const after = recoverArticleThumbnails(before, covers);
    assert.equal((after.match(/<img\b[^>]*src=/g) ?? []).length, 14, locale);
    assert.equal(after.replace(/<[^>]*>/g, ''), before.replace(/<[^>]*>/g, ''), locale);
    for (const url of Object.values(covers)) assert.ok(mapping[url], `Original cover stored: ${url}`);
    assert.equal(recoverArticleThumbnails(after, covers), after, 'Idempotent');
  }
});
test('unknown placeholders and existing images are not replaced', () => {
  const html = '<p><img></p><picture><img src="/existing.jpg"></picture><h4><a href="/known/">Title</a></h4><picture><img></picture><h4><a href="/unknown/">Unknown</a></h4>';
  assert.equal(recoverArticleThumbnails(html, { '/known': '/api/historical-media/known.jpg' }), html);
});
