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

test('legacy locale records retain their recorded metadata and approvals, not approval of current pages', () => {
  const published = locales.filter(locale => locale.publication === 'published');
  // Owner decision 18 Nov 2026: 12 public languages; the other 17 stay as hidden drafts.
  assert.deepEqual(published.map(locale => locale.code).sort(), ['da', 'de', 'en', 'es', 'fr', 'it', 'nl', 'no', 'pl', 'pt', 'ru', 'sv']);
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
  assert.equal(new Set(routePaths).size, 72);
});

test('legacy reviewed catalogs cover stored keys and SEO fields, not human review of current rendered editions', async () => {
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

test('the translation source covers catalog-source and shared-interface phrases, excluding native-only copyBase', async () => {
  const file = path.join(root, 'src/App.tsx');
  const code = await readFile(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const source = JSON.parse(await readFile(path.join(root, 'src/localization/catalogs/sources.json'), 'utf8')).entries;
  const previewSource = JSON.parse(await readFile(path.join(root, 'src/localization/preview-sources.json'), 'utf8')).entries;
  const available = new Set([...Object.values(source), ...Object.values(previewSource)].map(text => text.normalize('NFKC').replace(/\s+/g, ' ').trim()));
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

test('the build renders complete documents and only includes page-approved equivalents', async () => {
  const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
  const manifest = JSON.parse(await readFile(path.join(output, 'route-manifest.json'), 'utf8'));
  const approved = Object.values(manifest.editions).filter(edition => edition.state === 'published' && edition.approval);
  const eligible = approved.filter(edition => edition.sitemap);
  const localeTag = ({ locale }) => locale === 'it' ? 'it-IT' : locale;
  const fullUrl = edition => new URL(edition.path, manifest.origin).href;
  const alternatesFor = edition => approved.filter(other => other.id === edition.id);
  const allowedLocales = new Set(locales.filter(record => record.publication === 'published').map(record => record.code));
  const records = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc>(.*?)<\/url>/g)];
  assert.deepEqual(records.map(match => match[1]).sort(), eligible.map(fullUrl).sort());
  for (const [, url, links] of records) {
    const edition = eligible.find(candidate => fullUrl(candidate) === url);
    assert.ok(allowedLocales.has(edition.locale), url);
    assert.deepEqual(
      [...links.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(([, lang, href]) => [lang, href]).sort(),
      alternatesFor(edition).map(other => [localeTag(other), fullUrl(other)]).sort(),
      url,
    );
  }

  for (const locale of locales.filter(record => record.publication === 'published')) {
    for (const pageKey of requiredPages) {
      const requestedPath = pages[locale.code][pageKey].path;
      const routePath = manifest.redirects[requestedPath.replace(/\/+$/, '') || '/'] ?? Object.keys(manifest.pages).find(route => route.replace(/\/+$/, '') === requestedPath.replace(/\/+$/, '')) ?? requestedPath;
      const pathname = routePath.replace(/^\/+|\/+$/g, '');
      const holding = manifest.heldPages[routePath.replace(/\/+$/, '') || '/'];
      const file = path.join(output, holding ?? manifest.pages[routePath] ?? `${pathname}/index.html`);
      const html = await readFile(file, 'utf8');
      const buildOrigin = JSON.parse(await readFile(path.join(output, 'route-manifest.json'), 'utf8')).origin;
      const canonical = new URL(routePath, buildOrigin).toString();
      assert.equal((html.match(/<title>/g) ?? []).length, 1);
      assert.ok(html.includes('name="description"'));
      if (holding) assert.doesNotMatch(html, /rel="canonical"/);
      else assert.ok(html.includes(`rel="canonical" href="${canonical}"`));
      const edition = manifest.editions[routePath];
      const alternates = !holding && edition?.state === 'published' ? alternatesFor(edition) : [];
      const expectedTags = alternates.map(localeTag);
      if (alternates.some(other => other.locale === 'it')) expectedTags.push('x-default');
      assert.deepEqual([...html.matchAll(/rel="alternate" hreflang="([^"]+)"/g)].map(match => match[1]).sort(), expectedTags.sort(), routePath);
       assert.match(html, new RegExp(`<html lang="${locale.code === 'it' ? 'it-IT' : locale.code}" dir="${locale.direction}"`));
       assert.match(html, new RegExp(`class="site-shell" lang="${locale.code === 'it' ? 'it-IT' : locale.code}" dir="${locale.direction}"`));
       assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
       assert.doesNotMatch(html, /<div id="root"><\/div>/);
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

test('preview catalogs cover every source key and stay marked for owner review', async () => {
  const entries = JSON.parse(await readFile(path.join(root, 'src/localization/preview-sources.json'), 'utf8')).entries;
  const ids = Object.keys(entries);
  assert.equal(ids.length, 446);
  const locales = JSON.parse(await readFile(path.join(root, 'src/localization/locales.json'), 'utf8'));
  const codes = (Array.isArray(locales) ? locales : locales.locales).map(l => l.code).filter(c => c !== 'it');
  assert.equal(codes.length, 28);
  for (const code of codes) {
    const catalog = JSON.parse(await readFile(path.join(root, `src/localization/preview/${code}.json`), 'utf8'));
    assert.equal(catalog.reviewStatus, 'awaiting-owner-review', code);
    assert.deepEqual(ids.filter(id => !catalog.translations[id]?.trim()), [], code);
  }
});

async function loadDetector() {
  const code = await readFile(path.join(root, 'src/localization/detect.ts'), 'utf8');
  const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}

test('browser language detection only chooses published locales, honouring priority and saved choice', async () => {
  const { chooseLanguage, isAutomaticVisitor } = await loadDetector();
  const published = locales.filter(locale => locale.publication === 'published').map(locale => locale.code);
  assert.equal(chooseLanguage(['fr-CA', 'en'], null, published), 'fr');
  assert.equal(chooseLanguage(['xx-YY', 'nl-BE', 'en'], null, published), 'nl');
  assert.equal(chooseLanguage(['nb-NO'], null, published), 'no');
  assert.equal(chooseLanguage(['he-IL'], null, published), 'it');
  assert.equal(chooseLanguage(['ja-JP', 'zh-CN'], null, published), 'it');
  assert.equal(chooseLanguage([], null, published), 'it');
  assert.equal(chooseLanguage(['en-US'], 'de', published), 'de');
  assert.equal(chooseLanguage(['en-US'], 'it', published), 'it');
  assert.equal(chooseLanguage(['en-US'], 'zz', published), 'en');
  assert.equal(chooseLanguage(['fr', 'en'], null, ['it', 'en']), 'en');
  assert.equal(chooseLanguage(['fr'], 'fr', ['it', 'en']), 'it');
  assert.equal(isAutomaticVisitor('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
  assert.equal(isAutomaticVisitor('WhatsApp/2.23'), true);
  assert.equal(isAutomaticVisitor('Mozilla/5.0 (iPhone) Safari/604.1'), false);
});
