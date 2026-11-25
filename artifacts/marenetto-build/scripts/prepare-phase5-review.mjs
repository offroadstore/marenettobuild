import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { loadPhase5, escapeHTML } from '../../../docs/editorial/phase5/package.mjs';
import { sources, unsuccessfulChecks } from '../../../docs/editorial/phase5/sources.mjs';
import { PHASE5_LOCALES } from '../../../docs/editorial/phase5/locales.mjs';
import { draftSchemaPreview } from '../../../docs/editorial/phase5/draft-schema.mjs';

const tranche = process.argv.find(arg => arg.startsWith('--tranche='))?.slice('--tranche='.length) ?? 'it';
const groups = { it: ['it'], primary: ['it','en','de','nl'], remaining: ['fr','es','pt','pl','ru','sv','no','da'], all: PHASE5_LOCALES };
if (!groups[tranche]) throw new Error('Unknown private dossier tranche');
const pack = await loadPhase5({ locales: groups[tranche] });
const origin = 'https://www.marenettobuild.com'; // Verified deployment URL, 2026-11-25.
const title = `PRONTO PER REPUBLISH — sei guide ${groups[tranche].join('/').toUpperCase()}`;
const outputName = tranche === 'it' ? 'sei-guide-it-revisione.html' : `sei-guide-${tranche}-revisione.html`;
const directory = new URL('../../../generated-artifacts/editorial/phase5/', import.meta.url);
const protocol = await readFile(new URL('../../../docs/editorial/phase5/README.md', import.meta.url), 'utf8');
const verification = await readFile(new URL('../../../docs/editorial/phase5/VERIFICATION.md', import.meta.url), 'utf8');
const adaptationReview = await readFile(new URL('../../../docs/editorial/phase5/ADAPTATION_REVIEW.md', import.meta.url), 'utf8');
const handoff = await readFile(new URL('../../../docs/editorial/phase5/HANDOFF.md', import.meta.url), 'utf8');
const links = pack.records.map((r, i) => `<li><a href="#guida-${i + 1}"><span lang="${r.locale}">[${r.locale.toUpperCase()}] ${escapeHTML(r.content.title)}</span></a></li>`).join('');
const sections = pack.records.map((r, i) => `<article id="guida-${i + 1}" lang="${r.locale}">
  <p class="status" lang="it">CANDIDATA ${r.locale.toUpperCase()} · revisione documentale e linguistica IA registrata · non parere professionale · pubblicazione al titolare</p>
  <h2>${escapeHTML(r.content.title)}</h2>
  <p class="path">${r.mode === 'revise-existing' ? 'Famiglia storica conservata' : 'Percorso proposto, non pubblico'}: <code>${escapeHTML(r.path)}</code></p>
  <p class="hash">Impronta del manoscritto: ${r.manuscriptSHA256}</p>
  ${r.content.body.replace(/id="([^"]+)"/g, `id="g${i + 1}-$1"`).replace(/href="#([^"]+)"/g, `href="#g${i + 1}-$1"`).replace(/<a href="(\/[^"]*)">([^<]*)<\/a>/g, '<span>$2 <code>($1)</code></span>').replace(/<h([23])\b/g, (_m, n) => `<h${Number(n) + 1}`).replace(/<\/h([23])>/g, (_m, n) => `</h${Number(n) + 1}>`).replace(/\[(?:DA CONFERMARE|COLLEGAMENTO IN ATTESA)[^\]]*\]/g, match => `<mark>${match}</mark>`)}
  <details lang="it"><summary>Metadati e schema proposti, non pubblicati</summary>
    <p>Titolo SEO: <span lang="${r.locale}">${escapeHTML(r.content.seoTitle)}</span></p>
    <p>Descrizione SEO: <span lang="${r.locale}">${escapeHTML(r.content.seoDescription)}</span></p>
    <pre>${escapeHTML(JSON.stringify(draftSchemaPreview(r, origin), null, 2))}</pre>
  </details>
  ${r.privatePlaceholders.length ? `<details lang="it"><summary>Segnaposto riservati — esclusi dal testo per i lettori</summary><ul>${r.privatePlaceholders.map(text => `<li lang="${r.locale}"><mark>${escapeHTML(text)}</mark></li>`).join('')}</ul></details>` : ''}
  ${r.glossary.length ? `<details lang="it"><summary>Glossario dell’adattamento</summary><dl>${r.glossary.map(g => `<dt>${escapeHTML(g.italian)}</dt><dd lang="${r.locale}">${escapeHTML(g.localized)}</dd><dd lang="it">${escapeHTML(g.note)}</dd>`).join('')}</dl></details>` : ''}
  ${r.privateNotes.length ? `<details lang="it"><summary>Note riservate dell’adattamento</summary><ul>${r.privateNotes.map(n => `<li>${escapeHTML(n)}</li>`).join('')}</ul></details>` : ''}
  <a href="#indice">Torna all’indice</a></article>`).join('\n');
