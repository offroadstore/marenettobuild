import { readFile, readdir, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const evidence = path.resolve(process.env.HISTORICAL_AUDIT_DIR || path.join(root, '../../generated-artifacts/migration-2026-11-11'));
const docs = path.join(root, 'docs/migrazione-storica');
const audit = JSON.parse(await readFile(path.join(evidence, 'audit.json'), 'utf8'));
const s = audit.summary;
let routeExploration = null;
try { routeExploration = JSON.parse(await readFile(path.join(evidence, 'playwright-429/results.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
let inventoryBrowser = null;
try { inventoryBrowser = JSON.parse(await readFile(path.join(evidence, 'playwright-inventory/results.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const documentFiles = (await readdir(docs)).sort();
await mkdir(path.join(evidence, 'documents'), { recursive: true });
for (const file of documentFiles) await copyFile(path.join(docs, file), path.join(evidence, 'documents', file));
const sections = [];
for (const file of documentFiles.filter(file => /^\d\d-.*\.md$/.test(file))) {
  sections.push(`<details><summary>${escape(file.replace(/\.md$/, ''))}</summary><pre>${escape(await readFile(path.join(docs, file), 'utf8'))}</pre></details>`);
}
const images = [];
for (const [file, label] of [
  ['baseline-desktop.jpg', 'Baseline desktop prima delle modifiche · 1440×1000'],
  ['final-smartphone.jpg', 'Home finale · smartphone 390×844'],
  ['final-tablet-rtl.jpg', 'Campione RTL finale · tablet 768×1024, edizione non approvata'],
  ['playwright-429/http-error-002.jpg', 'Playwright anteprima · il percorso /contatos restituisce 404'],
  ['playwright-429/route-change-001.jpg', 'Playwright anteprima · il percorso /come-lavoriamo/ apre la pagina attuale'],
]) {
  try { images.push(`<figure><img src="data:image/jpeg;base64,${(await readFile(path.join(evidence, file))).toString('base64')}" alt="${escape(label)}"><figcaption>${escape(label)}</figcaption></figure>`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const facts = [
  ['URL scoperti e contabilizzati', s.discovered], ['Fonti HTTP 200', s.sourceHTML200],
  ['Famiglie articolo / edizioni storiche', `${s.historicalArticleFamilies} / ${s.historicalArticleEditions}`],
  ['Lingue storiche / lingue nuove mantenute', `${s.historicalLocales.length} / ${s.implementedLocales.length}`],
  ['Corpo e titoli esatti per URL', s.exactBodyAndTitle], ['Corpo e titoli con sostituzioni registrate', `${s.authorizedBodyAndTitle} (${s.italianAuthorizedCorrectionMatches} IT; ${s.foreignDraftCorrectionMatches} bozze straniere)`],
  ['Confronto corpo/titolo: superato / fallito / non verificato', `${s.resultCounts.superato} / ${s.resultCounts.fallito} / ${s.resultCounts['non verificato']}`],
  ['Risorse archiviate / immagini indipendenti verificate', `${s.resourceArchive?.passed ?? 0} / ${s.mediaDelivery?.passed ?? 0}`],
  ['Differenze aperte nelle altre dimensioni', s.fieldChecks.openDifferences],
  ['Controlli browser con osservazioni conservate', `${s.browserCoverage?.observed ?? 0} / ${s.discovered}`],
  ['Ultimi status HTTP delle fonti', JSON.stringify(s.sourceHTTPCounts)],
  ...(routeExploration ? [['I 102 URL 429 esplorati nell’anteprima', `${routeExploration.total} (${JSON.stringify(routeExploration.sourceDiscoveryCounts)})`],
    ['Esiti delle 102 rotte nell’anteprima', JSON.stringify(routeExploration.previewStatusCounts)],
    ['Percorsi cambiati dall’app / redirect HTTP reali', `${routeExploration.pathChangedByPreviewRouting} / ${routeExploration.actualHTTPRedirects}`]] : []),
  ...(inventoryBrowser ? [['Playwright su tutti i percorsi', `${inventoryBrowser.total}; nessuna richiesta al sito storico`],
    ['Corpi accettati e verificati anche nel browser', `${inventoryBrowser.acceptedBodyRowsMatchingServedHTTP} / ${inventoryBrowser.acceptedBodyRows}`],
    ['Corrispondenze esatte / modifiche IT / bozze straniere', `${inventoryBrowser.exactSourceBodyMatches} / ${inventoryBrowser.authorizedItalianChangedRows} / ${inventoryBrowser.foreignDraftChangedRows}`],
    ['Corpi non confrontabili / errori browser', `${inventoryBrowser.sourceWithoutComparableHTTP200} / ${inventoryBrowser.pagesWithBrowserErrors}`]] : []),
];
const routeDetails = !routeExploration ? '' : [
  '<h2>Che cosa sono i 102 URL con risposta 429</h2><p>Non sono 102 articoli mancanti. Il sito storico ha risposto con una pagina anti-bot; Playwright ha esplorato questi percorsi soltanto nell’anteprima locale, senza ricontattare il dominio storico.</p>',
  `<ul>${Object.entries(routeExploration.sourceDiscoveryCounts).map(([key, value]) => `<li><strong>${escape(value)}</strong> ${escape(key === 'configured-redirect-not-proof-of-history' ? 'candidati generati dalle rotte già configurate (non prova di esistenza storica)' : key === 'public-cms-feed' ? 'feed in attesa di conferma dei contenuti' : 'link individuati nei contenuti acquisiti')}</li>`).join('')}`,
  `<li>Risposte anteprima: ${escape(JSON.stringify(routeExploration.previewStatusCounts))}. ${routeExploration.pathChangedByPreviewRouting} percorsi cambiano dopo il rendering; non sono redirect HTTP.</li></ul>`,
  '<p>Gli 89 candidati configurati comprendono 72 percorsi /{lingua}/articles/… in otto lingue, otto varianti /{lingua}/contact/, otto /{lingua}/how-we-work/ e /come-lavoriamo/. Nove feed restituiscono 503. Dei quattro link nei contenuti, /contatos restituisce 404; /contatti, /pt e /ru aprono una pagina. Il 404 non dimostra che /contatos fosse inesistente sul sito storico.</p>',
  '<details><summary>Apri la tabella Playwright di tutti i 102 URL</summary><div class="scroll"><table><thead><tr><th>Percorso fonte</th><th>Provenienza</th><th>Status anteprima</th><th>Percorso dopo il rendering</th><th>Titolo e H1</th></tr></thead><tbody>',
  ...routeExploration.results.map(row => `<tr><td><code>${escape(new URL(row.sourceURL).pathname)}</code></td><td>${escape((row.discovery ?? []).join(', '))}</td><td>${escape(row.previewHTTPStatus ?? 'non verificato')}</td><td><code>${escape(row.previewFinalURL ? new URL(row.previewFinalURL).pathname : '')}</code></td><td>${escape(row.title || row.error || '')}<br>${escape((row.h1 ?? []).join(' · '))}</td></tr>`),
  '</tbody></table></div></details>',
].join('');
const html = `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Migrazione Marenetto Build — stato documentato</title><style>
body{font:16px/1.55 system-ui,sans-serif;color:#17303b;margin:0;background:#f4f6f7}main{max-width:1160px;margin:auto;padding:32px 20px}h1{font-size:clamp(26px,4vw,42px);line-height:1.15}h2{margin-top:40px}.notice{background:#fff2d6;border-left:5px solid #9b6500;padding:20px}table{border-collapse:collapse;width:100%;background:white}th,td{text-align:left;padding:12px;border-bottom:1px solid #dce2e5;vertical-align:top}th{background:#e5edf0}details{margin:12px 0;padding:16px;background:white}summary{cursor:pointer;font-weight:650}pre{font:14px/1.5 system-ui;white-space:pre-wrap;overflow-wrap:anywhere}.scroll{overflow-x:auto}code{overflow-wrap:anywhere}figure{margin:20px 0;background:white;padding:12px}figure img{display:block;max-width:100%;max-height:650px;margin:auto;object-fit:contain}figcaption{margin-top:10px;color:#50656e}small{color:#50656e}@media print{details>pre{display:block}body{background:white}}
</style><main><h1>Marenetto Build<br>Migrazione storica: stato documentato</h1>
<p>Acquisizione aggiornata al ${escape(s.acquiredAt)}. Dati riproducibili e diff nel pacchetto allegato.</p>
<section class="notice"><strong>La migrazione non è completa.</strong><p>Restano limiti di accesso alle fonti, differenze da riconciliare, decisioni editoriali e una verifica browser indipendente parziale. Nessuna pubblicazione o apertura ai motori è stata effettuata.</p></section>
<h2>Conteggi verificabili</h2><table><tbody>${facts.map(([label, value]) => `<tr><th>${escape(label)}</th><td>${escape(value)}</td></tr>`).join('')}</tbody></table>
<p>I conteggi del corpo sono per URL, includono varianti e non si sommano alle famiglie articolo. Un testo identico non certifica da solo struttura, metadati, risorse o approvazione.</p>
<h2>Che cosa è cambiato</h2><ul><li>Fonti pubbliche e archivi locali conservati separatamente con hash e provenienza.</li><li>Immagini copiate senza alterarne i byte, servite da App Storage tramite un inventario chiuso; nessuna dipendenza silenziosa dal vecchio hosting per gli URL mappati.</li><li>Etichette native delle recensioni spagnole e olandesi riallineate alle risposte acquisite, senza sovrascrivere i cataloghi precedenti.</li><li>Dieci documenti, matrici CSV, confronto per dimensione e inventario delle chiavi linguistiche nel repository.</li></ul>
<h2>Che cosa serve per chiudere</h2><ul>${s.limitations.map(text => `<li>${escape(text)}</li>`).join('')}<li>Riconciliare l'esclusione dei nove URL del vecchio modulo incompleto.</li><li>Confermare diritti e revisioni effettive, senza dedurli dai controlli automatici.</li></ul>
${routeDetails}
${inventoryBrowser ? `<h2>Verifica browser su tutti i ${inventoryBrowser.total} URL</h2><p>Su ${inventoryBrowser.source200BodyComparedInBrowser} fonti HTTP 200 con testo archiviato, ${inventoryBrowser.exactSourceBodyMatches} corpi renderizzati coincidono con il testo storico. Altri ${inventoryBrowser.authorizedItalianChangedRows} testi hanno modifiche italiane registrate e ${inventoryBrowser.foreignDraftChangedRows} restano bozze in lingue straniere. Tutti i ${inventoryBrowser.acceptedBodyRows} confronti accettati si vedono nel DOM e corrispondono alla risposta servita. Restano ${inventoryBrowser.sourceBodyFailures.length} confronti falliti e ${inventoryBrowser.sourceWithoutComparableHTTP200} URL senza corpo sorgente confrontabile: sono candidati/404/429, non automaticamente contenuti mancanti.</p><p>La nuova anteprima ha restituito ${escape(JSON.stringify(inventoryBrowser.previewHTTPStatusCounts))}; sono stati registrati ${inventoryBrowser.pagesWithBrowserErrors} errori JavaScript, concentrati nelle route escluse translation-ok. Immagini, font e media non sono stati caricati durante la verifica DOM.</p><details><summary>Apri gli esiti browser di tutti i ${inventoryBrowser.total} URL</summary><div class="scroll"><table><thead><tr><th>Percorso fonte</th><th>HTTP storico</th><th>Esito corpo</th><th>Preview</th><th>Hash DOM uguale al contenuto servito</th><th>Titolo</th></tr></thead><tbody>${inventoryBrowser.results.map(row => `<tr><td><code>${escape(new URL(row.url).pathname)}</code></td><td>${escape(row.sourceHTTPStatus ?? 'n/d')}</td><td>${escape(row.expectedBodyResult ?? 'non verificato')}</td><td>${escape(row.previewHTTPStatus ?? 'non verificato')}</td><td>${escape(row.browserMatchesServedBody ?? false)}</td><td>${escape(row.title || row.navigationError || '')}</td></tr>`).join('')}</tbody></table></div></details>` : ''}
<h2>Documenti obbligatori</h2>${sections.join('\n')}
<h2>Registro completo degli URL</h2><div class="scroll"><table><thead><tr><th>URL storico</th><th>Fonte / nuovo</th><th>Corpo e titoli</th><th>Classificazione</th></tr></thead><tbody>${audit.rows.map(row => `<tr><td><code>${escape(row.url)}</code></td><td>${escape(row.http.original?.final ?? 'non acquisito')} / ${escape(row.http.served?.final ?? 'non acquisito')}</td><td>${escape(row.bodyResult)}</td><td>${escape(row.disposition)}</td></tr>`).join('')}</tbody></table></div>
<h2>Campioni visivi</h2><p>Questi campioni non sostituiscono il controllo di tutte le famiglie su tutte le viewport.</p>${images.join('\n')}
<small>Grafica approvata, blocchi di indicizzazione e separazione tra anteprima e produzione mantenuti. Nessun modulo reale inviato.</small></main></html>`;
await writeFile(path.join(evidence, 'Relazione-migrazione-storica.html'), html);
const files = [];
async function list(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) { await list(file); continue; }
    if (item.name === 'file-integrity.json') continue;
    const bytes = await readFile(file);
    files.push({ file: path.relative(evidence, file), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
}
await list(evidence);
await writeFile(path.join(evidence, 'file-integrity.json'), JSON.stringify({ createdAt: new Date().toISOString(), files }, null, 2));
console.log(`Packaged ${files.length} evidence files with SHA-256; report is self-contained.`);
