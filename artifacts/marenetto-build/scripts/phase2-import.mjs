import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const work = path.resolve(root, '../../generated-artifacts/phase2');
const target = path.join(root, 'src/localization/phase2');
await mkdir(target, { recursive: true });
const read = async file => JSON.parse(await readFile(file, 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const baseline = await read(path.join(work, 'baseline.json'));
const previous = await read(path.join(target, 'inventory.json')).catch(() => null);
if (previous?.records.some(e => e.approval)) throw new Error('Refusing to overwrite recorded owner approvals.');
const { histFields } = await read(path.join(work, 'historical-segments.json'));
const records = [];
const glossary = {};
const review = {};
// Structured translation output can contain double-escaped line separators.
// They are formatting, not literal words to show as "\n" in a sentence.
const lineBreaks = value => value.replaceAll('\\r\\n', '\n').replaceAll('\\n', '\n').replaceAll('\\r', '\n');
const escape = value => lineBreaks(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
for (const locale of [...new Set(baseline.candidates.map(e => e.locale))]) {
  const input = await read(path.join(work, `${locale}-input.json`));
  const result = await read(path.join(work, `${locale}-final.json`));
  const segments = input.historical.length ? await read(path.join(work, `${locale}-segments.json`)) : {};
  const translations = Object.fromEntries(input.library.map(s => [s.id, lineBreaks(s.translation)]));
  for (const c of result.corrections) {
    if (!Object.hasOwn(translations, c.id)) throw new Error(`Unknown translation id: ${locale}:${c.id}`);
    translations[c.id] = lineBreaks(c.translation);
  }
  const historical = {};
  for (const source of input.historical) {
    const data = histFields[source.key];
    let index = 0;
    const html = data.html.replace(/>([^<]+)</g, (all, text) => {
      const segment = data.segments[index];
      if (!segment || text !== segment.text) return all;
      index++;
      const translated = segments[segment.id];
      if (!translated?.trim()) throw new Error(`Missing segment ${locale}:${segment.id}`);
      return `>${text.match(/^\s*/)[0]}${escape(translated)}${text.match(/\s*$/)[0]}<`;
    });
    if (index !== data.segments.length) throw new Error(`Incomplete historical translation: ${locale}:${source.key}`);
    const tags = s => JSON.stringify(s.match(/<[^>]*>/g));
    if (tags(html) !== tags(source.html)) throw new Error(`Changed HTML structure: ${locale}:${source.key}`);
    const pathKey = `/${locale}${source.key}`;
    historical[pathKey] = {
      html, title: segments[data.fields.title], description: segments[data.fields.description],
      publishedOn: null, dateLabel: null, image: null, imageAlt: '', imageCaption: null,
    };
  }
  const sourceEntries = JSON.parse(await readFile(path.join(root, 'src/localization/preview-sources.json'))).entries;
  const translate = source => {
    const id = Object.keys(sourceEntries).find(id => sourceEntries[id].replace(/\s+/g, ' ').trim() === source.replace(/\s+/g, ' ').trim());
    if (!id || !translations[id]) throw new Error(`Missing metadata translation ${locale}: ${source}`);
    return translations[id];
  };
  const catalog = { locale, method: 'AI translation and automated bilingual comparison; no human linguistic certification', translations, historical };
  await writeFile(path.join(target, `${locale}.json`), JSON.stringify(catalog, null, 2) + '\n');
  glossary[locale] = result.glossary;
  // Record actual returned corrections, not unsupported claims in model findings.
  review[locale] = { comparedIds: input.library.map(s => s.id), corrections: result.corrections,
    historicalSegments: Object.keys(segments), humanReview: null };
  for (const e of baseline.candidates.filter(e => e.locale === locale)) {
    const source = baseline.sources[e.phase2Source];
    const doc = historical[e.path.replace(/\/+$/, '')];
    const article = source.article;
    const title = doc ? doc.title + ' | Marenetto Build' : article ? translate(article.title) + ' | Marenetto Build' :
      translate(e.id === 'guides' ? 'Guide pratiche' : 'Articoli') + ' | Marenetto Build';
    const description = doc ? doc.description : article ? translate(article.summary) :
      translate(e.id === 'guides' ? 'Guide pratiche per proprietari a Cefalù: sintesi riviste su acquisto, manutenzione, infiltrazioni, isolamento e superfici.' :
        'Archivio dei 14 articoli storici di Marenetto Build, con sintesi neutrali e stato di revisione delle affermazioni originali.');
    const revision = { sourceRevisionSHA256: source.revisionSHA256, title, description, document: doc ?? null, translations };
    records.push({ id: e.id, locale, kind: e.kind, path: e.path, sourcePath: source.sourcePath, sourceKey: e.phase2Source,
      sourceRevisionSHA256: source.revisionSHA256, historicalSourceSHA256: source.sourceSHA256 ?? null,
      revisionSHA256: hash(revision), title, description, h1: doc?.title ?? (article ? translate(article.title) : null),
      historical: Boolean(doc), approval: null });
  }
}
await writeFile(path.join(target, 'inventory.json'), JSON.stringify({ version: 1, records }, null, 2) + '\n');
await writeFile(path.join(target, 'glossary.json'), JSON.stringify(glossary, null, 2) + '\n');
await writeFile(path.join(target, 'comparison.json'), JSON.stringify(review, null, 2) + '\n');
await writeFile(path.join(target, 'baseline.json'), JSON.stringify(baseline.baseline, null, 2) + '\n');
const evidence = path.join(root, '../../docs/production-readiness/phase2');
await mkdir(evidence, { recursive: true });
await writeFile(path.join(evidence, 'sources.json'), JSON.stringify(baseline.sources, null, 2) + '\n');
await writeFile(path.join(target, 'editorial-exceptions.json'), JSON.stringify({
  authorization: 'Owner instruction: do not republish references to real-estate agencies or partners or suggest nonexistent agreements.',
  changes: [
    { source: '/chi-siamo/', before: 'un partner affidabile', after: 'un referente affidabile' },
    { source: '/ristrutturazioni-chiavi-in-mano-cefalu-e-palermo-marenetto/', before: 'un unico partner', after: 'un unico referente' },
  ], appliesTo: '24 translated historical destinations only; original documentary sources remain unchanged',
}, null, 2) + '\n');
console.log(`Imported ${records.length} revision-bound translation candidates. No owner approvals recorded.`);
