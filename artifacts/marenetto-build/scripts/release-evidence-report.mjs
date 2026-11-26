import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='generated-artifacts/',out=root+'release-152-delivery/';
await mkdir(out,{recursive:true});
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const before=await json(root+'indexing-recovery/live/baseline.json');
const after=await json(root+'global-seo/after/inventory.json');
const auth=await json('docs/editorial/release-2026-11/deployment-authorization.json');
const privateAuth=await json('docs/editorial/release-2026-11/private-import-authorization.json');
const reconciliation=await json(root+'release-152-tests/development-preservation-after.json');
const actual=await json(root+'release-152-tests/development-active-after.json');
const isolated=await json(root+'indexing-recovery/candidate-active.json');
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,stable(x)])):v;
const snapshotKey=r=>JSON.stringify(stable({identity:r.identity,locale:r.locale,path:r.path,hash:r.revisionHash,source:r.sourceHash,content:r.content}));
const unchanged=actual.filter(r=>isolated.some(p=>snapshotKey(p)===snapshotKey(r))).length;
const preserved=reconciliation.preservedPrivateImports.filter(r=>r.found&&r.activeHash===r.targetHash);
const sqlLog=await readFile(root+'release-152-tests/private-reconciliation.log','utf8');
if(actual.length!==290||unchanged!==290||preserved.length!==10||reconciliation.conflicts.length||
 !/ℹ fail 0/.test(sqlLog))throw new Error('Riconciliazione o collaudo ancora incompleti: nessun rapporto PRONTO');
const sitemap=await json(root+'indexing-recovery/live/sitemap.json');
const norm=p=>p.replace(/\/+$/,'')||'/';
const csv=rows=>{
 const keys=Object.keys(rows[0]??{});
 const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 return '\uFEFF'+[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
};
await writeFile(out+'riconciliazione-dieci-import.csv',csv(privateAuth.records.map(r=>({
 identita:r.identity,lingua:r.locale,percorso_prima:r.path,percorso_dopo:r.targetPath,hash_prima:r.hash,
 digest_semantico_prima:r.contentSHA256,hash_dopo:r.targetHash,
 revisione_precedente_conservata:preserved.some(p=>p.identity===r.identity&&p.locale===r.locale),
 stato:'attiva in sviluppo; produzione non modificata',autorizzazione:privateAuth.id,
 decisione:privateAuth.decision,data:privateAuth.decisionDate
}))));
await writeFile(out+'continuita-candidato.json',JSON.stringify({at:new Date().toISOString(),environment:'development and isolated candidate only',
 baseRevision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 deploymentAuthorizationSHA256:createHash('sha256').update(await readFile('docs/editorial/release-2026-11/deployment-authorization.json')).digest('hex'),
 activationRuntimeSHA256:createHash('sha256').update(await readFile('artifacts/api-server/src/lib/deployment-release.ts')).digest('hex'),
 active:actual.length,identicalPublicEditions:unchanged,preservedPrivateImports:preserved.length,conflicts:0,
 privateAuthorizationDigest:auth.privateImportsDigest,
 note:'Identical identity, locale, path, revision/source hashes and full public content. Existing HTTP/client SEO audits remain applicable; only private history and an obsolete private Arabic alias were reconciled.'},null,2));
const livePaths=new Set(sitemap.locations.map(u=>norm(new URL(u).pathname)));
const baselines=new Map(before.rows.filter(r=>livePaths.has(norm(r.path))).map(r=>[norm(r.path),r]));
const htmlText=s=>s.replace(/<[^>]+>/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n))
 .replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replace(/\s+/g,' ').trim();
