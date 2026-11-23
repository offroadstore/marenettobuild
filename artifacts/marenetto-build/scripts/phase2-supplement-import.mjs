import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const work = path.resolve(root, '../../generated-artifacts/phase2');
const target = path.join(root, 'src/localization/phase2');
const read = async file => JSON.parse(await readFile(file, 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const input = await read(path.join(work, 'supplement-input.json'));
const previous = await read(path.join(target, 'supplemental.json')).catch(() => null);
if (previous?.records.some(e => e.approval)) throw new Error('Refusing to replace real approvals.');
const snapshotsFile = path.resolve(root, '../../docs/production-readiness/phase2/sources.json');
const snapshots = await read(snapshotsFile);
const records = [];
const comparisons = [];
for (const [index, item] of input.entries()) {
  const { changes } = await read(path.join(work, `supplement-${index}.json`));
  for (const c of changes) {
    const node = item.nodes.find(n => n.id === c.id);
    if (!node?.text.includes(c.before) || !c.after.trim() || /[<>]/.test(c.after)) throw new Error(`Non-exact repair: ${item.page.path}:${c.id}`);
    const numbers = v => JSON.stringify(v.match(/\d+(?:[.,]\d+)*/g));
    if (numbers(c.before) !== numbers(c.after)) throw new Error(`Changed number: ${item.page.path}:${c.id}`);
  }
  let cursor = 0;
  const html = item.document.html.replace(/>([^<]+)</g, (all, text) => {
    if (item.nodes[cursor]?.text !== text) return all;
    const { id } = item.nodes[cursor++];
    let translated = text;
    for (const change of changes.filter(c => c.id === id)) {
      translated = translated.replace(change.before, change.after.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;'));
    }
    return `>${translated}<`;
  });
  if (cursor !== item.nodes.length || changes.some(c => !item.nodes.some(n => n.id === c.id))) throw new Error('Invalid supplemental node mapping');
  const catalogFile = path.join(target, `${item.page.locale}.json`);
  const catalog = await read(catalogFile);
  const snippet = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? html;
  const description = item.edition.description || snippet.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 167).replace(/\s+\S*$/, '') + '…';
  const doc = { ...item.document, html, description };
  catalog.historical[item.page.key] = doc;
  await writeFile(catalogFile, JSON.stringify(catalog, null, 2) + '\n');
  const sourceKey = 'supplement:' + item.page.path;
  const snapshot = { kind: 'historical', sourcePath: item.italianPath, sourceSHA256: item.page.sourceSHA256,
    html: item.italian.html, documentBefore: item.document, mixedSourcePath: item.page.path };
  const sourceRevisionSHA256 = hash(snapshot);
  snapshots[sourceKey] = { ...snapshot, revisionSHA256: sourceRevisionSHA256 };
  const e = item.edition;
  const revision = { sourceRevisionSHA256, title: e.title, description, document: doc, translations: catalog.translations };
  records.push({ id: e.id, locale: e.locale, kind: e.kind, path: e.path, sourcePath: item.italianPath, sourceKey,
    sourceRevisionSHA256, historicalSourceSHA256: item.page.sourceSHA256, revisionSHA256: hash(revision),
    title: e.title, description, h1: item.page.h1, historical: true, approval: null,
    reason: 'Previously classified native edition contained Italian passages; targeted translation, no inherited approval' });
  comparisons.push({ path: e.path, sourceSHA256: item.page.sourceSHA256,
    changes, humanReview: null });
}
await writeFile(path.join(target, 'supplemental.json'), JSON.stringify({ version: 1, records }, null, 2) + '\n');
await writeFile(path.join(target, 'supplemental-comparison.json'), JSON.stringify(comparisons, null, 2) + '\n');
await writeFile(snapshotsFile, JSON.stringify(snapshots, null, 2) + '\n');
console.log(`Corrected Italian passages in ${records.length} additional mixed editions; approvals remain null.`);
