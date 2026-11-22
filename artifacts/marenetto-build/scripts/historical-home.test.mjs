import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const root = new URL('../src/content/', import.meta.url);
const load = async file => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(await readFile(new URL(file, root), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`);
const { extractHistoricalHome, plainText } = await load('historical-home.ts');
const { recoverArticleThumbnails } = await load('historical-thumbnails.ts');
const index = JSON.parse(await readFile(new URL('historical/index.json', root), 'utf8'));

for (const page of index.filter(p => p.family === '/')) {
  test(`home ${page.locale}: each article once, texts preserved`, async () => {
    const catalog = JSON.parse(await readFile(new URL(`historical/${page.locale}.json`, root), 'utf8'));
    const covers = Object.fromEntries(index.filter(p => p.locale === page.locale && p.kind === 'article').flatMap(p => catalog[p.key]?.image ? [[p.key, catalog[p.key].image]] : []));
    const html = recoverArticleThumbnails(catalog[page.key].html, covers);
    const home = extractHistoricalHome(html);
    assert.equal(home.articles.length, 14);
    assert.equal(new Set(home.articles.map(a => a.href)).size, 14);
    assert.ok(home.articles.every(a => a.title && a.image && a.date));
    const source = plainText(html);
    for (const a of home.articles) assert.ok(source.includes(a.title));
    for (const p of home.intro.paragraphs) assert.ok(source.includes(p));
    assert.ok(home.story.link.href.endsWith('/chi-siamo/'));
    const out = JSON.stringify(home);
    assert.ok(!out.includes('image/svg+xml') && !out.includes('{general'));
    assert.equal(home.reviews, undefined, 'Reviewer identities must never enter public home data');
    assert.doesNotMatch(out, /Hannah Erika|Salvatore Ruffa|Sal G\b/);
  });
}