const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHTML(title)}</title><style>
body{font:17px/1.65 system-ui,sans-serif;color:#202826;background:#f5f3ee;margin:0}main{max-width:920px;margin:auto;padding:32px 22px}h1,h2,h3,h4{line-height:1.25}h1{font-size:2.1rem}h2{font-size:1.75rem}h3{font-size:1.3rem}h4{font-size:1.1rem}article{margin:44px 0;padding:28px;background:white;border:1px solid #d5d9d3;border-radius:8px}a{color:#155d52;overflow-wrap:anywhere}code,.path,.hash{overflow-wrap:anywhere}.status{font-size:.82rem;font-weight:700;color:#6d4100}mark{background:#fff0bd;color:#523c00;padding:2px}pre{font:15px/1.6 system-ui,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere}.notice{padding:20px;border-left:4px solid #a66b16;background:#fff5da}.hash{font-size:.72rem;color:#565d59}@media(max-width:600px){article{padding:18px}h2{font-size:1.45rem}}@media print{body{background:white}article{break-before:page;border:0;padding:0}.hash{font-size:9px}a{color:inherit}}
blockquote{margin:0 0 24px;padding:18px;border-left:4px solid #ad7424;background:#fff6e5}
</style></head><body><main><p>Marenetto Build · consegna riservata · 25 novembre 2026</p><h1>${escapeHTML(title)}</h1>
<div class="notice"><strong>PRONTO PER REPUBLISH — pacchetto privato, non attivato.</strong> ${pack.records.length} candidate in questo dossier. Metodo di revisione IA e dati aziendali approvati internamente dal titolare il 25/11/2026, senza attribuire valore di parere professionale. Controlli del caso concreto ancora aperti. Materiali degli arredi non specificati: segnaposto soltanto nelle note riservate, mai nei testi per i lettori. Pubblicazione a cura del titolare tramite Claude; Republish da solo non attiva queste bozze.</div>
<p>I collegamenti interni al sito sono mostrati come percorsi di riferimento, non aperti da questo documento riservato. I collegamenti alle fonti esterne restano consultabili.</p>
<h2 id="indice">Elenco approvato</h2><ol>${links}</ol>
<h2>Protocollo, famiglie, glossario e questioni aperte</h2><pre>${escapeHTML(protocol)}</pre>
<h2>Registro degli adattamenti e delle revisioni</h2><pre>${escapeHTML(adaptationReview)}</pre>
${sections}<h2 id="registro">Registro documentale</h2>
${sources.map(s => `<section><h3>${escapeHTML(s.title)}</h3><p><a href="${escapeHTML(s.url)}">${escapeHTML(s.url)}</a></p><p>Consultata: ${s.consultedOn} · Stato: ${escapeHTML(s.status)}</p><p>${escapeHTML(s.scope)}</p><p><strong>Limiti:</strong> ${escapeHTML(s.limit)}</p></section>`).join('')}
<h3>Consultazioni non riuscite</h3><ul>${unsuccessfulChecks.map(s => `<li>${escapeHTML(s.url)} — ${escapeHTML(s.outcome)}</li>`).join('')}</ul>
<h2>Controlli eseguiti e limiti delle prove</h2><pre>${escapeHTML(verification)}</pre>
<h2>Passaggio al titolare tramite Claude</h2><pre>${escapeHTML(handoff)}</pre>
<p>Il via all’elenco non è un via alla pubblicazione. Nessun segnaposto deve comparire nel sito indicizzabile.</p></main></body></html>`;
await mkdir(directory, { recursive: true });
await writeFile(new URL(outputName, directory), html);
await writeFile(new URL(`package-${tranche}.json`, directory), JSON.stringify(pack, null, 2));
await writeFile(new URL(`families-and-reviews-${tranche}.json`, directory), JSON.stringify(pack.records.map(r => ({
  identity: r.identity, locale: r.locale, proposedPath: r.path, manuscriptSHA256: r.manuscriptSHA256,
  sourceManuscriptSHA256: r.sourceManuscriptSHA256, review: r.review,
  schemaPreview: draftSchemaPreview(r, origin),
})), null, 2));
process.stdout.write(`Consegna riservata: ${outputName}; ${pack.records.length} edizioni; nessuna pagina pubblica generata.\n`);
