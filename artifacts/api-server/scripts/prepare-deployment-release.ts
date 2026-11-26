// Pure build compiler. No database, auth, or production mutations.
import { readFile, writeFile } from 'node:fs/promises';
import { fingerprint, validateContent } from '../src/lib/editorial-content';
import { refineSeries } from '../../../docs/editorial/release-2026-11/refinements.mjs';
const root=(process.env.EDITORIAL_BUILD_ROOT??'generated-artifacts/editorial')+'/';
const catalog=JSON.parse(await readFile(root+'catalog.json','utf8'));
const pack=JSON.parse(await readFile(root+'release-2026-11/package.json','utf8'));
const series=refineSeries(catalog.seriesDrafts).map((s:any)=>({...s,content:validateContent(s.content,catalog.locales)}));
const original=catalog.seriesDrafts.map((s:any)=>({...s,content:validateContent(s.content,catalog.locales)}));
if(series.length!==original.length||series.some((s:any,i:number)=>s.identity!==original[i].identity||
 s.locale!==original[i].locale||fingerprint(s.content)!==fingerprint(original[i].content)))
 throw new Error('Le rifiniture URL/title non possono modificare i manoscritti approvati');
const privateImports=JSON.parse(await readFile('docs/editorial/release-2026-11/private-import-authorization.json','utf8'));
const fixtures=JSON.parse(await readFile('docs/editorial/release-2026-11/private-import-fixtures.json','utf8'));
const semantic=(v:any):any=>Array.isArray(v)?v.map(semantic):v&&typeof v==='object'?
  Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,semantic(x)])):v;
if(privateImports.records.length!==10||fixtures.length!==10||fingerprint(privateImports.records)!==privateImports.digest||
  fixtures.some((f:any)=>!privateImports.records.some((r:any)=>r.identity===f.identity&&r.locale===f.locale&&r.path===f.path&&
    r.hash===f.hash&&r.sourceHash===f.sourceHash&&r.importSourceHash===f.importSourceHash&&fingerprint(semantic(f.content))===r.contentSHA256)))
  throw new Error('Evidenza dei dieci import privati non coincidente');
const evidence=series.map((s:any,i:number)=>({
  identity:s.identity,locale:s.locale,oldPath:original[i].path,path:s.path,
  beforeHash:fingerprint(original[i].content),hash:fingerprint(s.content),
  beforeTitle:original[i].content.seoTitle,title:s.seoTitle??s.content.seoTitle,
}));
const authorization={
  id:'deployment-owner-2026-11-26',decisionDate:'2026-11-26',
  scope:'Exact 182-edition package (12 read-only shared, 170 promotions), 120 series editions, authorized URL/SEO-only refinements; next normal deployment, not publication by agent.',
  seriesDigest:catalog.seriesRelease.contentDigest,commercialDigest:pack.rootSHA256,
  seriesPayloadDigest:fingerprint(series),commercialPayloadDigest:fingerprint(pack),
  privateImportsDigest:fingerprint(privateImports),
  evidence,
};
const target='docs/editorial/release-2026-11/deployment-authorization.json';
const compiled=JSON.stringify(authorization,null,2)+'\n';
if(process.argv.includes('--authorize'))await writeFile(target,compiled);
else if(await readFile(target,'utf8')!==compiled)throw new Error('Autorizzazione deploy non coincidente: nessuna rigenerazione implicita.');
catalog.deploymentSeries=series;
catalog.commercialRelease=pack;
await writeFile(root+'catalog.json',JSON.stringify(catalog));
