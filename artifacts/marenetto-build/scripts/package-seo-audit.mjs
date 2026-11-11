import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const reports = path.resolve(root, '../../generated-artifacts/seo-audit');
const json = async file => JSON.parse(await readFile(path.join(reports, file), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const http = await json('http-results.json');
const first = await json('rendered-results.json');
const recheck = await json('rendered-recheck.json');
const forms = await json('isolated-form-results.json');
const lab = await json('throttled-lab-metrics.json');
const matrix = await json('route-matrix.json');
const digest = createHash('sha256');
async function hashFiles(dir) {
  for (const entry of (await readdir(path.join(root, dir), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) await hashFiles(relative);
    else digest.update(relative).update(await readFile(path.join(root, relative)));
  }
}
for (const dir of ['src', 'scripts', 'tests', 'config']) await hashFiles(dir);
for (const file of ['index.html', 'package.json', 'vite.config.ts', '.replit-artifact/artifact.toml']) digest.update(file).update(await readFile(path.join(root, file)));
const summary = {
  recordedAt: new Date().toISOString(), sourceSnapshotSHA256: digest.digest('hex'),
  snapshotMeaning: 'Source/config/tests snapshot, not a fabricated merge commit identifier',
  indexing: 'disabled', httpDocuments: http.pagesChecked, permanentRedirects: http.redirectsChecked,
  initialRenderedPass: { documents: first.results.length, stableHeadings: first.results.length, errorsFound: first.errors.length },
  targetedHydrationRecheck: { documents: recheck.results.length, errors: recheck.errors.length },
  fullTextBlockProofs: matrix.editions.filter(e => e.fullTextProof).length,
  forms: forms.results, performance: lab,
  limits: ['No native-speaker/owner approval of new foreign copy', 'No WebKit/iOS or screen reader session', 'No before-change timing baseline', 'No field CWV or INP', 'No real SMTP delivery', 'No production CMS database inventory', 'Prepared host policy and indexing activation remain disabled'],
};
await writeFile(path.join(reports, 'delivery-summary.json'), JSON.stringify(summary, null, 2));
const report = await readFile(path.join(root, 'SEO_CONTENT_LANGUAGE_REPORT.md'), 'utf8');
const checklist = await readFile(path.join(root, 'SEO_RELEASE_CHECKLIST.md'), 'utf8');
const pictures = await Promise.all(['baseline-home-mobile.jpg', 'after-home-mobile.jpg', 'after-ar-mobile.jpg'].map(async file => `<figure><img alt="${escape(file)}" src="data:image/jpeg;base64,${(await readFile(path.join(reports, file))).toString('base64')}"><figcaption>${escape(file)}</figcaption></figure>`));
const perfRows = lab.results.map(item => `<tr><td>${escape(item.route)}</td><td>${item.lcp === null ? 'non disponibile' : `${Math.round(item.lcp)} ms`}</td><td>${Number(item.cls).toFixed(4)}</td></tr>`).join('');
const html = `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Marenetto Build — rapporto SEO</title><style>body{max-width:1080px;margin:36px auto;padding:0 24px;font:16px/1.6 system-ui;color:#173441;background:#faf9f6}h1,h2{line-height:1.2}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}section{border-top:1px solid #bac7cb;margin-top:30px;padding-top:20px}.photos{display:flex;gap:18px;align-items:flex-start}figure{margin:0;flex:1;min-width:0}img{width:100%;height:auto}figcaption{font-size:12px;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%}th,td{text-align:left;border-bottom:1px solid #cbd4d6;padding:8px}.note{padding:16px;background:#e7eeee}code{overflow-wrap:anywhere}@media(max-width:600px){.photos{display:block}figure{margin-bottom:24px}}</style><h1>Marenetto Build — rapporto di consegna</h1><p>10 novembre 2026 · Nessuna pubblicazione · Indicizzazione disattivata</p><p class="note">Le nuove traduzioni sono bozze da approvare, non edizioni certificate. I limiti di verifica sono parte del rapporto.</p><h2>Prove registrate</h2><ul><li>${http.pagesChecked} documenti HTTP e ${http.redirectsChecked} redirect permanenti controllati.</li><li>${first.results.length} route renderizzate: H1 stabili; ${first.errors.length} errori iniziali identificati.</li><li>${recheck.results.length} route ricontrollate dopo la correzione delle date: ${recheck.errors.length} errori.</li><li>${summary.fullTextBlockProofs} confronti dei blocchi del corpo articolo contro l’HTML.</li><li>Moduli sintetici isolati: ${forms.results.map(r => r.locale.toUpperCase()).join(', ')}; nessun invio reale.</li></ul><p>Impronta del codice/configurazione/test: <code>${summary.sourceSnapshotSHA256}</code>. Non è un commit di merge anticipato.</p><h2>Prestazioni di laboratorio</h2><table><thead><tr><th>Route</th><th>LCP osservato</th><th>CLS osservato</th></tr></thead><tbody>${perfRows}</tbody></table><p>${escape(lab.results[0]?.scope ?? '')}</p><p>${escape(lab.baseline)} Nessun dato di traffico reale o promessa di Core Web Vitals.</p><section><h2>Confronto visivo a viewport identico</h2><div class="photos">${pictures.join('')}</div></section><section><pre>${escape(report)}</pre></section><section><pre>${escape(checklist)}</pre></section></html>`;
await writeFile(path.join(reports, 'Marenetto-SEO-contenuti-lingue.html'), html);
console.info('Packaged report, source snapshot and exact recorded evidence. No publication or indexing activation.');