const rows=[];
for(const r of after.rows) {
 const migration=auth.evidence.find(e=>norm(e.path)===norm(r.path)&&norm(e.oldPath)!==norm(e.path));
 const b=baselines.get(norm(migration?.oldPath??r.path));
 const raw=b?JSON.parse(gunzipSync(await readFile(root+'indexing-recovery/live/'+b.raw))):null;
 const description=raw?.body.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/)?.[1]??'';
 rows.push({operazione:migration?'rinominato':b?'conservato':'nuovo',
  prima:b?.path??'',dopo:r.path,HTTP_prima:b?.status??'',HTTP_vecchio_dopo:migration?301:b?200:'',
  HTTP_dopo:r.status,canonical_prima:b?.canonical??'',canonical_dopo:r.canonical,
  robots_prima:b?.robots??'',header_robots_prima:b?.headerRobots??'',robots_dopo:r.metaRobots,
  header_robots_dopo:r.headerRobots,title_prima:b?.title??'',title_dopo:r.title,
  description_prima:htmlText(description),description_dopo:r.description,
  HTML_SHA256_prima:raw?createHash('sha256').update(raw.body).digest('hex'):'',
  HTML_SHA256_dopo:r.htmlSHA256,ambiente_prima:'sito vivo in sola lettura',ambiente_dopo:'candidato isolato, non produzione'});
}
const counts=Object.fromEntries(['nuovo','rinominato','conservato'].map(k=>[k,rows.filter(r=>r.operazione===k).length]));
if(counts.nuovo!==169||counts.rinominato!==96||counts.conservato!==834)throw new Error('Diff URL inatteso: '+JSON.stringify(counts));
await writeFile(out+'url-prima-dopo.csv',csv(rows));
await writeFile(out+'raffinamenti-autorizzati.csv',csv(auth.evidence));
const exceptions=await json(root+'indexing-recovery/seo-length-exceptions.json');
await writeFile(out+'eccezioni-seo.csv',csv(exceptions.map(r=>({...r,impatto:'Nessun blocco di indicizzabilità; intervallo preferenziale, non limite rigido.'}))));
const attachments=[
 ['url-prima-dopo.csv',out+'url-prima-dopo.csv'],
 ['matrice-182.csv',root+'indexing-recovery/commercial-matrix.csv'],
 ['serie-120-prima-dopo.csv',root+'indexing-recovery/series-before-after.csv'],
 ['redirect-192.csv',root+'indexing-recovery/redirects.csv'],
 ['raffinamenti-autorizzati.csv',out+'raffinamenti-autorizzati.csv'],
 ['eccezioni-seo.csv',out+'eccezioni-seo.csv'],
 ['conflitti-sviluppo.csv',root+'release-152-tests/conflitti-sviluppo.csv'],
 ['riconciliazione-dieci-import.csv',out+'riconciliazione-dieci-import.csv'],
];
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const markdown=await readFile('docs/editorial/release-2026-11/FINAL-REPORT.md','utf8');
// A self-contained readable export: no remote font, script, iframe or tracking.
const content=escape(markdown).replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>')
 .replace(/^# (.+)$/gm,'<h1>$1</h1>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
const downloads=(await Promise.all(attachments.map(async([name,path])=>`<a download="${name}" href="data:text/csv;charset=utf-8;base64,${(await readFile(path)).toString('base64')}">${name}</a>`))).join('');
const notice=markdown.includes('## Stato: PRONTO PER REPUBLISH')?'PRONTO PER REPUBLISH. Dieci import riconciliati con autorizzazione esplicita e cronologia conservata. Nessuna pubblicazione eseguita.':'Candidato in verifica: consultare lo stato del rapporto prima di pubblicare.';
await writeFile(out+'rapporto-candidato.html',`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rapporto candidato Marenetto Build — 26 novembre 2026</title><style>body{margin:0;background:#f3f4f2;color:#182421;font:16px/1.65 system-ui,sans-serif}main{max-width:1000px;margin:32px auto;background:white;padding:40px;box-shadow:0 2px 16px #0001}article{white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:28px}h2{font-size:21px;margin:24px 0 0;color:#204b3c}h3{font-size:18px}code{font:13px monospace;background:#f3f4f2}nav{display:flex;flex-wrap:wrap;gap:8px}nav a{padding:8px 12px;background:#204b3c;color:white;border-radius:4px;text-decoration:none}.notice{padding:16px;background:#e9f4ed;border-left:4px solid #204b3c}@media(max-width:600px){main{margin:0;padding:20px}}</style><main><p class="notice"><strong>${notice}</strong></p><h2>CSV scaricabili</h2><nav>${downloads}</nav><article>${content}</article></main></html>`);
console.log(JSON.stringify({at:new Date().toISOString(),rows:rows.length,...counts,report:out+'rapporto-candidato.html'}));
