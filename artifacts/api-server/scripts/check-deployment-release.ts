// Read-only diagnostic. Never calls ensureEditorial/importCatalog or writes SQL.
import {pool} from '@workspace/db';
import {allRows} from '../src/lib/editorial-store';
import {planDeployment,deploymentTargets,semanticValue,type DeploymentCatalog} from '../src/lib/deployment-release';
import privateImports from '../../../docs/editorial/release-2026-11/private-import-authorization.json';
import catalog from 'marenetto-editorial-catalog';
import type {Row} from '../src/lib/editorial-store';
import {sameEditorialContent} from '../src/lib/series-release';
import {validateContent,fingerprint} from '../src/lib/editorial-content';
let rows:Row[]=[];
try {
  rows=await allRows();
  const conflicts=[];
  let remaining=rows;
  for(;;) {
    try {
      const result=planDeployment(remaining,catalog as DeploymentCatalog);
      process.stdout.write(JSON.stringify({existing:rows.length,conflicts,
        method:'Read-only. Blocked rows omitted recursively only to enumerate independent conflicts; not an authorization or executable migration plan.',
        ...(conflicts.length?{}:{operations:result.report,preservedPrivateImports:privateImports.records.map(f=>{
          const row=rows.find(r=>r.identity===f.identity&&r.locale===f.locale);
          const active=row?.data.revisions.find(r=>r.id===row.data.activeRevisionId);
          return {identity:f.identity,locale:f.locale,
            found:row?.data.revisions.some(r=>r.hash===f.hash&&r.sourceHash===f.sourceHash&&fingerprint(semanticValue(r.content))===f.contentSHA256)??false,
            activeHash:active?.hash??null,targetHash:f.targetHash};
        })})})+'\n');
      process.exitCode=conflicts.length?1:0;
      break;
    }catch(error) {
      const message=(error as Error).message;
      const key=message.split(' ').at(-1);
      const row=remaining.find(r=>`${r.identity}:${r.locale}`===key);
      if(!row)throw error;
      const record=(catalog as DeploymentCatalog).commercialRelease.records.find(r=>`${r.identity}:${r.locale}`===key);
      const target=deploymentTargets(catalog as DeploymentCatalog).find(r=>`${r.identity}:${r.locale}`===key);
      const last=row.data.revisions.at(-1)!;
      conflicts.push({message,identity:row.identity,locale:row.locale,path:row.path,state:row.data.state,
        revisions:row.data.revisions.length,active:Boolean(row.data.activeRevisionId),withdrawn:Boolean(row.data.withdrawn),
        storedHash:last.hash,expectedHash:target&&fingerprint(validateContent(target.content,(catalog as DeploymentCatalog).locales)),
        knownBase:record?.allowedBaseHashes.includes(last.hash)??false,
        actions:row.data.events.map(e=>e.action),
        catalogHash:(catalog as DeploymentCatalog).records.filter(r=>r.identity===row.identity&&r.locale===row.locale).map(r=>fingerprint(validateContent(r.content,(catalog as DeploymentCatalog).locales))),
        sameCatalogContent:(catalog as DeploymentCatalog).records.filter(r=>r.identity===row.identity&&r.locale===row.locale).some(r=>sameEditorialContent(validateContent(r.content,(catalog as DeploymentCatalog).locales),last.content))});
      remaining=remaining.filter(r=>r!==row);
    }
  }
}catch(error) {
  const e=error as Error&{code?:string};
  const key=e.message.split(' ').at(-1);
  const row=rows.find(r=>`${r.identity}:${r.locale}`===key);
  const record=(catalog as DeploymentCatalog).commercialRelease.records.find(r=>`${r.identity}:${r.locale}`===key);
  const last=row?.data.revisions.at(-1);
  process.stdout.write(JSON.stringify({error:/^(Deploy|Serie):/.test(e.message)?e.message:e.name,code:e.code??null,
    ...(row?{identity:row.identity,locale:row.locale,state:row.data.state,revisions:row.data.revisions.length,
      active:Boolean(row.data.activeRevisionId),withdrawn:Boolean(row.data.withdrawn),knownBase:record?.allowedBaseHashes.includes(last!.hash),
      sameCatalogContent:(catalog as DeploymentCatalog).records.filter(r=>r.identity===row.identity&&r.locale===row.locale).some(r=>sameEditorialContent(validateContent(r.content,(catalog as DeploymentCatalog).locales),last?.content)),
      latestActions:row.data.events.filter(e=>e.revisionId===last?.id).map(e=>e.action)}:{})})+'\n');
  process.exitCode=1;
}finally{await pool.end();}
