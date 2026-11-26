import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, stat, readdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const directory='generated-artifacts/indexing-recovery';
const output='generated-artifacts/indexing-recovery-delivery';
await mkdir(directory+'/checks',{recursive:true});
await mkdir(output,{recursive:true});
const json=async file=>JSON.parse(await readFile(file,'utf8'));
const audit=await json(directory+'/candidate/audit.json');
const browser=await json(directory+'/browser-result.json');
assert.equal(audit.failures.length,0);assert.equal(audit.passed,audit.candidateSitemap);
assert.equal(audit.series,120);assert.equal(audit.historical,24);assert.equal(audit.diff.removed.length,0);
assert.equal(browser.verdict,'success','Do not declare ready without the requested browser checks');
const checks=[
  ['Workspace typecheck','/tmp/recovery-typecheck-final.log','scripts typecheck: Done'],
  ['Build API in produzione','/tmp/recovery-api-build-final.log','Done in'],
  ['Build web in produzione','/tmp/recovery-build-final.log','Production guard passed'],
  ['PostgreSQL isolato, transazioni e concorrenza','/tmp/recovery-database-final.log','ℹ fail 0'],
  ['Regressioni editoriali API','/tmp/recovery-editorial-final.log','ℹ fail 0'],
  ['Raccordo consegna multilingue','/tmp/recovery-commercial-final.log','ℹ fail 0'],
  ['Regressioni SEO e indisponibilità','/tmp/recovery-seo-final.log','ℹ fail 0'],
  ['Serie in dodici lingue','/tmp/recovery-series-final.log','ℹ fail 0'],
  ['Continuità e autorizzazione indicizzazione','/tmp/recovery-continuity-final.log','ℹ fail 0'],
  ['Metadati client e lingua del documento','/tmp/recovery-client-final.log','ℹ fail 0'],
  ['Regressioni i18n','/tmp/recovery-i18n.log','ℹ fail 0'],
  ['Inventario HTTP completo','/tmp/recovery-inventory-final.log','"failures": []'],
];
const results=[];
for(let n=0;n<checks.length;n++) {
  const [name,file,marker]=checks[n],text=await readFile(file,'utf8');
  assert.ok(text.includes(marker),name);
  const destination=`checks/${String(n+1).padStart(2,'0')}.log`;
  await writeFile(directory+'/'+destination,text);
  results.push({name,result:'superato',evidence:destination});
}
const sha=value=>createHash('sha256').update(value).digest('hex');
const files=execFileSync('git',['ls-files','-co','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean).sort();
const tree=[];
for(const file of files)if((await stat(file)).isFile())tree.push({path:file,sha256:sha(await readFile(file))});
const treeDigest=sha(JSON.stringify(tree));
await writeFile(directory+'/source-tree.json',JSON.stringify({baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),treeDigest,files:tree},null,2));
const summary={state:'PRONTO PER REPUBLISH',productionMutated:false,productionRepublished:false,
  deliveredAt:new Date().toISOString(),treeDigest,seriesDigest:audit.seriesDigest,
  liveSitemap:audit.liveSitemap,candidateSitemap:audit.candidateSitemap,historical:24,series:120,realNewSeries:96,
  removedBaseline:0,checks:results,browser:{verdict:browser.verdict,text:browser.text}};
await writeFile(directory+'/delivery.json',JSON.stringify(summary,null,2));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const inline=s=>escape(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
const markdown=await readFile('docs/production-readiness/INDEXING_RECOVERY_2026-11-26.md','utf8');
let code=false;
const narrative=markdown.split('\n').map(line=>{
  if(line.startsWith('```')){code=!code;return code?'<pre>':'</pre>';}
  if(code)return escape(line)+'\n';
  const heading=line.match(/^(#{1,3}) (.*)$/);
  if(heading)return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
  if(line.startsWith('- '))return '<p class="bullet">• '+inline(line.slice(2))+'</p>';
  return line?'<div>'+inline(line)+'</div>':'<br>';
}).join('\n');
const downloads=[];
for(const [path,label] of [
  ['historical-before-after.csv','CSV prima/dopo — 24 indirizzi'],
  ['series-before-after.csv','CSV prima/dopo — 120 edizioni'],
  ['candidate/inventory.csv','Inventario completo — 930 URL'],
  ['seo-length-exceptions.json','Eccezioni SEO per indirizzo'],
  ['delivery.json','Riepilogo delle verifiche'],
]) {
  const bytes=await readFile(directory+'/'+path);
  const mime=path.endsWith('.csv')?'text/csv':'application/json';
  downloads.push(`<a class="download" download="${path.split('/').at(-1)}" href="data:${mime};base64,${bytes.toString('base64')}">${escape(label)}</a>`);
}
const rows=audit.results.filter(r=>r.episode).sort((a,b)=>a.episode-b.episode||a.locale.localeCompare(b.locale));
const html=`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rapporto di ripristino SEO — Marenetto Build</title>
<style>body{margin:0;background:#f6f5f1;color:#18313b;font:16px/1.65 system-ui,sans-serif}main{max-width:1140px;margin:auto;padding:48px 24px}h1{font-size:34px;line-height:1.2}h2{margin-top:44px;border-top:1px solid #d4dbdc;padding-top:20px}h3{margin-top:28px}.status{display:inline-block;background:#204d3e;color:white;padding:8px 14px;border-radius:4px;letter-spacing:.04em}.warning{background:#fff2d5;border-left:4px solid #b38024;padding:16px}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:28px 0}.metric{background:white;padding:18px;border:1px solid #d4dbdc}.metric strong{display:block;font-size:30px}.download{display:inline-block;margin:6px 8px 6px 0;padding:9px 14px;border:1px solid #567b86;color:#18313b;border-radius:4px;text-decoration:none;background:white}code,pre{font:13px/1.6 ui-monospace,monospace}pre{padding:18px;background:#e9edeb;overflow:auto}code{overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:10px;text-align:left;border-bottom:1px solid #d4dbdc;vertical-align:top}th{background:#e9edeb}.scroll{max-height:520px;overflow:auto;background:white}td.path{overflow-wrap:anywhere;min-width:270px}.small{font-size:13px;color:#52646c}details{margin-top:28px}.bullet{margin:8px 0}</style>
<main><p class="small">Marenetto Build · 26 novembre 2026 · rapporto del candidato, non del rilascio già pubblicato</p>
<span class="status">PRONTO PER REPUBLISH</span><h1>Indicizzazione storica e serie approvata</h1>
<p class="warning"><strong>Produzione non modificata e nessun Republish eseguito.</strong> Il sito vivo acquisito resta la baseline da 810 URL. I risultati seguenti appartengono al candidato verificato, con database di attivazione isolato.</p>
<div class="metrics"><div class="metric"><strong>930</strong>URL verificati nel candidato</div><div class="metric"><strong>24</strong>indirizzi preesistenti recuperati</div><div class="metric"><strong>120</strong>edizioni complete della serie</div><div class="metric"><strong>96</strong>URL realmente nuovi</div></div>
<h2>Documenti scaricabili</h2>${downloads.join('')}
<p>Le risposte grezze compresse, gli inventari e i log sono conservati anche nell’archivio di evidenze consegnato separatamente. Le prove non attestano un’indicizzazione o un posizionamento Google.</p>
<h2>Esiti delle verifiche</h2><table><tr><th>Controllo</th><th>Esito</th></tr>${results.map(r=>`<tr><td>${escape(r.name)}</td><td>Superato</td></tr>`).join('')}<tr><td>Browser reale: SSR senza JS, idratazione, cambio lingua e navigazione client</td><td>Superato</td></tr></table>
<details><summary>Rapporto del collaudo browser</summary><pre>${escape(browser.text)}</pre></details>
<h2>Matrice delle 120 edizioni</h2><p>Ogni riga ha HTTP 200, meta/header index follow, canonical corretto, corpo e FAQ verificati. Il CSV conserva anche revisione/hash, sorgente italiana, autorizzazione e confronto con il vivo.</p>
<div class="scroll"><table><tr><th>Puntata</th><th>Lingua</th><th>Indirizzo invariato o approvato</th><th>Esito</th></tr>${rows.map(r=>`<tr><td>${r.episode}</td><td>${escape(r.locale.toUpperCase())}</td><td class="path">${escape(r.path)}</td><td>200 · indicizzabile</td></tr>`).join('')}</table></div>
${narrative}<h2>Identificazione riproducibile del candidato</h2><p class="small">Impronta dell’albero sorgente (file elencati in source-tree.json): <code>${treeDigest}</code><br>Digest della serie autorizzata: <code>${escape(audit.seriesDigest)}</code><br>Consegna: ${escape(summary.deliveredAt)}. La revisione Git di base non viene spacciata per la revisione produttiva attuale.</p></main></html>`;
await writeFile(output+'/rapporto-indicizzazione.html',html);
await writeFile(output+'/LEGGIMI.txt',`PRONTO PER REPUBLISH\nProduzione non modificata.\nAlbero sorgente: ${treeDigest}\nLe evidenze sono riferite al candidato e alla baseline datata, non a un Republish eseguito.\n`);
const live=await json(directory+'/live/baseline.json');
const liveFiles=(await readdir(directory+'/live',{withFileTypes:true})).filter(e=>e.isFile()).map(e=>directory+'/live/'+e.name);
const liveRaw=live.rows.map(row=>directory+'/live/raw/'+sha(row.path)+'.json.gz');
await rm(output+'/evidenze-indicizzazione.zip',{force:true});
async function leafFiles(folder) {
  const result=[];
  for(const entry of await readdir(folder,{withFileTypes:true}))
    result.push(...(entry.isDirectory()?await leafFiles(folder+'/'+entry.name):[folder+'/'+entry.name]));
  return result;
}
const evidenceFiles=[
  ...liveFiles,...liveRaw,...await leafFiles(directory+'/checks'),...await leafFiles(directory+'/browser'),
  directory+'/database-results.json',directory+'/source-tree.json',directory+'/delivery.json',
  directory+'/browser-result.json',directory+'/historical-before-after.csv',directory+'/series-before-after.csv',
  directory+'/seo-length-exceptions.json','docs/production-readiness/INDEXING_RECOVERY_2026-11-26.md',
  ...await leafFiles(directory+'/candidate'),
];
// Library uploads accept at most 100 MiB. Leave room for ZIP headers; each part
// is an independent archive, extracted together without binary reassembly.
const parts=[];let part=[],size=0;
for(const file of evidenceFiles) {
  const bytes=(await stat(file)).size;
  if(size+bytes>90*1024*1024&&part.length){parts.push(part);part=[];size=0;}
  part.push(file);size+=bytes;
}
if(part.length)parts.push(part);
const archives=[];
for(let n=0;n<parts.length;n++) {
  const archive=output+`/evidenze-indicizzazione-${String(n+1).padStart(2,'0')}.zip`;
  await rm(archive,{force:true});execFileSync('zip',['-q','-0',archive,...parts[n]]);
  assert.ok((await stat(archive)).size<100*1024*1024);
  archives.push(archive);
}
console.log(JSON.stringify({report:output+'/rapporto-indicizzazione.html',archives,treeDigest,checks:results.length,browser:browser.verdict},null,2));
