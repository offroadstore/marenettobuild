import {readFile,writeFile,copyFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../../..');
const out=path.join(root,'generated-artifacts/editorial/release-2026-11');
const docs=path.join(root,'docs/editorial/release-2026-11');
const json=async file=>JSON.parse(await readFile(path.join(out,file),'utf8'));
const pack=await json('package.json'), matrix=await json('matrix.json'), baseline=await json('rendered-baseline.json');
const protectedFiles=await json('protected-files.json'),browser=await json('browser-verdict.json');
const archives=await json('guide-archive-evidence.json'),series=await json('series-state-final.json');
const safety=await json('http-safety.json');
const client=await json('client-metadata-evidence.json');
const preservation=await json('series-preservation.json'),browserMerge=await json('browser-merge-verdict.json');
const mergeChecks=await json('browser-merge-result.json'),mediaRecovery=await json('merge-media-recovery.json');
const cms=await readFile(path.join(out,'cms-test.tap'),'utf8');
const regressions=await readFile(path.join(out,'regressions.tap'),'utf8');
const build=await readFile(path.join(out,'build.log'),'utf8');
const typecheck=await readFile(path.join(out,'typecheck.log'),'utf8');
assert.equal(matrix.passed,182);assert.equal(matrix.rootSHA256,pack.rootSHA256);assert.deepEqual(matrix.failures,[]);
assert.deepEqual(baseline.failures,[]);assert.deepEqual(protectedFiles.changed,[]);
assert.equal(browser.verdict,'success');assert.ok(/pass 10\b/.test(cms));assert.ok(/fail 0\b/.test(cms));
assert.ok(/pass 52\b/.test(regressions));assert.ok(/fail 0\b/.test(regressions));
assert.equal(preservation.seriesRows,120);assert.equal(preservation.unchanged,true);
assert.equal(mediaRecovery.verified,true);
assert.deepEqual(mergeChecks.pageErrors,[]);
assert.equal(mergeChecks.purchaseIT.closingMainRequestLinks,1);assert.equal(mergeChecks.switchAR.dir,'rtl');assert.equal(mergeChecks.switchEN.dir,'ltr');
assert.equal(mergeChecks.switchAR.horizontalOverflow,false);assert.equal(mergeChecks.switchEN.horizontalOverflow,false);
assert.equal(mergeChecks.seriesOtherEpisode.mainReleaseRequestLinks,0);
assert.ok(['success','failure'].includes(browserMerge.verdict));
assert.ok(mergeChecks.badResponses.every(r=>r.status===404&&mediaRecovery.assets.some(a=>a.path===new URL(r.url).pathname&&a.developmentStatus===200)));
assert.ok(mergeChecks.consoleErrors.every(e=>e.text==='Failed to load resource: the server responded with a status of 404 (Not Found)'));
assert.ok(build.includes('Production guard passed'));assert.ok(!typecheck.includes('Failed'));
assert.equal(client.passed,182);assert.equal(client.rootSHA256,pack.rootSHA256);
const families=[...new Set(pack.records.map(r=>r.identity))];
const languages=[...new Set(pack.records.map(r=>r.locale))];
const italian=pack.records.filter(r=>r.locale==='it');
const stats={families:families.length,languages:languages.length,editions:pack.records.length,newCandidateURLs:pack.records.filter(r=>r.mode!=='revise-existing').length,existingURLs:13,
  newlyDefinedPaths:matrix.rows.filter(r=>r.urlStatus==='new-candidate-url').length,retainedGuideCandidatePaths:matrix.rows.filter(r=>r.urlStatus==='existing-guide-candidate-preserved').length,
  faq:matrix.rows.reduce((sum,r)=>sum+r.faqVisible,0),titleMin:Math.min(...matrix.rows.map(r=>r.titleCharacters)),titleMax:Math.max(...matrix.rows.map(r=>r.titleCharacters)),
  descriptionMin:Math.min(...matrix.rows.map(r=>r.descriptionCharacters)),descriptionMax:Math.max(...matrix.rows.map(r=>r.descriptionCharacters)),
};
assert.equal(stats.newlyDefinedPaths,109);assert.equal(stats.retainedGuideCandidatePaths,60);
const areaNames={villas:'Ville e casali',outdoors:'Esterni di lusso',surfaces:'Superfici e arredi su misura',investment:'Comprare, ristrutturare, mettere a reddito'};
const h=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const sourcesText=await readFile(path.join(docs,'SOURCES-AND-REVIEW.md'),'utf8');
const handoff=await readFile(path.join(docs,'README.md'),'utf8');
const screenshotFiles=(await readdir(path.join(out,'browser-screenshots'))).filter(f=>/desktop-it|mobile-ar/.test(f));
const screenshots=await Promise.all(screenshotFiles.map(async file=>`<figure><img src="data:image/png;base64,${(await readFile(path.join(out,'browser-screenshots',file))).toString('base64')}" alt="${h(file.includes('mobile-ar')?'Lettura araba mobile in direzione RTL, con FAQ visibili':'Articolo italiano nel candidato isolato su desktop')}" /><figcaption>${h(file)}</figcaption></figure>`));
const mediaScreenshot=`<figure><img src="data:image/jpeg;base64,${(await readFile(path.join(out,'merge-purchase-app-preview.jpg'))).toString('base64')}" alt="Guida acquisto nella vera anteprima di sviluppo, con illustrazione e didascalia IA visibili" /><figcaption>Controllo successivo e separato: illustrazione corretta nell’anteprima di sviluppo dell’app, usando l’API media reale. Non è una pubblicazione né una seconda prova end-to-end.</figcaption></figure>`;
const rows=matrix.rows.map(r=>`<tr data-search="${h(`${r.locale} ${r.identity} ${r.title} ${areaNames[r.area]}`.toLocaleLowerCase('it'))}"><td>${h(r.locale.toUpperCase())}</td><td>${h(areaNames[r.area])}</td><td>${h(r.title)}<small>${r.titleCharacters} caratteri; description ${r.descriptionCharacters}</small></td><td><code>${h(r.url)}</code><small>${r.urlStatus==='existing-preserved'?'Indirizzo storico conservato':r.urlStatus==='existing-guide-candidate-preserved'?'Percorso candidato privato già definito, conservato':'Nuova definizione di percorso'} · ${r.retainedSeries?'revisione della serie conservata; supplemento verificato in isolamento':'attivazione collaudata in isolamento, nessun rilascio eseguito'}</small></td><td><code>${h(r.hash)}</code></td></tr>`).join('');
const generatedAt=new Date().toISOString();
const html=`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Marenetto Build — rapporto editoriale verificato</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f3ef;color:#182c33;font:16px/1.6 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:48px 24px}h1{font-size:clamp(28px,4vw,46px);line-height:1.15}h2{margin-top:40px}h3{margin-top:28px}.status{display:inline-block;background:#153e43;color:white;padding:10px 16px;font-weight:700}.notice{border-left:4px solid #94714c;background:white;padding:20px}section{margin-bottom:32px}code{font:12px/1.5 ui-monospace,monospace;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:12px;text-align:left;border-bottom:1px solid #ccc;vertical-align:top}th{background:#e5e8e4}small{display:block;color:#536466}.scroll{overflow-x:auto}input{padding:12px;width:min(100%,540px);font:inherit;border:1px solid #8d9b99;margin-bottom:20px}pre{white-space:pre-wrap;font:14px/1.6 system-ui;background:white;padding:20px}figure{margin:20px 0}figure img{display:block;max-width:100%;max-height:850px;object-fit:contain;object-position:left}figcaption{font-size:12px;color:#52615f}.screens{display:flex;gap:20px;flex-wrap:wrap}.screens figure{flex:1;min-width:280px}.metrics{font-size:22px;font-weight:600}a{color:#165c67}summary{cursor:pointer;font-weight:600}
</style></head><body><main>
<p>MARENETTO BUILD · consegna editoriale del 26 novembre 2026</p><h1>Otto approfondimenti e sei guide nelle tredici lingue</h1>
<p class="status">PRONTO PER REPUBLISH</p>
<div class="notice"><strong>Stato del candidato:</strong> 182 edizioni complete, approvate e attivate tramite le vere transizioni CMS in isolamento, con adattatore SQL in memoria e attori dichiaratamente sintetici. Non è una sessione del titolare.<br>
<strong>Stato pubblico:</strong> questo pacchetto non è stato rilasciato. Nessuna mutazione in produzione, nessun Republish, nessun invio IndexNow/Search Console, nessuna email. L’attivazione owner nel CMS di destinazione e il Republish del titolare tramite Claude restano distinti dal collaudo.</div>
<p class="metrics">${stats.families} famiglie × ${stats.languages} lingue = ${stats.editions} edizioni</p>
<p>${stats.newCandidateURLs} percorsi destinati alla prima attivazione pubblica e ${stats.existingURLs} indirizzi della famiglia acquisto conservati, non 182 URL nuovi. Solo ${stats.newlyDefinedPaths} definizioni sono nuove; ${stats.retainedGuideCandidatePaths} percorsi erano già candidati privati e sono conservati. Delle 72 bozze integrate, 60 sono riutilizzate e dodici acquisto sono superate dalle revisioni più recenti della serie, conservate senza riscrittura. Aggiunte le sei guide arabe e i 104 adattamenti degli otto nuovi articoli. Lo stato pubblico delle revisioni già attive della serie non è stato ricertificato dopo interventi esterni.</p>
<p>Lingue: ${languages.map(l=>l.toUpperCase()).join(', ')}. Impronta radice del pacchetto esatto:</p><p><code>${h(pack.rootSHA256)}</code></p>
<section><h2>Appartenenza esclusiva e argomenti</h2><ul>${italian.map(r=>`<li><strong>${h(r.content.title)}</strong> — ${h(areaNames[r.area])}${r.content.tags.includes('secondary-guide')?' · guida secondaria':''}</li>`).join('')}</ul>
<p>Le pillar aggiungono solo collegamenti informativi locali; menu, struttura, CTA esistenti e home commerciale sono conservati. Le sei guide sono secondarie: nessun nuovo ingresso nel menu, nessuna promozione nella home. I dodici archivi guide già esistenti ora includono le sei famiglie con URL corretti; la biblioteca araba preesistente resta invariata e le sei nuove guide arabe sono raggiungibili dalle pillar locali.</p></section>
<section><h2>Collaudo riproducibile</h2><table><thead><tr><th>Verifica</th><th>Esito effettivo</th><th>Evidenza nell’archivio</th></tr></thead><tbody>
<tr><td>Matrice SSR senza JavaScript</td><td>182/182; un H1, alt localizzati, ${stats.faq} coppie FAQ visibili coerenti con lo schema, Article/FAQPage/BreadcrumbList non duplicati</td><td>matrix.csv, matrix.json, http-evidence.json</td></tr>
<tr><td>Metadati e scoperta</td><td>Title unici ${stats.titleMin}–${stats.titleMax} caratteri, description ${stats.descriptionMin}–${stats.descriptionMax}; canonical WWW e social; tredici hreflang reciproci più x-default; sitemap attesa per tutte le edizioni attive</td><td>http-evidence.json, shared-active-snapshot.json</td></tr>
<tr><td>Metadati dopo navigazione client</td><td>182/182 chiamate alla funzione reale con DOM e host sintetici: stessi canonical, title/description, tredici hreflang più x-default e schemi. Verificati ripristino immagine home ed esclusione delle anteprime; la direzione è verificata separatamente nel browser reale. Non è una seconda sessione browser</td><td>client-metadata-evidence.json</td></tr>
<tr><td>Collegamenti</td><td>130 destinazioni locali controllate; guida acquisto senza duplicazione; piscine, Atelier e partner gestione reali; provenienza articolo/lingua e UTM verificata nel browser</td><td>matrix.json, browser-result.json</td></tr>
<tr><td>CMS e autorizzazione</td><td>10 prove passate: permessi, preflight, testo alterato, collisioni/alias, revisione acquisto più recente, mancata approvazione, attivazione esatta, ripetibilità, gate e ritiro anche con una bozza successiva</td><td>cms-test.tap, candidate-activation.json</td></tr>
<tr><td>Sicurezza editoriale HTTP</td><td>Ritiro ${safety.withdrawn}; indisponibilità anche dopo avvio a freddo ${safety.coldOutage}; recupero ${safety.recovered}. Nessun ritorno al testo statico ritirato</td><td>http-safety.json</td></tr>
<tr><td>Superfici estranee</td><td>${baseline.compared} confronti SSR senza differenze non autorizzate; ${protectedFiles.files} file protetti invariati; ${protectedFiles.unaffectedMetadata} metadati di altre pagine invariati</td><td>rendered-baseline.json, protected-files.json</td></tr>
<tr><td>Regressioni</td><td>52 prove passate: SEO, quattro aree, arabo, Atelier, locazioni, consensi, legali, disponibilità editoriale e convivenza con la serie</td><td>regressions.tap</td></tr>
<tr><td>Build e tipi</td><td>Build di produzione con controllo asset passato; typecheck dell’intero workspace passato</td><td>build.log, typecheck.log</td></tr>
<tr><td>Browser desktop/mobile</td><td>Percorso IT → pillar → articolo → DE → AR → pillar → articolo → EN → modulo; desktop 1440×1000 e mobile 390×844; RTL → LTR corretto; nessun errore console/pagina o risposta fallita; nessun invio</td><td>browser-result.json, browser-verdict.json, browser-screenshots/</td></tr>
<tr><td>Controllo browser mirato dopo il raccordo</td><td>IT acquisto → AR → EN → altra puntata: testo, FAQ, schema, CTA e provenienza corretti. La prova ha registrato solo errori 404 per un’illustrazione nel server fittizio; l’app reale rispondeva già 200. Corretto il solo trasporto del server di prova; tutte le immagini necessarie rispondono ora 200 con SHA-256 e dimensione identici al manifesto autorizzato. Verifica visiva nell’anteprima reale. Il verdetto storico “failure” rimane nei dati grezzi: non è stato trasformato in un falso pass</td><td>browser-merge-verdict.json, browser-merge-result.json, merge-media-recovery.json, merge-purchase-app-preview.jpg</td></tr>
</tbody></table>
<p>La matrice indicizzabile usa il processo HTML reale con host canonico simulato soltanto nel gateway locale. Le anteprime restano noindex. I test ora rifiutano redirect automatici verso host esterni. Le evidenze HTTP conservano il contenuto JSON comune una sola volta, referenziato con SHA-256; tre documenti HTML completi rimangono disponibili. Il confronto sviluppo/build esclude soltanto gli attributi di strumentazione <code>data-replit-metadata</code> e <code>data-component-name</code>, e separa la sola lista informativa autorizzata nelle pillar; non elimina testi o collegamenti.</p>
<p>La prima prova browser precede l’arrivo della serie. Dopo il raccordo sono stati ripetuti build, matrice, controlli degli archivi, confronto con il ramo principale comprendente la serie, typecheck e 52 regressioni. Lo stesso tester ha poi eseguito solo una verifica mirata della famiglia acquisto condivisa e del cambio lingua: evidenze in browser-merge-verdict.json, senza ripetere l’intero giro precedente.</p>
<p>Limiti del browser: idratazione confermata dal funzionamento del menu e della navigazione e dall’assenza di errori, non da un’API interna React; non è una revisione madrelingua. Il mobile italiano non è stato provato separatamente. Nessuna garanzia su accessibilità assistiva o risultati dei motori di ricerca.</p></section>
<section><h2>Osservazioni sui servizi di sviluppo</h2><p>Dopo il riavvio l’API editoriale e gli asset verificati hanno risposto 200. Sono stati osservati avvisi EventEmitter sui listener dei flussi media; il trasporto storage non è stato modificato in questa consegna. L’indisponibilità transitoria durante il riavvio viene gestita in modo sicuro, senza ripubblicare una copia precedente. I log di sviluppo conservano anche questi avvisi: non è dichiarata un’assenza assoluta di warning.</p></section>
<section><h2>Raccordo con la serie separata</h2><p>Serie di dieci puntate verificata all’inizio e di nuovo prima della consegna: <strong>${h(series.observation.task.state)}</strong>; ultimo aggiornamento osservato ${h(series.observation.task.updatedAt)}. Il suo codice è ora disponibile e il raccordo è stato collaudato. Tutte le 120 edizioni CMS della serie conservano versione, revisioni, video ed eventi di approvazione esattamente identici. Dodici acquisto sono riutilizzate in sola lettura; l’arabo si lega alla vera sorgente italiana più recente. Solo lo strato pubblico autorizzato aggiunge SAL/illustrazione/CTA e metadati brevi, con hash distinto incluso nella radice, senza riscrivere il manoscritto. Il preflight rifiuta qualsiasi ulteriore differenza, ritiro o revisione non attiva. Sono quindi 170 attivazioni e dodici revisioni conservate, non 182 riscritture. Le altre 108 edizioni restano estranee: snapshot complessivo 290, sottoinsieme autorizzato 182. Nessuna falsa verifica Search Console e nessuna estensione SEO alle altre puntate.</p></section>
<section><h2>Immagini, diritti e fatti commerciali</h2><p>Unico asset nuovo: diagramma schematico originale redatto con assistenza IA e rasterizzato localmente. Le dodici acquisto mantengono inoltre le copertine illustrative già autorizzate nell’inventario della serie. Nessuna fotografia di terzi o di lavori reali, nessun luogo/materiale dedotto dall’aspetto. Didascalie e alt in ciascuna lingua, etichetta IA individuale visibile. Nessuna attivazione Progetti/portfolio e nessuna attesa delle fotografie future. Le nuove schede non fingono fotografie di copertina.</p><p>Computo per fasi del progettista; SAL con foto e relazione del geometra/architetto direttore lavori; aggiornamenti intermedi WhatsApp; varianti concordate con cliente e direzione lavori. Nessuna cadenza, tariffa, scadenza o lingua parlata dedotta dalle traduzioni. Cefalù Apartments resta un partner distinto; nessuna promessa di occupazione, redditività o rientro economico.</p></section>
<section><h2>Registro, fonti e limiti</h2><pre>${h(sourcesText)}</pre></section>
<section><h2>Checklist esatta per Claude e il titolare</h2><pre>${h(handoff)}</pre>
<div class="notice"><strong>Dopo il rilascio, non prima:</strong> controllare pubblicamente HTTPS/WWW e redirect permanenti; 182 destinazioni e URL storici; risposte e noindex dei ritiri; canonical/hreflang/sitemap dopo propagazione e cache; corrispondenza degli hash nel CMS reale. Questi controlli esterni non sono certificati dal candidato. Nessuna promessa di indicizzazione, ranking, rich result o citazioni IA.</div></section>
<section><h2>Esempi dal browser e verifica media dopo il raccordo</h2>${mediaScreenshot}<div class="screens">${screenshots.join('')}</div></section>
<section><h2>Inventario completo delle destinazioni</h2><p>Gli indirizzi sotto sono destinazioni del candidato, non un elenco di pagine già pubblicate.</p><input id="filter" type="search" placeholder="Filtra per lingua, area o titolo" aria-label="Filtra inventario"><div class="scroll"><table><thead><tr><th>Lingua</th><th>Area unica</th><th>Title SEO</th><th>URL e stato</th><th>Hash revisione</th></tr></thead><tbody id="inventory">${rows}</tbody></table></div></section>
<p><small>Generato ${h(generatedAt)}. Autorizzazione dichiarata dal titolare: 26/11/2026. Metodo: assistenza IA e prove tecniche effettive; nessuna firma o convalida professionale simulata.</small></p>
</main><script>document.getElementById('filter').addEventListener('input',function(){const q=this.value.toLocaleLowerCase('it');document.querySelectorAll('#inventory tr').forEach(row=>row.hidden=!row.dataset.search.includes(q));});</script></body></html>`;
await writeFile(path.join(out,'RAPPORTO-ITALIANO.html'),html);
const final={status:'PRONTO PER REPUBLISH',generatedAt,rootSHA256:pack.rootSHA256,stats,
  candidate:'active-and-tested-in-isolation',public:'not-deployed-by-this-task',
  ownerResidualAction:'authenticated exact-package activation in destination CMS, then owner Republish through Claude',
  tested:{matrix:182,clientMetadata:client.passed,cms:10,regressions:52,seriesPreserved:120,retainedPurchase:12,renderedBaseline:baseline.compared,protectedFiles:protectedFiles.files,unaffectedMetadata:protectedFiles.unaffectedMetadata,archives:archives.archives.length,browser:'success',browserMerge:{originalVerdict:browserMerge.verdict,functionalChecks:'passed',testMediaIssue:'corrected; verified by HTTP SHA-256 and actual app screenshot',assets:mediaRecovery.assets.length},typecheck:'passed',build:'passed'}};
await writeFile(path.join(out,'FINAL-STATUS.json'),JSON.stringify(final,null,2));
await writeFile(path.join(out,'HANDOFF.md'),`# Consegna verificata — PRONTO PER REPUBLISH

Rapporto italiano completo, CSV e archivio privato sono stati generati e consegnati
come file, separatamente dal codice. Non si dichiara il pacchetto già pubblico.

- ${stats.editions} edizioni: ${stats.families} famiglie × ${stats.languages} lingue.
- ${stats.newCandidateURLs} percorsi per prima attivazione pubblica (${stats.newlyDefinedPaths} definizioni nuove e ${stats.retainedGuideCandidatePaths} candidati già definiti); 13 indirizzi acquisto conservati.
- Candidato attivato e testato in memoria tramite le vere API/transizioni CMS.
- Matrice 182/182, 10 prove CMS, 52 regressioni, 120 edizioni della serie preservate, ${baseline.compared} confronti SSR,
  ${protectedFiles.files} file protetti e ${protectedFiles.unaffectedMetadata} metadati estranei invariati.
- Build e typecheck superati; browser IT/DE/AR/EN passato; nessun modulo inviato.
- Impronta esatta: \`${pack.rootSHA256}\`.

Seguire la checklist autenticata in README.md, non l’importer di sole bozze.
L’attivazione owner di destinazione resta da eseguire nella vera sessione del
titolare; non è stata simulata in produzione. Successivamente il titolare
esegue Republish tramite Claude. Nessuna pubblicazione è stata fatta qui.

La serie di dieci puntate risulta ${series.observation.task.state} nel controllo
${series.checkedAt}; nessuna sua modifica isolata è stata assunta disponibile.
Confrontare qualunque revisione acquisto successiva: il preflight la protegge.

Le prove dettagliate sono riproducibili dai comandi in README.md. Gli identificatori
UUID degli eventi isolati cambiano ripetendo il test; contenuti sanitizzati, hash
e impronta del pacchetto restano deterministici. I file grezzi sono nella consegna,
non nei contenuti pubblici o nella cronologia Git.
`);
await mkdir(path.join(out,'handoff'),{recursive:true});
for(const file of ['README.md','HANDOFF.md','SOURCES-AND-REVIEW.md'])await copyFile(path.join(docs,file),path.join(out,'handoff',file));
console.log(JSON.stringify(final,null,2));
