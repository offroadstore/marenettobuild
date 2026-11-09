import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const locales = JSON.parse(await readFile(path.join(root, 'src/localization/locales.json'), 'utf8'));
const pages = JSON.parse(await readFile(path.join(root, 'src/localization/public-pages.json'), 'utf8'));
const output = path.join(root, 'dist/public');
const requiredPages = ['home', 'services', 'process', 'abroad', 'request', 'contact'];
const origin = new URL(process.env.VITE_PUBLIC_SITE_URL || 'https://marenetto-build-sito-e-portale.replit.app').origin;

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

test('the editorial matrix has 29 unique requested languages', () => {
  assert.equal(locales.length, 29);
  assert.equal(new Set(locales.map(locale => locale.code)).size, 29);
});

test('all 29 locale records are complete and explicitly approved', () => {
  const published = locales.filter(locale => locale.publication === 'published');
  assert.equal(published.length, 29);
  const routePaths = [];
  for (const locale of published) {
    assert.equal(locale.copyStatus, 'complete');
    assert.equal(locale.reviewStatus, 'approved-current-copy');
    assert.deepEqual(locale.completePages, requiredPages);
    assert.deepEqual(Object.keys(pages[locale.code]), requiredPages);
    for (const page of requiredPages) {
      assert.ok(pages[locale.code][page].title);
      assert.ok(pages[locale.code][page].description);
      assert.ok(pages[locale.code][page].path);
      routePaths.push(pages[locale.code][page].path);
    }
  }
  assert.equal(new Set(routePaths).size, 174);
});

test('each approved catalog has complete translations and matching SEO metadata', async () => {
  const source = JSON.parse(await readFile(path.join(root, 'src/localization/catalogs/sources.json'), 'utf8')).entries;
  const sourceToId = Object.fromEntries(Object.entries(source).map(([id, phrase]) => [phrase.normalize('NFKC').replace(/\s+/g, ' ').trim(), id]));
  for (const locale of locales.filter(record => !['it', 'en'].includes(record.code))) {
    const catalog = JSON.parse(await readFile(path.join(root, `src/localization/catalogs/${locale.code}.json`), 'utf8'));
    assert.equal(catalog.locale, locale.code);
    assert.equal(catalog.reviewStatus, 'approved-current-copy');
    assert.deepEqual(Object.keys(catalog.translations).sort(), Object.keys(source).sort());
    assert.ok(Object.values(catalog.translations).every(value => typeof value === 'string' && value.trim().length > 0));
    for (const page of requiredPages) {
      const english = pages.en[page];
      assert.equal(pages[locale.code][page].title, catalog.translations[sourceToId[english.title]]);
      assert.equal(pages[locale.code][page].description, catalog.translations[sourceToId[english.description]]);
    }
  }
});

test('the translation source covers every Italian and English phrase embedded in the website', async () => {
  const file = path.join(root, 'src/App.tsx');
  const code = await readFile(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const source = JSON.parse(await readFile(path.join(root, 'src/localization/catalogs/sources.json'), 'utf8')).entries;
  const available = new Set(Object.values(source).map(text => text.normalize('NFKC').replace(/\s+/g, ' ').trim()));
  const required = new Set();
  const collect = node => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.text.normalize('NFKC').replace(/\s+/g, ' ').trim();
      if (text.length > 2 && !/^(https?:|mailto:|tel:|\/|[A-Z_][A-Z_0-9-]+)$/.test(text)) required.add(text);
    }
    if (ts.isJsxText(node)) {
      const text = node.text.normalize('NFKC').replace(/\s+/g, ' ').trim();
      if (text.length > 2) required.add(text);
    }
    ts.forEachChild(node, collect);
  };
  const findPhrases = node => {
    if (ts.isVariableDeclaration(node) && node.name.getText(sourceFile) === 'copySource') {
      for (const property of node.initializer.properties) {
        if (ts.isPropertyAssignment(property) && property.name.getText(sourceFile).replaceAll("'", '') === 'en') collect(property.initializer);
      }
    }
    if (ts.isConditionalExpression(node) && (/^it$/.test(node.condition.getText(sourceFile)) || node.condition.getText(sourceFile).includes("lang === 'it'"))) {
      collect(node.whenFalse);
    }
    ts.forEachChild(node, findPhrases);
  };
  findPhrases(sourceFile);
  const missing = [...required].filter(text => !available.has(text));
  assert.deepEqual(missing, []);
});

test('RTL locales have direction and script-specific font assignments', async () => {
  const css = await readFile(path.join(root, 'src/index.css'), 'utf8');
  for (const [code, script] of [['ar', 'arabic'], ['he', 'hebrew']]) {
    const locale = locales.find(record => record.code === code);
    assert.equal(locale.direction, 'rtl');
    assert.equal(locale.script, script);
    assert.match(css, new RegExp(`\\.site-shell\\[lang="${code}"\\]`));
  }
  assert.ok(css.includes('.site-shell[dir="rtl"] { direction: rtl; text-align: start; }'));
});

test('the production build prerenders metadata and equivalent hreflang URLs for every active route', async () => {
  const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 174);
  assert.equal((sitemap.match(/hreflang="it-IT"/g) ?? []).length, 174);
  assert.equal((sitemap.match(/hreflang="x-default"/g) ?? []).length, 174);
  for (const locale of locales) {
    const hrefLang = locale.code === 'it' ? 'it-IT' : locale.code;
    assert.equal((sitemap.match(new RegExp(`hreflang="${hrefLang}"`, 'g')) ?? []).length, 174);
  }

  for (const locale of locales.filter(record => record.publication === 'published')) {
    for (const pageKey of requiredPages) {
      const pathname = pages[locale.code][pageKey].path.replace(/^\/+|\/+$/g, '');
      const file = path.join(output, pathname, 'index.html');
      const html = await readFile(file, 'utf8');
      const canonical = new URL(pages[locale.code][pageKey].path, origin).toString();
      assert.ok(html.includes(`<title>${escapeHtml(pages[locale.code][pageKey].title)}</title>`));
      assert.ok(html.includes(`name="description" content="${escapeHtml(pages[locale.code][pageKey].description)}"`));
      assert.ok(html.includes(`rel="canonical" href="${canonical}"`));
       assert.equal((html.match(/rel="alternate" hreflang=/g) ?? []).length, 30);
       assert.match(html, new RegExp(`<html lang="${locale.code === 'it' ? 'it-IT' : locale.code}" dir="${locale.direction}">`));
       assert.ok(html.includes('name="robots" content="noindex, nofollow"'));
    }
  }
});

test('approved translations are present in the production bundle while preview indexing stays disabled', async () => {
  const french = JSON.parse(await readFile(path.join(root, 'src/localization/catalogs/fr.json'), 'utf8'));
  const approvedFrench = french.translations.s001;
  const assetFiles = await readdir(path.join(output, 'assets'));
  const javascript = (await Promise.all(assetFiles.filter(file => file.endsWith('.js')).map(file => readFile(path.join(output, 'assets', file), 'utf8')))).join('\n');
  assert.ok(approvedFrench);
  assert.equal(javascript.includes(approvedFrench), true);
  assert.ok((await readFile(path.join(output, 'robots.txt'), 'utf8')).includes('Disallow: /'));
});
