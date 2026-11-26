import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
import { fingerprint, validateContent } from '../src/lib/editorial-content';

// Development-only compiler: no db/auth imports, no production side effects.
if (process.env.NODE_ENV === 'production') throw new Error('Preparazione privata disabilitata in produzione.');
const root = process.cwd();
const outputRoot=process.env.EDITORIAL_BUILD_ROOT??path.join(root,'generated-artifacts/editorial');
const out = path.join(outputRoot,'release-2026-11');
const pack = JSON.parse(await readFile(path.join(out,'package.json'),'utf8'));
const catalog = JSON.parse(await readFile(path.join(outputRoot,'catalog.json'),'utf8'));
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
const ownerConsole=`/* Retired: no owner browser session is required for this exact package. */
throw new Error('Procedura sostituita: il prossimo normale deploy verifica e attiva automaticamente il pacchetto esatto del 26/11/2026. Seguire HANDOFF.md; non eseguire attivazioni manuali dalla console.');
`;
await writeFile(path.join(out,'owner-activate-console.js'),ownerConsole);
const index = {
  id:pack.id, rootSHA256:pack.rootSHA256,
  records:pack.records.map((r:any)=>({identity:r.identity,locale:r.locale,path:r.canonicalPath,cmsPath:r.path,area:r.area,hash:r.candidateContentSHA256,sourceHash:r.sourceContentSHA256,preparedAt:r.preparedAt,...(r.readOnlySeries?{readOnlySeries:true,presentation:r.presentation,presentationHash:r.presentationSHA256}:{})})),
};
const indexPath=path.join(root,'artifacts/marenetto-build/src/content/commercial-release-index.json');
const compiled=JSON.stringify(index,null,2)+'\n';
if (await readFile(indexPath,'utf8') !== compiled) {
  if(process.argv.includes('--check'))throw new Error('Indice commerciale non allineato; rigenerazione esplicita richiesta.');
  await writeFile(indexPath,compiled);
}
// Preserve protected source hashes before any renderer changes. Git provides
// the immutable baseline even when generated files have not been retained.
const base = 'f68745fbddc8e31fb8fbbb9e3bb038797236ac85';
const protectedPaths = ['docs/editorial/phase5','artifacts/marenetto-build/src/content/atelier','artifacts/marenetto-build/src/content/arabic-editorial','artifacts/marenetto-build/src/content/legal','artifacts/marenetto-build/src/content/home-copy.ts','artifacts/marenetto-build/src/components/AnalyticsPreferences.tsx'];
const baseline = protectedPaths.flatMap(p => execFileSync('git',['ls-tree','-r',base,'--',p],{encoding:'utf8'}).trim().split('\n').filter(Boolean));
await mkdir(out,{recursive:true});
await writeFile(path.join(out,'protected-baseline.json'),JSON.stringify({commit:base,entries:baseline},null,2));
process.stdout.write(JSON.stringify({editions:pack.records.length,rootSHA256:pack.rootSHA256})+'\n');
