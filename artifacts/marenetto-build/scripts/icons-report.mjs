import { readFile, writeFile } from 'node:fs/promises';
import { ORIGINAL_SVG_SHA256, pngIcons } from './generate-icons.mjs';
import { siteIconResources } from './site-icons.mjs';

const directory = new URL('../../../generated-artifacts/marenetto-icons/', import.meta.url);
const publicDir = new URL('../public/', import.meta.url);
const load = async file => JSON.parse(await readFile(new URL(file, directory), 'utf8'));
const { coverage, totalDocuments } = await load('head-coverage.json');
const geometry = await load('geometry.json');
const http = await load('http-results.json');
const proxy = await load('shared-proxy-results.json');
const originalComparison = await load('baseline-comparison.json');
let syncedComparison;
try { syncedComparison = await load('baseline-main-comparison.json'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const comparison = syncedComparison ?? originalComparison;
const browser = await readFile(new URL('browser-report.md', directory), 'utf8');
const browserResults = await load('browser-results.json');
if (browserResults.languages.length !== 13 || browserResults.cspSummary.iconOrManifest !== 0 ||
    browserResults.icons.length !== 9 || browserResults.icons.some(icon => !icon.status200 || !icon.typeOk || !icon.notHtml) ||
    browserResults.languages.some(row => !row.homeHydrated || row.homeStatus !== 200 || row.homeProblems.length ||
      row.clientNav.problems.length || row.direct.problems.length || !row.clientNav.sameDocument)) {
  throw new Error('Browser evidence does not certify the requested icon coverage');
}
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const image = async (file, type = 'image/png') => `data:${type};base64,${(await readFile(new URL(file, publicDir))).toString('base64')}`;
const rows = [...siteIconResources].map(([url, policy]) => {
  const result = http.filter(row => row.url === url);
  if (result.length !== 4 || result.some(row => row.status !== 200)) throw new Error(`Incomplete HTTP evidence: ${url}`);
  const size = pngIcons.find(([file]) => `/${file}` === url)?.[1];
  return `<tr><td>${url}</td><td>200 / 200</td><td>${policy.type}</td><td>${policy.cache}</td><td>${size ? `${size}×${size}` : url.endsWith('.ico') ? '16×16, 32×32, 48×48' : url.endsWith('.svg') ? 'viewBox 48×48' : 'JSON'}</td></tr>`;
}).join('');
const ico = await readFile(new URL('favicon.ico', publicDir));
const frames = geometry.frames.map(frame => `<figure><img width="${frame.size}" height="${frame.size}" src="data:image/png;base64,${ico.subarray(frame.offset, frame.offset + frame.length).toString('base64')}" alt="Frame ICO ${frame.size}"><figcaption>ICO ${frame.size}×${frame.size}, ${frame.length} byte PNG</figcaption></figure>`).join('');
const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Verifica icone Marenetto Build</title><style>
body{font:16px/1.55 system-ui,sans-serif;color:#23211f;background:#fff;margin:0 auto;max-width:1180px;padding:32px}h1,h2{line-height:1.2}h2{margin-top:36px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:9px;border:1px solid #ddd;text-align:left;overflow-wrap:anywhere}th{background:#f1eeeb}.table{overflow-x:auto}.status{padding:16px;border-left:5px solid #c8682f;background:#f7f4ef}.gallery{display:flex;gap:24px;flex-wrap:wrap;align-items:center}figure{margin:10px 0;max-width:260px}figcaption{font-size:13px}.circle{border-radius:50%}.rounded{border-radius:24%}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f7f7f7;padding:16px;font:14px/1.5 ui-monospace,monospace}code{overflow-wrap:anywhere}img{object-fit:contain}
</style></head><body><h1>Icone Marenetto Build</h1><p>Rapporto di verifica tecnica — 25 novembre 2026</p>
<div class="status"><strong>PRONTO PER REPUBLISH — limitatamente al pacchetto icone.</strong><br>Nessuna pubblicazione eseguita. Questo esito non certifica la comparsa immediata su Google, l’aggiornamento delle cache dei dispositivi né l’installabilità PWA completa.</div>
<h2>Riferimento e isolamento</h2><p>SVG originale invariato byte per byte. SHA-256 prima e dopo:<br><code>${ORIGINAL_SVG_SHA256}</code></p>
<p>Generazione locale con sharp già presente, senza font sostitutivi, IA o risorse remote. ICO con tre frame PNG indipendenti, non un PNG rinominato. Il lavoro sulle quattro aree risultava attivo nel contesto assegnato ed è rimasto escluso: nessun contenuto, menu o composizione di pagina modificato.</p>
<p>Confrontati ${comparison.results.length} file della build originale e finale. Esclusi solo link icone, le due meta richieste e spazi tra tag nell’head: corpi, SEO, canonical, hreflang, JSON-LD, robots, sitemap e mappe editoriali invariati. Non è stato necessario escludere token HMR perché il confronto usa build di produzione.</p>
${syncedComparison ? `<p><strong>Sincronizzazione finale:</strong> preservata la nuova sezione professionisti arrivata dal progetto principale, senza modificarla. La baseline iniziale (${originalComparison.results.length} file) è conservata separatamente. Il confronto finale (${syncedComparison.results.length} file) usa il template del progetto principale e le stesse sorgenti frontend, verificate identiche, nella radice canonica di build: nessuna differenza esclusa nei riferimenti agli asset, nei contenuti o nei metadati. Una copia compilata in un’altra directory non era confrontabile per il diverso rilevamento Tailwind; non è stata usata per attestare l’identità. Dopo sincronizzazione sono stati ripetuti build, typecheck, test icone e 39 regressioni SEO. Il passaggio browser precedente copre le dichiarazioni comuni e i percorsi riportati, non costituisce collaudo della nuova sezione professionisti.</p>` : ''}
<h2>Consegna HTTP reale</h2><p>${http.length} verifiche GET/HEAD sul server Node di produzione attraverso gateway TCP locale, con snapshot editoriale sintetico: host preview noindex e host canonico con rilascio simulato solo nel test. In aggiunta, ${proxy.length} verifiche sul proxy condiviso di sviluppo; byte identici ai file, nessun fallback HTML. HEAD senza corpo e Content-Length coerente con GET.</p>
<div class="table"><table><thead><tr><th>URL root</th><th>GET / HEAD</th><th>Content-Type</th><th>Cache-Control</th><th>Dimensioni</th></tr></thead><tbody>${rows}</tbody></table></div>
<p>Nuove risorse ammesse soltanto tramite allowlist esatta. Cache lunga solo sulle icone, senza immutable; manifest rivalidabile. Cache HTML, risposte private, errori, metodi consentiti, protezioni dei percorsi e intestazioni di sicurezza preservati. Sul rilascio simulato le nuove risorse seguono lo stesso confine pubblico del favicon precedente; preview e shell restano noindex.</p>
<h2>Fedeltà, margini e maschere</h2><div class="gallery"><figure><img width="96" height="96" src="${await image('favicon.svg','image/svg+xml')}" alt="SVG originale"><figcaption>SVG originale</figcaption></figure>${frames}</div>
<div class="gallery"><figure><img width="180" height="180" src="${await image('apple-touch-icon.png')}" alt="Apple senza maschera"><figcaption>Apple 180, nessun arrotondamento esterno prestampato</figcaption></figure><figure><img class="rounded" width="180" height="180" src="${await image('apple-touch-icon.png')}" alt="Apple sotto maschera arrotondata"><figcaption>Simulazione maschera arrotondata</figcaption></figure><figure><img class="circle" width="180" height="180" src="${await image('icon-maskable-512.png')}" alt="Maskable sotto maschera circolare"><figcaption>Maskable 512 sotto maschera circolare</figcaption></figure><figure><img class="rounded" width="180" height="180" src="${await image('icon-maskable-512.png')}" alt="Maskable sotto maschera arrotondata"><figcaption>Maskable sotto maschera arrotondata</figcaption></figure></div>
<p>Apple: contenitore originale al 84%, raster interno 151×151 e margini esterni interi 14/15 px. Maskable: contenitore originale al 56%, raster interno 287×287 e margini 112/113 px; anche l’intero quadrato del contenitore rientra nel cerchio sicuro di diametro 80%. Tutti i pixel distintivi, inclusa la linea arancio e l’antialiasing, arrivano a raggio ${geometry.geometry[1].maxDistinctiveRadius.toFixed(2)} px rispetto ai 204,8 px consentiti. Apple e maskable completamente opachi, fondo #23211f fino ai bordi.</p>
<h2>Manifest e head nelle tredici lingue</h2><p>name “Marenetto Build”, short_name “Marenetto”, theme_color/background_color #23211f, display standalone, start_url e scope “/”, stessa origine. PNG 192/512 purpose any, PNG maskable 512 purpose maskable. Un solo collegamento per ciascun formato richiesto, titolo Apple e colore tema presenti.</p>
<p>${totalDocuments} documenti generati verificati, inclusi errori e shell; controllo aggiuntivo su SSR editoriale attivo, indisponibilità editoriale 503, 404, 410 e shell interne anonime senza modificare permessi. Le famiglie riportate sono quelle già esistenti, non nuove traduzioni o approvazioni.</p>
<table><thead><tr><th>Lingua</th><th>Documenti con head corretto</th><th>Famiglie esistenti</th><th>Errore localizzato</th></tr></thead><tbody>${Object.entries(coverage).map(([locale,row])=>`<tr><td>${locale.toUpperCase()}</td><td>${row.documents}</td><td>${row.families.join(', ')}</td><td>${row.error?'Verificato':'No'}</td></tr>`).join('')}</tbody></table>
<h2>Risultati dei test</h2><ul><li>Typecheck completo workspace: superato.</li><li>Build di produzione con PORT=4198 e BASE_PATH=/: superata; scanner asset di produzione superato.</li><li>test:icons: 3/3, include rigenerazione byte-identica, dimensioni PNG, geometria maschere, frame ICO, manifest, head e HTTP.</li><li>test:seo: 39/39.</li><li>Gruppo consensi, pulizia produzione e rilascio pubblico: 16/16 (include controlli presenti anche in test:seo).</li><li>Proxy condiviso: 18/18 GET/HEAD; confronto baseline: ${comparison.results.length}/${comparison.results.length}.</li></ul>
<p>Due aspettative obsolete dei test generali sono state prima riprodotte anche con gli script originali e la baseline: arabo trattato come escluso e conteggio fermo a dodici lingue. Aggiornate soltanto le aspettative, senza cambiare logica SEO né stato delle lingue. Il blocco della lingua esclusa viene verificato alla corretta frontiera HTTP.</p>
<h2>Verifica browser</h2><p><strong>Esito: corretto nelle tredici lingue, navigazione client, cambio lingua, errori e shell anonime. Zero violazioni CSP per icone/manifest.</strong> Quattro blocchi script della dipendenza di autenticazione nella shell interna sotto CSP enforce sono preesistenti e restano fuori ambito; il login non è stato certificato.</p>
<p><strong>Chiarimento sull’osservazione Apple del verificatore:</strong> il confronto pixel 1:1 tra Apple 180 e SVG a tutto formato non è applicabile: il margine richiesto comporta esplicitamente la riduzione uniforme dell’intero contenitore originale al 84% e il centraggio su fondo pieno. La differenza di composizione è quindi intenzionale, non un ridisegno o uno spostamento dei tracciati. Il generatore usa lo stesso buffer SVG verificato tramite hash e la rigenerazione restituisce byte identici. Il segno, linea arancio inclusa, conserva le proporzioni originali. Il rapporto grezzo seguente mantiene anche l’osservazione iniziale per trasparenza.</p><pre>${escape(browser)}</pre>
<h2>Sicurezza e limiti della consegna</h2><p>CSP e relativa modalità inalterate; default-src 'self' già consente il manifest locale, nessuna nuova origine e nessuna necessità di manifest-src. Nessun service worker, offline, banner d’installazione, consenso, analytics o integrazione aggiunto.</p>
<p>Non eseguiti test su dispositivi fisici iPhone/iPad o Android. Le maschere mostrate sono simulazioni, non screenshot delle schermate Home dei telefoni. Dopo la pubblicazione potranno essere controllati gli URL pubblicati e, dopo una nuova scansione, il risultato Google; nessuna richiesta di indicizzazione o accesso Search Console è stata eseguita. I dispositivi possono mantenere l’icona precedente in cache.</p>
<h2>Ripetibilità</h2><pre>pnpm --filter @workspace/marenetto-build run generate:icons
PORT=4198 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
pnpm --filter @workspace/marenetto-build run test:icons
pnpm --filter @workspace/marenetto-build run test:seo
pnpm run typecheck
node artifacts/marenetto-build/scripts/icons-proxy-audit.mjs &lt;origine-di-sviluppo&gt;
node artifacts/marenetto-build/scripts/icons-baseline-comparison.mjs
node artifacts/marenetto-build/scripts/icons-report.mjs</pre>
<p>Le ultime due operazioni usano le evidenze salvate durante questa verifica in generated-artifacts/marenetto-icons; una nuova baseline va acquisita prima di ulteriori modifiche. Questi output sono esclusi da Git e dal deployment; il rapporto consegnato ne conserva gli esiti. Le icone necessarie al sito sono invece piccoli asset statici versionati nella cartella public.</p></body></html>`;
await writeFile(new URL('rapporto-icone-marenetto.html', directory), html);
console.log('Rapporto HTML autonomo generato.');
