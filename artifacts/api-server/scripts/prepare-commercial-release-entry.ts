import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
import { fingerprint, validateContent } from '../src/lib/editorial-content';

// Development-only compiler: no db/auth imports, no production side effects.
if (process.env.NODE_ENV === 'production') throw new Error('Preparazione privata disabilitata in produzione.');
const root = process.cwd();
const out = path.join(root,'generated-artifacts/editorial/release-2026-11');
const pack = JSON.parse(await readFile(path.join(out,'package.json'),'utf8'));
const catalog = JSON.parse(await readFile(path.join(root,'generated-artifacts/editorial/catalog.json'),'utf8'));
const prior = JSON.parse(await readFile(path.join(out,'previous-guides.json'),'utf8'));
if(createHash('sha256').update(JSON.stringify(catalog.seriesDrafts)).digest('hex')!==catalog.seriesRelease?.contentDigest)
  throw new Error('La serie integrata non corrisponde alla sua autorizzazione: nessuna sostituzione.');
for (const record of pack.records) {
  const retained=catalog.seriesDrafts.find((r:any)=>record.authorizedSupplement&&r.identity===record.identity&&r.locale===record.locale);
  if(retained) {
    if(retained.path.replace(/\/+$/,'')!==record.path.replace(/\/+$/,''))throw new Error('Percorso acquisto più recente da confrontare, senza rinominarlo.');
    // Retain the newer series manuscript, guide/video and private review dossier
    // byte-for-byte. Only this release's separate presentation is compiled.
    const seoTitle=record.content.seoTitle,seoDescription=record.content.seoDescription;
    record.presentation={
      seoTitle,seoDescription,
      body:retained.content.body.replace(/\s*·\s*<a\b[^>]*href="mailto:[^"]*"[^>]*>[\s\S]*?<\/a>/g,'')+record.authorizedSupplement,
      faq:retained.content.guide.faq,
    };
    record.readOnlySeries=true;
    record.content=retained.content;
    record.faq=retained.content.guide.faq.map((f:any)=>[f.question,f.answer]);
    record.preparedAt=catalog.seriesRelease.decisionDate;
    record.sourceManuscriptSHA256=fingerprint(retained.content);
    record.review.method='retain-existing-series-and-AI-review-additive-presentation';
    record.review.retainedSourceRelease=catalog.seriesRelease;
    record.presentationSHA256=fingerprint({presentation:record.presentation,readOnlySeries:true});
  }
  delete record.authorizedSupplement;
  record.content = validateContent(record.content, ['it','en','de','fr','nl','es','pt','ru','pl','sv','no','da','ar']);
  record.candidateContentSHA256 = fingerprint(record.content);
  const bases = [
    ...catalog.records.filter((r: any) => r.identity === record.identity && r.locale === record.locale),
    ...prior.records.filter((r: any) => r.identity === record.identity && r.locale === record.locale),
  ];
  record.allowedBaseHashes = [...new Set(bases.map((r: any) => fingerprint(validateContent(r.content,[...catalog.locales,'ar']))))];
  const occupied = [...catalog.records,...catalog.seriesDrafts].find((r: any) => [r.path,...(r.aliases??[])].some((p:string)=>p.replace(/\/+$/,'') === record.path.replace(/\/+$/,'')) && (r.identity !== record.identity || r.locale !== record.locale));
  if (occupied) throw new Error(`Collisione catalogo: ${record.path}`);
  if(record.mode==='create' && catalog.reservedPaths?.some((p:string)=>p.replace(/\/+$/,'')===record.path.replace(/\/+$/,'')) &&
    !catalog.records.some((r:any)=>r.identity===record.identity&&r.locale===record.locale))
    throw new Error(`Percorso pubblico riservato: ${record.path}`);
  if(record.mode === 'revise-existing' && !bases.some((r:any)=>r.path.replace(/\/+$/,'') === record.path.replace(/\/+$/,''))) throw new Error(`Famiglia storica non trovata: ${record.locale}/${record.identity}`);
}
for (const record of pack.records) record.sourceContentSHA256 = pack.records.find((r:any)=>r.locale === 'it' && r.identity === record.identity).candidateContentSHA256;
if(pack.records.filter((r:any)=>r.readOnlySeries).length!==12)throw new Error('Attese dodici edizioni acquisto della serie, da conservare senza mutazioni.');
pack.rootSHA256 = fingerprint(pack.records.map((r:any)=>[r.identity,r.locale,r.path,r.canonicalPath,r.candidateContentSHA256,r.sourceContentSHA256,r.presentationSHA256??null]));
await writeFile(path.join(out,'package.json'),JSON.stringify(pack,null,2));
const ownerModule=await readFile(path.join(root,'docs/editorial/release-2026-11/owner-apply.mjs'),'utf8');
const ownerConsole=`/* Private owner console; never served by the public app. */
(async()=>{
${ownerModule.replaceAll('export async function','async function')}
if(!location.pathname.startsWith('/internal'))throw new Error('Aprire prima il CMS interno nella sessione del titolare.');
const file=await new Promise((resolve,reject)=>{
  const input=document.createElement('input');input.type='file';input.accept='application/json';
  input.onchange=()=>input.files[0]?resolve(input.files[0]):reject(new Error('Nessun file'));
  input.oncancel=()=>reject(new Error('Selezione annullata'));input.click();
});
const pack=JSON.parse(await file.text());
if(pack.rootSHA256!==${JSON.stringify(pack.rootSHA256)})throw new Error('Non è il pacchetto esatto collaudato.');
const preview=await applyRelease({pack,transport:ownerBrowserTransport});
console.table(preview.report);
if(!confirm('Sono state confrontate 182 edizioni. Procedere con salvataggio, revisione approvata e attivazione tramite la sessione del titolare? Questa azione modifica il CMS di destinazione; non esegue Republish. Non certifica un parere tecnico né una revisione madrelingua.'))return;
const result=await applyRelease({pack,transport:ownerBrowserTransport,apply:true,onProgress:(r,n)=>console.info(n+'/182',r.locale,r.path)});
const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));link.download='owner-activation-receipt.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
console.info('182 edizioni attive nel CMS. Conservare la ricevuta. Republish resta un’azione separata del titolare tramite Claude.');
})().catch(error=>{console.error('Pacchetto fermato, nessun aggiramento dei controlli:',error);});
`;
await writeFile(path.join(out,'owner-activate-console.js'),ownerConsole);
const index = {
  id:pack.id, rootSHA256:pack.rootSHA256,
  records:pack.records.map((r:any)=>({identity:r.identity,locale:r.locale,path:r.canonicalPath,cmsPath:r.path,area:r.area,hash:r.candidateContentSHA256,sourceHash:r.sourceContentSHA256,preparedAt:r.preparedAt,...(r.readOnlySeries?{readOnlySeries:true,presentation:r.presentation,presentationHash:r.presentationSHA256}:{})})),
};
await writeFile(path.join(root,'artifacts/marenetto-build/src/content/commercial-release-index.json'),JSON.stringify(index,null,2)+'\n');
// Preserve protected source hashes before any renderer changes. Git provides
// the immutable baseline even when generated files have not been retained.
const base = 'f68745fbddc8e31fb8fbbb9e3bb038797236ac85';
const protectedPaths = ['docs/editorial/phase5','artifacts/marenetto-build/src/content/atelier','artifacts/marenetto-build/src/content/arabic-editorial','artifacts/marenetto-build/src/content/legal','artifacts/marenetto-build/src/content/home-copy.ts','artifacts/marenetto-build/src/components/AnalyticsPreferences.tsx'];
const baseline = protectedPaths.flatMap(p => execFileSync('git',['ls-tree','-r',base,'--',p],{encoding:'utf8'}).trim().split('\n').filter(Boolean));
await mkdir(out,{recursive:true});
await writeFile(path.join(out,'protected-baseline.json'),JSON.stringify({commit:base,entries:baseline},null,2));
process.stdout.write(JSON.stringify({editions:pack.records.length,rootSHA256:pack.rootSHA256})+'\n');
