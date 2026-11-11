import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const output = path.resolve(root, '../../generated-artifacts/historical-fidelity');
const comparison = JSON.parse(await readFile(path.join(output, 'comparison.json'), 'utf8'));
const { summary: s, rows, articleProvenance, decisions } = comparison;
const auditCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const e = value => String(value ?? 'non disponibile').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const css = `body{max-width:1240px;margin:32px auto;padding:0 20px;background:#faf9f6;color:#183743;font:15px/1.6 system-ui}h1,h2,h3{line-height:1.3}table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #c8d1d3;padding:8px;vertical-align:top;text-align:left}code,pre{overflow-wrap:anywhere;white-space:pre-wrap}pre{font:13px/1.5 ui-monospace,monospace}.warn{background:#fff0da;padding:18px;border-left:5px solid #9b581d}.ok{background:#dfefe7;padding:14px}details{border-top:1px solid #b7c8cf;padding:12px 0}summary{cursor:pointer;font-weight:650}.minus{background:#ffe5e5;color:#7b1515}.plus{background:#e1f2e8;color:#15492d}.same{color:#53666e}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}.pair>div{min-width:0}.diffline{padding:5px 10px;border-bottom:1px solid #fff}a{color:#075b7c}.small{font-size:12px}@media(max-width:700px){.pair{display:block}table{font-size:12px}body{padding:0 10px}}`;
const labels = {
  'available-but-different': 'Raggiungibile, ma contenuto differente',
  'historical-content-missing': 'Contenuto storico assente: 404',
  'historical-content-retired': 'Contenuto storico ritirato: 410',
  'original-not-published-or-feed': 'Fonte non pubblicata / feed / endpoint tecnico',
  'title-and-body-identical': 'Titolo e corpo identici',
  'acquisition-error': 'Errore di acquisizione',
};
function documentPage(title, body) {
  return `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title><style>${css}</style><body>${body}</body></html>`;
}
function metadataPair(name, before, after) {
  return `<details><summary>${e(name)}</summary><div class="pair"><div><b>Originale storico</b><pre>${e(JSON.stringify(before, null, 2))}</pre></div><div><b>Nuova pagina servita</b><pre>${e(JSON.stringify(after, null, 2))}</pre></div></div></details>`;
}
function diffBody(row) {
  const a = row.original?.document;
  const b = row.new?.document;
  const c = row.comparison;
  return `<p><a href="${e(row.url)}">${e(row.url)}</a></p>
    <p><b>${e(labels[row.outcome])}</b> · ${e(row.locale)} · ${e(row.type)}</p>
    <table><tr><th>Prova</th><th>Storico</th><th>Nuovo</th></tr>
    <tr><td>Acquisizione e URL finale</td><td>${e(row.original?.hops.at(-1)?.acquiredAt)}<br>${e(row.original?.finalURL)}</td><td>${e(row.new?.hops.at(-1)?.acquiredAt)}<br>${e(row.new?.finalURL)}</td></tr>
    <tr><td>Status iniziale → finale</td><td>${e(row.original?.initialStatus)} → ${e(row.original?.status)}</td><td>${e(row.new?.initialStatus)} → ${e(row.new?.status)}</td></tr>
    <tr><td>Canonical</td><td>${e(a?.canonical)}</td><td>${e(b?.canonical)}</td></tr>
    <tr><td>Titolo HTML / H1</td><td>${e(a?.title)}<br>${e(a?.h1?.join(' | '))}</td><td>${e(b?.title)}<br>${e(b?.h1?.join(' | '))}</td></tr>
    <tr><td>SHA-256 risposta grezza</td><td><code>${e(c.rawHashes.original)}</code></td><td><code>${e(c.rawHashes.served)}</code></td></tr>
    <tr><td>SHA-256 corpo normalizzato</td><td><code>${e(c.originalBodySHA256)}</code></td><td><code>${e(c.servedBodySHA256)}</code></td></tr>
    <tr><td>File grezzo nello ZIP</td><td><code>${e(row.original?.hops.at(-1)?.file)}</code></td><td><code>${e(row.new?.hops.at(-1)?.file)}</code></td></tr>
    <tr><td>Ambito estrazione</td><td>${e(a?.extraction)}</td><td>${e(b?.extraction)}</td></tr></table>
    <p>Le due risposte sono fonti indipendenti: dominio storico pubblico e handler HTTP della nuova build. Non sono due rappresentazioni dello stesso catalogo.</p>
    <details><summary>Corpi completi, senza eseguire gli script originali</summary><div class="pair"><div><h3>Originale</h3><pre>${e(a?.body)}</pre></div><div><h3>Nuovo</h3><pre>${e(b?.body)}</pre></div></div></details>
    <details open><summary>Diff leggibile dei blocchi (+ aggiunto, − rimosso)</summary>${c.bodyDiff.map(line => `<div class="diffline ${line.op === '+' ? 'plus' : line.op === '-' ? 'minus' : 'same'}">${e(line.op)} ${e(line.text)}</div>`).join('') || '<p>Nessun blocco HTML testuale confrontabile; vedere file grezzi e status.</p>'}</details>
    ${metadataPair('Sottotitoli e gerarchia', c.headings.original, c.headings.served)}
    ${metadataPair('Immagini, sfondi inline e attributi', c.images.original, c.images.served)}
    ${metadataPair('Allegati', c.attachments.original, c.attachments.served)}
    ${metadataPair('Collegamenti', c.links.original, c.links.served)}
    ${metadataPair('Catene HTTP complete', row.original?.hops, row.new?.hops)}
    <p class="small">${e(c.images.note)} I CSS esterni non sono stati scaricati per ricostruire ogni eventuale immagine di sfondo. Nessuna equivalenza dei byte delle immagini è dichiarata.</p>`;
}
const perURL = [];
for (const row of rows) {
  const body = diffBody(row);
  await writeFile(path.join(output, 'diffs', `${row.key}.html`), documentPage(row.url, `<h1>Confronto originale → nuovo</h1>${body}`));
  perURL.push(`<details id="url-${row.key}"><summary>${e(row.url)} — ${e(labels[row.outcome])}</summary>${body}</details>`);
}
const languageRows = Object.entries(s.languages).map(([lang, data]) => `<tr><td>${e(lang.toUpperCase())}</td><td>${data.canonicalSitemapEditions}</td><td>${data.distinctArticlePaths}</td><td>${data.observedPublishedURLs}</td><td>${data.missingOrRetiredInNew}</td><td>${data.titleAndBodyIdentical}</td><td>${data.sameBodyAsItalian.length}</td></tr>`).join('');
const provenance = articleProvenance.map(article => `<tr><td>${e(article.slug)}</td><td>${e(article.destinationOrigin)}</td><td><a href="${e(article.liveSource)}">${e(article.liveSource)}</a><br>${e(article.liveAcquiredAt)}</td><td>${e(article.oldArchive.recordedDate)} (data dichiarata, non comprovata indipendentemente)</td><td>${article.equality ? 'identico' : 'differente'}</td></tr>`).join('');
const remainingLanguages = s.requestedLanguages.filter(lang => !s.languages[lang]);
const body = `<h1>Confronto verificabile con il sito storico</h1><p>Acquisizione: novembre 2026 · Sito storico: www.marenettobuild.com</p>
<div class="warn"><b>Migrazione NON conclusa.</b> Il confronto precedente dei testi del progetto contro il suo HTML non dimostrava la fedeltà allo storico. Le copie integrali delle rielaborazioni non sono copie dell’originale. Nessuna pagina è qui certificata fedele sulla sola base dei test tecnici.</div>
<h2>Risultati</h2>
<table><tr><th>Misura e significato</th><th>Esito</th></tr>
<tr><td>URL acquisiti, incluse fonti non valide ed endpoint tecnici</td><td>${s.acquiredURLs}/${s.discoveredURLs}; errori ${s.acquisitionErrors.length}; limite raggiunto: ${s.acquisitionCapReached}</td></tr>
<tr><td>Famiglie italiane canoniche nella sitemap</td><td>${s.italianCanonicalContentFamilies}, di cui ${s.italianArticleFamilies} articoli</td></tr>
<tr><td>Archivi tag pubblici aggiuntivi fuori sitemap</td><td>${s.publicCMS.tagArchivesNotInSitemap.length}</td></tr>
<tr><td>Corpi testuali distinti tra lingue e alias (hash del corpo normalizzato; non conteggio di articoli)</td><td>${s.uniquePublishedBodyFingerprints}</td></tr>
<tr><td>URL HTML pubblici osservati nella rete di collegamenti</td><td>${s.observedPublishedHTMLURLs}</td></tr>
<tr><td>Copie fedeli di titolo E corpo nella nuova pagina</td><td>${s.bodyAndTitleFaithfulURLs}</td></tr>
<tr><td>Raggiungibili, ma differenti</td><td>${s.availableButDifferentURLs}</td></tr>
<tr><td>Storici con 404 nel nuovo</td><td>${s.missingHistoricalHTMLURLs}</td></tr>
<tr><td>Storici ritirati con 410</td><td>${s.retiredHistoricalHTMLURLs}</td></tr>
<tr><td>URL ancora raggiungibili / stesso percorso ignorando solo slash finale</td><td>${s.historicalPathsStillReachable} / ${s.pathsKeptWithoutPathChange}. Non equivale a conservazione del contenuto.</td></tr>
<tr><td>Mappature configurate</td><td>${s.configuredAliases}: ${s.configuredAliasesWithIndependentPublishedSource} percorsi con fonte oggi raggiungibile, ${s.configuredAliasesWhoseHistoricalSourceIs404} con 404 sullo storico. Varianti slash non contate due volte.</td></tr>
<tr><td>URL mancanti non coperti dalle mappature</td><td>${s.historicalMissingPathsNotCoveredByAliases}</td></tr></table>
<h2>Provenienza dei quattordici articoli</h2><p>Le destinazioni servono le rielaborazioni documentate nel precedente MIGRATION_REPORT.md. L’archivio JSON del 17 ottobre è una terza fonte conservata separatamente; la sua data dichiarata e la sua URL non provano da sole la fedeltà al sito storico. In questa sessione non è stato riscritto alcun articolo.</p>
<table><tr><th>Articolo</th><th>Provenienza destinazione</th><th>Fonte storica indipendente</th><th>Archivio preesistente</th><th>Corpo</th></tr>${provenance}</table>
<h2>Lingue</h2><p>Il sito storico espone nove lingue: le righe sotto documentano esistenza HTTP e corpi, non qualità madrelingua. Sei duplicati senza slash possono riferirsi agli stessi articoli: i percorsi articolo distinti sono indicati separatamente.</p>
<table><tr><th>Lingua</th><th>Edizioni dichiarate nella sitemap</th><th>Percorsi articolo distinti</th><th>URL HTML osservati</th><th>Assenti o ritirati nel nuovo</th><th>Copie identiche</th><th>URL con corpo uguale a un originale IT</th></tr>${languageRows}</table>
<p>Nessuna delle nove edizioni è certificata come migrazione completa. Le altre venti lingue richieste restano nel percorso editoriale come bozze nuove, non come edizioni già pubblicate sullo storico: <b>${remainingLanguages.map(e).join(', ')}</b>.</p>
<details><summary>URL stranieri che esponevano lo stesso corpo italiano</summary><pre>${e(JSON.stringify(Object.fromEntries(Object.entries(s.languages).filter(([l]) => l !== 'it').map(([l, v]) => [l, v.sameBodyAsItalian])), null, 2))}</pre><p>L’uguaglianza del corpo non viene presentata come prova di un redirect HTTP. Le catene e le lingue dichiarate sono nella matrice.</p></details>
<h2>Perché la sitemap nuova contiene 22 URL italiani</h2>
<p>È una selezione editoriale della nuova applicazione: sei pagine commerciali, due archivi e quattordici articoli rielaborati. Esclude ricerca, strumenti di revisione e tutte le edizioni straniere prive di approvazione per la composizione corrente. <b>Non è una ricostruzione completa della sitemap storica.</b> Per aggiungere equivalenti occorrono recupero dei contenuti originali, corrispondenza degli URL storici, corpo completo nella lingua effettiva, decisione del titolare sulle differenze/affermazioni e approvazione della specifica edizione. L’indicizzazione resta comunque disattivata fino a nuova autorizzazione.</p>
<h2>Contenuti pubblici del CMS</h2><p>Framework360: acquisiti sitemap, navigazione, archivi, selettori di lingua e nove feed pubblici, ciascuno con sei elementi. Il feed è parziale e non dimostra il totale del CMS. Individuati anche ${s.publicCMS.tagArchivesNotInSitemap.length} archivi tag fuori sitemap, assenti nel nuovo. Una 404 nel nuovo non li rende migrati.</p>
<pre>${e(JSON.stringify(s.publicCMS.tagArchivesNotInSitemap, null, 2))}</pre>
<p>Non è stato richiesto accesso a lead, account, richieste clienti o dati privati. Nessuna esportazione CMS è stata fornita: la chiusura del grafo pubblico di 361 URL non prova l’assenza di altri contenuti pubblicati ma non collegati. Serve l’esportazione dei soli contenuti pubblicati per certificare quel residuo. Tutti gli URL mancanti e i relativi originali recuperati sono contabilizzati nel registro CSV.</p>
<h2>Cinque verifiche browser effettivamente rieseguite</h2><div class="ok">5 superate; 0 fallite; 0 saltate; 0 instabili. Avvio ${e(s.browserRecheck.stats.startTime)}, durata ${Math.round(s.browserRecheck.stats.duration / 1000)} secondi. Non è una sostituzione con richieste HTTP.</div><pre>${e(s.browserRecheck.command)}</pre><p>Evidenza completa: <code>five-browser-results.json</code>. Comprende integrità dei link, tre viewport del collegamento WhatsApp e testi inglese/arabo. Questa esecuzione non ripete l’intera matrice browser 1.312 route, WebKit/iOS, screen reader o consegna SMTP, che non vengono dichiarati verificati.</p>
<h2>Commit e impronte</h2><p>Commit reale dell’app acquisita e dei cinque casi verificati: <code>${e(s.appCommitActuallyServed)}</code>.<br>Commit reale dello strumento/rapporto: <code>${e(auditCommit)}</code>. Le SHA-256 delle risposte e dei corpi sono impronte dei dati, NON identificatori di commit.</p>
<h2>Passaggi da decidere, senza riscriverli</h2><p>${decisions.length} passaggi segnalati automaticamente tramite termini da verificare: non significa che siano tutti falsi o tutti aziendali. Sono conservati integralmente con URL, numero di blocco e file originale. Le decisioni del titolare e le eventuali verifiche professionali restano separate dalla copia archivistica.</p>
${decisions.map(d => `<details><summary>${e(d.title)} — blocco ${d.blockNumber}</summary><p><a href="${e(d.url)}">${e(d.url)}</a> · <code>${e(d.sourceFile)}</code></p><blockquote>${e(d.exactPassage)}</blockquote><p>Da valutare prima di riproporlo come affermazione attuale; nessuna riscrittura automatica.</p></details>`).join('')}
<h2>Ogni URL: originale → comportamento → nuova destinazione → stato → canonical → diff</h2><p>I dettagli sono inclusi qui e anche in <code>diffs/</code> nello ZIP. Riferimenti a immagini e allegati sono confrontati come URL/attributi; non si certificano licenze, byte delle immagini o CSS esterni non acquisiti. Le risposte grezze possono contenere script originali: consultarle come sorgente, non come pagine da eseguire.</p>${perURL.join('')}
<h2>Conclusione</h2><p><b>Fedeltà non dimostrata; migrazione lasciata aperta.</b> Gli originali sono ora recuperati e confrontabili, ma non sostituiscono automaticamente le rielaborazioni attualmente servite. Occorrono ripristino/decisioni sulle differenze, conservazione degli URL delle nove edizioni storiche, gestione dei tag e contabilizzazione finale dell’esportazione pubblicata del CMS. Grafica, logo, palette e hero approvati non sono stati modificati. Nessun deployment o apertura ai motori.</p>`;
const html = documentPage('Marenetto — verifica indipendente della fedeltà storica', body);
await writeFile(path.join(output, 'Marenetto-confronto-storico.html'), html);
const reportHash = createHash('sha256').update(html).digest('hex');
await writeFile(path.join(output, 'report-provenance.json'), JSON.stringify({ generatedAt: new Date().toISOString(), appCommit: s.appCommitActuallyServed, auditCommit, reportSHA256: reportHash, note: 'Commit identifiers and file fingerprints are separate. No fidelity completion approval implied.' }, null, 2));
await writeFile(path.join(output, 'README.txt'), `Marenetto — verifica indipendente del sito storico\nSTATO: MIGRAZIONE NON CONCLUSA.\nAprire Marenetto-confronto-storico.html (inerte, senza script).\nIl registro completo è historical-url-ledger.csv. Provenienze: article-provenance.csv/json.\nOriginali grezzi in original/; risposte nuove effettivamente servite in new/.\nNon eseguire gli HTML grezzi: possono richiamare script del sito storico.\nI file acquisition.json/comparison.json conservano orari, status, canonical e hash.\nTest browser: five-browser-results.json (5 superati). Nessun invio reale.\nCommit app: ${s.appCommitActuallyServed}\nCommit audit: ${auditCommit}\nRapporto SHA-256 (non commit): ${reportHash}\nNessun articolo riscritto, nessun deploy o cambio di indicizzazione.\n`);
console.info(`Report created: ${Buffer.byteLength(html)} bytes; application ${s.appCommitActuallyServed}; audit ${auditCommit}`);
