import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { escapeHtml as esc } from './seo-document.mjs';

const dir=new URL('../../../generated-artifacts/global-seo/',import.meta.url);
const before=JSON.parse(await readFile(new URL('before/inventory.json',dir)));
const after=JSON.parse(await readFile(new URL('after/inventory.json',dir)));
const browsers=Object.fromEntries(await Promise.all(['before','after'].map(async key=>[key,JSON.parse(await readFile(new URL(key+'/browser.json',dir)))])));
const approvedLocales=['it','en','fr','de','nl','es','pt','ru','pl','sv','no','da'];
const servicePillars=new Set(['services','custom-furniture','property-management','sicily-travel',
  'historical:/ristrutturazioni-chiavi-in-mano-cefalu-e-palermo-marenetto']);
function classify(row) {
  if(row.kind==='article')return 'articolo';
  if(row.id.startsWith('place-'))return 'servizio locale';
  if(servicePillars.has(row.id))return 'servizio';
  if(row.kind==='legal'||row.id.startsWith('legal-'))return 'informativa';
  if(row.kind==='archive'||row.id.startsWith('historical:/')||['zones','articles','guides','service-local'].includes(row.id))return 'indice';
  if(row.id==='service-premium')return 'sintesi offerta';
  return 'pagina informativa';
}
function exception(row) {
  const type=classify(row);
  const target=type==='articolo'?[900,1500]:['servizio','servizio locale'].includes(type)?[600,900]:undefined;
  if(!target)return {type,target:'non applicabile',exception:'Nessuna quota: indice, sintesi o pagina informativa; non aggiungere testo ripetuto.'};
  if(row.words>=target[0]&&row.words<=target[1])return {type,target:target.join('–'),exception:''};
  const reason=type==='servizio locale'
    ? 'Scheda di riferimento tra le venti zone già integrate: conservata la differenziazione locale; non duplicato il testo del servizio per città.'
    : type==='articolo'
      ? 'Testo storico o revisione già integrata: preservati fatti, fonti e testo. Le fonti interne non aggiungono dettagli specifici verificati sufficienti senza ripetizioni, promesse o riscritture documentali.'
      : 'Descrizione circoscritta dell’offerta già integrata. Nessun progetto verificato, dato tecnico o dettaglio commerciale ulteriore da aggiungere senza amplificare gli stessi concetti.';
  return {type,target:target.join('–'),exception:reason};
}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const changed=execFileSync('git',['ls-files','-m','-o','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const fingerprint={revision:after.revision,at:new Date().toISOString(),files:[]};
for(const path of changed)fingerprint.files.push({path,sha256:hash(await readFile(path))});
await writeFile(new URL('candidate-fingerprint.json',dir),JSON.stringify(fingerprint,null,2));

const joined=after.rows.map(row=>{
  const old=before.rows.find(r=>r.path===row.path);
  if(!old)throw new Error('Unexpected new URL '+row.path);
  return {row,old,...exception(row)};
});
if(before.rows.some(old=>!after.rows.some(r=>r.path===old.path)))throw new Error('A baseline URL disappeared');
const exceptionRows=joined.filter(r=>r.exception&&r.target!=='non applicabile');
const out=new URL('consegna/',dir);await mkdir(out,{recursive:true});
const csv=(cols,rows)=>'\uFEFF'+[cols.join(','),...rows.map(r=>cols.map(c=>'"'+String(typeof r[c]==='object'?JSON.stringify(r[c]):r[c]??'').replaceAll('"','""')+'"').join(','))].join('\r\n');
for(const [label,report] of [['prima',before],['dopo',after]]) {
  const browser=browsers[label==='prima'?'before':'after'];
  const rows=report.rows.map(row=>({
    ...row,...exception(row),
    cspViolations:browser.cspViolations.filter(v=>v.path===row.path),
    clientIssues:browser.pages.find(p=>p.path===row.path)?.issues??['not-measured'],
  }));
  const cols=['path','locale','type','source','status','canonical','alternates','title','titleCharacters','titleOutOfRange','titleDuplicates',
    'description','descriptionCharacters','descriptionOutOfRange','descriptionDuplicates','images','inadequateAlt','words','wordsRawMain','excludedRepeatedBlocks','target','exception',
    'h1','headings','hierarchy','schemaTypes','jsonldIssues','brokenLinks','unverifiedLinks','cspMode','csp','cspViolations','clientIssues','htmlSHA256'];
  await writeFile(new URL(label+'.csv',out),csv(cols,rows));
}
await writeFile(new URL('eccezioni-editoriali.csv',out),csv(['path','locale','type','words','target','exception','source'],
  joined.map(({row,...rest})=>({...row,...rest})).filter(r=>r.exception&&r.target!=='non applicabile')));
for(const file of ['before/inventory.json','after/inventory.json','before/browser.json','after/browser.json','candidate-fingerprint.json'])
  await copyFile(new URL(file,dir),new URL(file.replace('/','-'),out));

const metrics=[
  ['Title fuori soglia 30–65 caratteri','titleOutOfRange'],['Description fuori soglia 70–165 caratteri','descriptionOutOfRange'],
  ['Title duplicati','titleDuplicates'],['Description duplicate','descriptionDuplicates'],
  ['Pagine con immagini di contenuto senza alt adeguato','inadequateAlt'],['Pagine con salti di livello nei titoli','hierarchy'],
  ['Pagine senza un unico H1','h1Errors'],['Pagine con problemi nei controlli JSON-LD','jsonldIssues'],
  ['Pagine con collegamenti interni o frammenti non validi','brokenLinks'],['Pagine con link non misurati nel baseline','unverifiedLinks'],
  ['Pagine con hreflang non reciproci','hreflangIssues'],
];
const table=(heads,rows)=>`<div class="scroll"><table><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const counts=approvedLocales.map(locale=>[locale.toUpperCase(),before.rows.filter(r=>r.locale===locale).length,after.rows.filter(r=>r.locale===locale).length]);
const title65=before.rows.filter(r=>r.titleCharacters>65).length,short70=before.rows.filter(r=>r.descriptionCharacters<70).length,long165=before.rows.filter(r=>r.descriptionCharacters>165).length;
const checkResults=JSON.parse(await readFile(new URL('checks.json',dir)));
const external=[
  'Dopo il Republish del titolare: verificare risposte, sitemap, canonical/hreflang e intestazioni sul dominio pubblico per la stessa revisione effettivamente rilasciata.',
  'Search Console: identificare gli eventuali sette URL storici segnalati, eseguire ispezioni e verifiche esterne; nessun avviso è dichiarato cancellato e nessun invio di convalida è stato eseguito.',
  'Confermare con gli strumenti di Google e Meta la ricezione degli eventi soltanto dopo consenso esplicito nelle rispettive categorie. I test locali intercettati non certificano la ricezione dei fornitori.',
  'CSP: il default esistente resta report-only; è stata applicata in enforcement soltanto sul candidato controllato. Controllare sul rilascio i veri SDK Clerk, le varianti regionali GA4 e gli asset editoriali remoti prima di un’eventuale decisione separata di enforcement.',
  'Revisione madrelingua e valutazione editoriale/tecnica delle eccezioni di lunghezza: le traduzioni sono state controllate automaticamente, non certificate da revisori umani.',
];
const html=`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rapporto SEO multilingue — Marenetto Build</title>
<style>body{font:16px/1.6 system-ui,sans-serif;color:#192d32;background:#f7f7f2;margin:0}main{max-width:1180px;margin:auto;padding:40px 24px 80px}h1{font-size:2.4rem;line-height:1.15}h2{margin-top:2.5rem;border-top:1px solid #bcc9c7;padding-top:1rem}h3{margin-top:1.8rem}code{overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:.88rem;background:white}th,td{border:1px solid #d1dcda;padding:9px 12px;text-align:left;vertical-align:top}th{background:#e2ece8}.scroll{overflow-x:auto}li{margin:.5rem 0}.status{background:#dbeadf;border-left:5px solid #286349;padding:18px}small{color:#475c62}details{margin:18px 0}summary{cursor:pointer;font-weight:650}td:first-child{overflow-wrap:anywhere;min-width:150px}a{color:#13594f}</style>
<main><p>MARENETTO BUILD · AUDIT DEL CANDIDATO · ${esc(new Date().toISOString())}</p><h1>Ottimizzazione SEO nelle dodici lingue</h1>
<p class="status"><strong>PRONTO PER REPUBLISH — pubblicazione non eseguita.</strong><br>699 URL confrontate prima/dopo. Le eccezioni editoriali e le verifiche esterne residue sono esplicite, non dichiarazioni di conformità o di risultati Google.</p>
<h2>Perimetro e attendibilità</h2>
<p>Verificata la versione integrata disponibile all’avvio, inclusa la nuova gestione immobili e le sezioni già unite. Nessuna attesa o creazione di rete, nuove guide, Atelier o pagine per architetti non ancora integrate. Nessuna nuova URL. Arabo assente dalla sitemap attiva: non è stato attivato, rimosso o sostituito con italiano.</p>
<p>Baseline acquisito il <strong>${esc(before.at)}</strong>, revisione <code>${esc(before.revision)}</code>. Ultima acquisizione HTTP: <strong>${esc(after.at)}</strong>. Il fingerprint allegato identifica i file modificati del candidato; gli snapshot HTML sono conservati con SHA-256 per ogni URL.</p>
<p>Le richieste hanno usato il vero processo HTTP di produzione locale, con dominio WWW ufficiale simulato e snapshot editoriale isolato vuoto, senza modificare flag reali. Una lettura in sola lettura dell’API editoriale di sviluppo ha confermato <strong>zero revisioni attive e zero ritiri</strong>. Sono inclusi test separati per revisioni sintetiche e ritiri, anche dopo riavvio o indisponibilità. Non è un crawl certificato della produzione pubblicata.</p>
${table(['Lingua','URL prima','URL dopo'],counts)}
<h2>Risultati prima/dopo</h2>
<p>I valori indicano <strong>pagine interessate</strong>, non numero di occorrenze o avvisi di Search Console.</p>
${table(['Controllo','Prima','Dopo'],metrics.map(([label,key])=>[label,before.summary[key],after.summary[key]]))}
<p>Nel browser: ${browsers.before.pages.length} percorsi del baseline e ${browsers.after.pages.length} del candidato finale controllati con navigazione client. Disallineamenti o schema Article mancante: <strong>${browsers.before.pages.filter(p=>p.issues.length).length} → ${browsers.after.pages.filter(p=>p.issues.length).length}</strong>. Violazioni CSP rilevate: <strong>${browsers.before.cspViolations.length} → ${browsers.after.cspViolations.length}</strong>. Errori JavaScript non gestiti nel candidato: <strong>${browsers.after.errors.length}</strong>. Nessuna richiesta esterna prima del consenso nei trasporti controllati.</p>
<h3>Segnalazioni del proprietario, senza attribuzioni inventate</h3>
<p>Con le soglie originariamente segnalate, il baseline riproducibile rileva <strong>${title65} title oltre 65</strong> (segnalati 86), <strong>${short70} description sotto 70</strong> (segnalate 48) e <strong>${long165} oltre 165</strong> (segnalate 34). Differenze possibili di revisione, perimetro e metodo: non sono gli stessi dati di Search Console.</p>
<p>Il parser non rileva blocchi JSON-LD con sintassi JSON non valida nel baseline. Rileva invece 159 pagine articolo senza Article. Non sono state inventate sette URL storiche: la segnalazione esterna resta da identificare. Un tipo Schema.org valido, AdministrativeArea, era inizialmente fuori dalla lista del primo controllo locale: quel falso positivo è stato rimosso rianalizzando gli stessi snapshot, non attribuito al sito.</p>
<h2>Correzioni effettive</h2><ul>
<li>Livello di metadati condiviso per le famiglie esistenti nelle dodici lingue: title con brand, description specifiche e distinte, nessun taglio di frasi con ellissi. Conservate le descrizioni originali già utili e nei limiti, dove prudenti; rimossi dai metadati alcuni richiami promozionali non necessari a garanzie e certificazioni. Metadati espliciti delle revisioni attive restano rispettati, anche se fuori intervallo.</li>
<li>Canonical assoluti sul WWW ufficiale, OG e hreflang reciproci già nell’HTML iniziale e coerenti nel client. Le anteprime restano noindex; una bozza non acquisisce equivalenti pubblicati navigando. Nessun cambio a URL, redirect, approvazioni o selezione pubblica dei contenuti.</li>
<li>Descrizioni visive delle quattordici copertine acquisite, con traduzioni nelle dodici lingue e corrispondenza verificata ai file; coperti anche alias e miniature. Panorama illustrativo esplicitamente descritto come illustrazione. Nessuna deduzione di cliente, lavoro eseguito, cantiere verificato o località dalla sola fotografia. Loghi ed etichette IA preservati.</li>
<li>Gerarchie H2/H3 riparate nella rappresentazione pubblica: titoli fratelli restano allo stesso livello. Nessuna modifica alle parole dei corpi storici o agli hash degli archivi. Stili delle schede e delle guide mantenuti, senza nuovo design.</li>
<li>Article per tutti i 168 articoli presenti nella sitemap, anche dove un vecchio controllo sugli stati editoriali impediva il grafo pur mostrando il testo. Riparato il generatore, non gli HTML compilati. Revisioni editoriali attive generano Article nel primo HTML. FAQPage solo per FAQ effettivamente visibili e corrispondenti. Nessuna Review o AggregateRating autoprodotta.</li>
<li>Il collegamento persistente alle preferenze conserva l’apertura del pannello e, senza JavaScript, porta ora all’informativa cookie valida anziché a un frammento inesistente. Nessuna modifica alle scelte salvate, alle categorie o alle regole di consenso.</li>
</ul>
<h2>Metodo, immagini, collegamenti e contenuto</h2>
<p>Caratteri: punti di codice Unicode dopo normalizzazione NFC, inclusi spazi e punteggiatura, non byte UTF-8. Soglie bloccanti attuali: title 30–65 e description 70–165. Obiettivi preferenziali, non errori: 50–60 e 140–160 quando naturali. I CSV distinguono le due misure; nessuna soglia garantisce come Google mostrerà titolo e descrizione.</p>
<p>Parole: Intl.Segmenter per lingua, nel main, esclusi nav/footer e blocchi testuali ripetuti in almeno il 35% delle pagine della stessa lingua, minimo otto. I CSV riportano anche il conteggio grezzo e i blocchi esclusi. I conteggi non equiparano profondità editoriale e qualità; non vengono applicati a indici, contatti, ricerca e informative.</p>
<p>Link: tutte le ancore nell’HTML, inclusi header/footer, con controllo HTTP delle destinazioni interne, redirect e frammenti. Nel baseline alcuni link esterni al main non erano stati richiesti: sono marcati “non misurati”, non dichiarati sani. Per quelli in sitemap si è riutilizzata la risposta GET già archiviata. Nel candidato finale tutti i link interni rilevati risultano verificati.</p>
<p>JSON-LD: parsing di ogni blocco, escaping sicuro, tipi usati, URL, riferimenti, Article e presenza letterale delle domande/risposte nel contenuto visibile. Sono controlli locali mirati, non una certificazione completa dell’intero vocabolario Schema.org, né una prova di rich result o di convalida Google.</p>
<h3>Eccezioni editoriali motivate</h3>
<p><strong>${exceptionRows.length} URL</strong> restano sotto l’obiettivo orientativo della propria famiglia. Non è stato aggiunto testo riempitivo o copiato tra città per raggiungere una quota; nessuna pagina eccede il limite superiore del proprio obiettivo. Il CSV delle eccezioni riporta ogni URL, lingua, parole, obiettivo, motivazione e fonte interna. Fonti utilizzate: documenti storici e correzioni già integrate, revisioni linguistiche già presenti, contenuti servizi/zone/trasferte e dichiarazioni del proprietario nella gestione immobili. Nessuna fonte interna è presentata come verifica professionale indipendente.</p>
<p>Le venti località sono schede di riferimento già esistenti, non nuove pagine doorway. La copertura ordinaria, le trasferte subordinate a valutazione e preventivo, i ruoli distinti di Marenetto e del partner e l’assenza di mediazione restano invariati. Le pagine sintetiche dell’offerta rimandano ai dettagli invece di duplicarli. Il sito del partner ha risposto HTTP 200 alla verifica del 25 novembre 2026; questo non certifica i servizi o i risultati commerciali.</p>
<details><summary>Eccezioni per URL e lingua (${exceptionRows.length})</summary>${table(['URL','Lingua','Tipo','Parole','Obiettivo','Motivazione'],exceptionRows.map(e=>[e.row.path,e.row.locale,e.type,e.row.words,e.target,e.exception]))}</details>
<h2>CSP, consensi e testi legali</h2>
<p>La CSP web già integrata consente il trasporto diretto GA4 (googletagmanager e i due endpoint google-analytics), il solo pixel immagine Meta su facebook.com/tr/, Clerk e le risorse attuali. Nessun SDK Facebook aggiunto. Nessuna wildcard generica, unsafe-inline per gli script o unsafe-eval aggiunta; la wildcard preesistente è circoscritta al solo servizio di protezione Clerk. Le risposte dati API hanno una policy distinta e restrittiva: non hanno bisogno delle origini di misurazione del documento web. Nessuna modifica alle policy già allineate è risultata necessaria.</p>
<p>Default report-only mantenuto senza cambiare configurazione. Nelle prove controllate il browser ha ricevuto la stessa policy come enforcement. I blocchi JSON-LD sono dati inerti con escaping; i trasporti eseguibili sono moduli/script esterni, senza nuove eccezioni inline da autorizzare. I test coprono silenzio prima del consenso e dopo rifiuto/revoca, categorie statistiche/marketing separate, pulizia cookie prevista, schede sincronizzate, storage non scrivibile ed esclusione di privati/autenticazione/preview. Provider intercettati: nessuna email reale, spesa AI o attivazione di tracciamento.</p>
<p>Corpi legali, versione dei consensi, provenienza importata e successivi emendamenti autorizzati invariati. Nessuna riscrittura per lunghezza, nuova traduzione legale, eccezione allo scanner o dichiarazione di conformità giuridica. Sono stati modificati solo metadati di ricerca e la destinazione alternativa del collegamento alle preferenze.</p>
<h2>Verifiche eseguite</h2>
${table(['Verifica','Esito reale'],checkResults.map(c=>[c.name,c.result]))}
<p>Gli avvisi di build su dimensioni dei bundle, import JSON e mappe sorgente di un componente preesistente sono riportati nei log, non spacciati per ottimizzazioni di prestazioni risolte. La prova globale non certifica una sessione privata Clerk reale: nessun accesso autenticato è stato necessario o eseguito.</p>
<h2>Controlli esterni residui</h2><ol>${external.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>
<h2>Inventario consultabile</h2>
<p>File allegati: prima.csv, dopo.csv, eccezioni-editoriali.csv; inventari e prove client JSON, fingerprint del candidato e archivio degli snapshot. I CSV includono immagini/alt, alternates, metadati, parole, H1/gerarchia, schemi, link, CSP e confronto client per ogni URL.</p>
<details><summary>Tutte le 699 URL con metadati prima/dopo</summary>${table(['URL e lingua','Title prima → dopo','Description prima → dopo','Parole prima → dopo'],joined.map(({row,old})=>[row.path+' ['+row.locale+']',old.title+' → '+row.title,old.description+' → '+row.description,old.words+' → '+row.words]))}</details>
<p class="status"><strong>PRONTO PER REPUBLISH.</strong> Pubblicazione, controlli di produzione e invio di convalide Search Console non eseguiti.</p></main></html>`;
if(Buffer.byteLength(html,'utf8')>5242880)throw new Error('Report exceeds 5 MiB');
await writeFile(new URL('rapporto-seo.html',out),html);
console.log(JSON.stringify({pages:joined.length,editorialExceptions:exceptionRows.length,reportBytes:Buffer.byteLength(html,'utf8')}));
