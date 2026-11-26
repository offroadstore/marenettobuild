/**
 * Private documentary export only. Never imports or changes the public editions,
 * CMS, active revisions, sitemap, consent preferences, or indexing notifications.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dossier = path.join(root, 'docs/editorial/costruire-cefalu-madonie');
const read = name => JSON.parse(fs.readFileSync(path.join(dossier, name), 'utf8'));
const strategy = read('keyword-strategy.json');
const series = read('episode-map.json');
const conceptual = read('conceptual-keywords.json');
const ownerUpdate = read('owner-update-2026-11-26.json');
const historical = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/marenetto-build/src/content/historical/index.json'), 'utf8'));
const clusters = new Map(strategy.clusters.map(cluster => [cluster.id, cluster]));

assert.equal(strategy.researchVolumes, null);
assert.equal(series.publicationApproved, true);
assert.equal(series.state, 'owner-authorized-activation');
assert.deepEqual([...series.episodeOrder].sort((a, b) => a - b), Array.from({length: 10}, (_, i) => i + 1));
assert.equal(new Set(series.localeOrder).size, 12);
assert.deepEqual(series.episodes.map(e => e.number), Array.from({length: 10}, (_, i) => i + 1));
const rows = series.episodeOrder.flatMap(number => {
  const episode = series.episodes.find(episode => episode.number === number);
  const cluster = clusters.get(episode.cluster);
  assert.ok(cluster);
  return series.localeOrder.map(locale => {
    const literal = cluster.keywords[locale] ?? [];
    const terms = literal.length ? literal : conceptual[cluster.id]?.[locale] ?? [];
    const primary = terms.length ? terms[Math.min(episode.primaryIndex, terms.length - 1)] : '';
    const secondary = terms.filter(term => term !== primary);
    for (const term of [primary, ...secondary].filter(Boolean)) assert.ok(terms.includes(term));
    const existing = episode.existingFamily
      ? historical.find(page => page.family === episode.existingFamily && page.locale === locale) : null;
    assert.ok(terms.length);
    if (!literal.length) assert.ok(cluster.conceptualLocalizationAuthorized?.includes(locale));
    return {
      puntata: number, titolo: episode.title, lingua: locale, cluster: cluster.id,
      intento_guida: episode.intent.join('/'), intento_cluster: cluster.intent.join('/'),
      mercato_guida: episode.market.join('/'), keyword_principale: primary,
      secondarie_fornite: secondary.join(' | '),
      provenienza_keyword: literal.length ? 'testo del titolare' : 'localizzazione concettuale autorizzata; controllo assistito da IA e approvazione interna, non certificazione professionale',
      integrazione_titolare_26_11_2026: (ownerUpdate.keywords[locale] ?? []).join(' | '),
      cluster_contesto: episode.contextCluster ?? '',
      famiglia_esistente: episode.existingFamily ?? '',
      url_storico: existing?.path ?? '',
      stato_catalogo_storico: existing?.state ?? '',
      azione_archivio: episode.archiveAction ?? 'edizione della serie nello stesso CMS',
      nota: episode.note, approvazione_testo: 'approvazione interna del titolare 26/11/2026; controllo assistito da IA, non professionale', video: 'nessun URL ricevuto',
    };
  });
});
assert.equal(rows.length, 120);
assert.equal(rows.filter(row => row.provenienza_keyword.startsWith('localizzazione')).length, 36);
assert.ok(rows.every(row => !row.url_storico || row.famiglia_esistente));
for (const number of [4, 7]) for (const locale of ['it', 'en', 'de', 'nl']) {
  assert.ok(rows.find(row => row.puntata === number && row.lingua === locale)?.url_storico);
}
console.log('Verificati: 120 abbinamenti, 84 con keyword letterali, 36 localizzazioni concettuali distinte dai dati del titolare; nessuna pubblicazione.');

if (!process.argv.includes('--check')) {
  const out = path.join(root, 'generated-artifacts/costruire-cefalu-madonie');
  fs.mkdirSync(out, { recursive: true });
  // Spreadsheet-safe text; preserve the exact owner wording after CSV decoding.
  const cell = value => `"${String(value).replace(/"/g, '""')}"`;
  const csv = '\ufeff' + [Object.keys(rows[0]), ...rows.map(Object.values)].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
  fs.writeFileSync(path.join(out, 'matrice-puntate-keyword.csv'), csv);
  const families = [...new Set(series.episodes.map(e => e.existingFamily).filter(Boolean))];
  fs.writeFileSync(path.join(out, 'famiglie-storiche.json'), JSON.stringify(
    historical.filter(page => families.includes(page.family)).map(page => ({
      family: page.family, locale: page.locale, path: page.path, state: page.state,
      provenance: page.source, sourceSHA256: page.sourceSHA256,
      note: 'Stato del catalogo storico; non certifica versione pubblica attiva o nuova approvazione.',
    })), null, 2) + '\n');
  console.log('Prospetti privati generati in generated-artifacts/costruire-cefalu-madonie.');
}
