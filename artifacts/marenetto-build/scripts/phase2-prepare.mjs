import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(root, '../../generated-artifacts/phase2');
await mkdir(out, { recursive: true });
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const hash = text => createHash('sha256').update(text).digest('hex');
const manifest = await read('dist/public/route-manifest.json');
const locales = ['en', 'fr', 'de', 'nl', 'es', 'pt', 'ru', 'pl', 'sv', 'no', 'da'];
const frozen = process.argv.includes('--refresh') ? JSON.parse(await readFile(path.join(out, 'baseline.json'), 'utf8')) : null;
const candidates = frozen?.candidates ?? Object.values(manifest.editions).filter(e => locales.includes(e.locale) &&
  e.contentLanguage !== e.locale && e.kind !== 'search' && manifest.pages[e.path]);
if (candidates.length !== 80) throw new Error(`Expected untouched baseline of 80, got ${candidates.length}`);
const baseline = frozen?.baseline ?? Object.values(manifest.editions).filter(e => locales.concat('it').includes(e.locale) &&
  e.contentLanguage === e.locale && e.kind !== 'search' && manifest.pages[e.path] && e.path !== '/en/articoli/');
if (baseline.length !== 270) throw new Error(`Expected baseline of 270, got ${baseline.length}`);
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { articles } = await vite.ssrLoadModule('/src/content/articles.ts');
  const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
  const originals = await read('src/content/historical/index.json');
  const it = { ...await read('src/content/historical/it.json'), ...await read('src/content/historical-editorial/it.json') };
  const sources = {};
  for (const e of candidates) {
    const original = originals.find(o => o.path === e.path);
    const family = original?.family ?? (e.kind === 'article' ? '/' + e.id : e.id);
    const key = original ? family : e.kind === 'article' ? 'article:' + e.id : 'archive:' + e.id;
    if (!sources[key]) {
      if (original) {
        const source = originals.find(o => o.locale === 'it' && o.family === family);
        const document = it[family];
        sources[key] = { kind: 'historical', sourcePath: source.path, sourceSHA256: source.sourceSHA256,
          title: document.title, description: document.description, html: document.html };
      } else {
        const route = `/__localization-review/it/${e.kind === 'article' ? 'articles/' + e.id : e.id}`;
        const { body } = await render(route, 'it');
        sources[key] = { kind: e.kind, sourcePath: e.kind === 'article' ? '/' + e.id : '/' + (e.id === 'guides' ? 'guide' : 'articoli'),
          body, article: articles.find(a => a.slug === e.id) ?? null };
      }
      sources[key].revisionSHA256 = hash(JSON.stringify(sources[key]));
    }
    e.phase2Source = key;
  }
  const baselineHashes = frozen?.baseline ?? await Promise.all(baseline.map(async e => ({ path: e.path, id: e.id, locale: e.locale,
    sha256: hash(await readFile(path.join(root, 'dist/public', manifest.pages[e.path]))) })));
  await writeFile(path.join(out, 'baseline.json'), JSON.stringify({ candidates, baseline: baselineHashes, sources }, null, 2));
  // Only the source strings used by the library are eligible for this overlay.
  const preview = await read('src/localization/preview-sources.json');
  const italianBodies = Object.values(sources).filter(s => s.kind !== 'historical').map(s => s.body.replace(/<[^>]*>/g, '')
    .replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"').replace(/\s+/g, ' ')).join('\n');
  const libraryStrings = Object.entries(preview.entries).filter(([, value]) =>
    italianBodies.includes(value.replace(/\s+/g, ' ')) || articles.some(a => a.approvedFullText === value || a.imageAlt === value));
  for (const locale of locales) {
    const existing = (await read(`src/localization/preview/${locale}.json`)).translations;
    const correction = await read(`src/localization/draft-corrections/${locale}.json`).catch(() => ({ translations: {} }));
    const used = { ...existing, ...correction.translations };
    const library = libraryStrings.map(([id, source]) => ({ id, source, translation: used[id] }));
    const historical = Object.entries(sources).filter(([key, s]) => s.kind === 'historical' &&
      candidates.some(e => e.locale === locale && e.phase2Source === key)).map(([key, s]) => ({ key, ...s }));
    await writeFile(path.join(out, `${locale}-input.json`), JSON.stringify({ locale, historical, library }));
  }
  console.log({ candidates: candidates.length, baseline: baseline.length, families: Object.keys(sources).length, libraryStrings: libraryStrings.length });
} finally { await vite.close(); }
