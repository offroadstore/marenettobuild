// Explicit owner-authorized, read-only capture. Never imports or mutates rows.
import {readFile,writeFile} from 'node:fs/promises';
import {pool} from '@workspace/db';
import catalog from 'marenetto-editorial-catalog';
import {allRows} from '../src/lib/editorial-store';
import {deploymentTargets,semanticValue,intactRevision,type DeploymentCatalog} from '../src/lib/deployment-release';
import {fingerprint,validateContent} from '../src/lib/editorial-content';
if(process.env.NODE_ENV==='production')throw new Error('Capture disabled in production');
const directory='docs/editorial/release-2026-11/';
try {
 const expected=JSON.parse(await readFile('generated-artifacts/release-152-tests/development-conflicts.json','utf8')).conflicts;
 const locales=['it','en','de','nl','fr','es','pt','pl','ru','ar'];
 const identity='comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali';
 if(expected.length!==10||locales.some(l=>!expected.some((r:any)=>r.identity===identity&&r.locale===l)))
   throw new Error('Not the ten cases approved in the delivered CSV');
 const rows=await allRows(),targets=deploymentTargets(catalog as DeploymentCatalog);
 const fixtures=expected.map((before:any)=>{
   const row=rows.find(r=>r.identity===before.identity&&r.locale===before.locale)!;
   const last=row?.data.revisions.at(-1),events=row?.data.events;
   const target=targets.find(r=>r.identity===before.identity&&r.locale===before.locale)!;
   const base=catalog.records.find(r=>r.identity===before.identity&&r.locale===before.locale)!;
   if(!row||!last||row.path!==before.path||last.hash!==before.storedHash||
      row.kind!=='article'||row.data.state!=='draft'||row.data.activeRevisionId||row.data.withdrawn||
      row.data.revisions.length!==1||events?.length!==1||events[0].action!=='import'||
      events[0].revisionId!==last.id||events[0].hash!==last.hash||
      !(fingerprint(validateContent(last.content,catalog.locales))===last.hash||intactRevision(row.data,last,base.content))||
      fingerprint(validateContent(target.content,catalog.locales))!==before.expectedHash)
     throw new Error(`Private import changed since approval: ${before.locale}`);
   return {identity:row.identity,locale:row.locale,path:row.path,hash:last.hash,sourceHash:last.sourceHash,
     importSourceHash:events[0].sourceHash,content:last.content};
 });
 const records=fixtures.map(({content,...record}:any)=>{
   const target=targets.find(t=>t.identity===record.identity&&t.locale===record.locale)!;
   return {...record,contentSHA256:fingerprint(semanticValue(content)),targetPath:target.path,
     targetHash:fingerprint(validateContent(target.content,catalog.locales))};
 });
 const authorization={id:'owner-private-import-reconciliation-2026-11-26',decisionDate:'2026-11-26',
   decision:'Autorizza i dieci casi esatti',
   scope:'Ten exact private imports from the delivered conflict CSV only; retain their revisions, append only the already approved editions, reconcile the Arabic private path. No publication or immediate production mutation.',
   records,digest:fingerprint(records)};
 await writeFile(directory+'private-import-authorization.json',JSON.stringify(authorization,null,2)+'\n');
 await writeFile(directory+'private-import-fixtures.json',JSON.stringify(fixtures,null,2)+'\n');
 console.log(JSON.stringify({captured:records.length,digest:authorization.digest,databaseWrites:0}));
}finally{await pool.end();}
