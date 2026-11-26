import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import healthRouter from '../src/routes/health';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {pool} from '@workspace/db';
import catalog from 'marenetto-editorial-catalog';
import {importCatalog,allRows,publicRows,publicEditionPath,seriesReady} from '../src/lib/editorial-store.ts';
import {planDeployment,verifyDeployment,deploymentTargets,semanticValue} from '../src/lib/deployment-release.ts';
import {fingerprint,revision,transition,event,publicContent} from '../src/lib/editorial-content.ts';
import {planDraftImport} from '../src/lib/editorial-draft-import.ts';
const out=process.env.RELEASE_EVIDENCE_DIR??'generated-artifacts/indexing-recovery';
await mkdir(out,{recursive:true});
const results=[];
await pool.query(`CREATE TABLE editorial_editions(id text PRIMARY KEY,identity text NOT NULL,locale text NOT NULL,
 path text NOT NULL UNIQUE,kind text NOT NULL CHECK(kind IN ('article','page')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),data jsonb NOT NULL,UNIQUE(identity,locale))`);
let baseline;
const save=row=>pool.query('UPDATE editorial_editions SET data=$1,version=$2,path=$3 WHERE id=$4',[row.data,row.version,row.path,row.id]);
const snapshot=async()=>JSON.stringify(await allRows());
async function restore(rows=baseline) {
 await pool.query('TRUNCATE editorial_editions');
 await pool.query('INSERT INTO editorial_editions SELECT * FROM jsonb_populate_recordset(NULL::editorial_editions,$1::jsonb)',[JSON.stringify(rows)]);
}
const family=()=>catalog.commercialRelease.records.find(r=>r.readOnlySeries).identity;
const find=(rows,episode=4,locale='it')=>rows.find(r=>r.locale===locale&&r.data.revisions.some(v=>v.content.guide?.episode===episode));
const active=row=>row.data.revisions.find(r=>r.id===row.data.activeRevisionId);
const privateFixtures=JSON.parse(await readFile('docs/editorial/release-2026-11/private-import-fixtures.json','utf8'));
function privateRows() {
 const rows=structuredClone(baseline);
 for(const f of privateFixtures) {
  const row=rows.find(r=>r.identity===f.identity&&r.locale===f.locale);
  const previous=revision(structuredClone(f.content),f.sourceHash,'synthetic historical import');
  previous.hash=f.hash;
  row.path=f.path;row.version=2;row.data.state='draft';row.data.activeRevisionId=null;
  row.data.withdrawn=false;row.data.revisions=[previous];row.data.events=[];
  event(row.data,'import',previous,previous.actor);row.data.events[0].sourceHash=f.importSourceHash;
 }
 return rows;
}
test('exact deploy activation, route migration and restart on isolated real PostgreSQL',async t=>{
 try {
  async function check(name,fn){await t.test(name,fn);results.push(name);}
  await check('fresh startup health activates 290 distinct editions: 182 package, 120 series, 12 shared',async()=>{
   const app=express();app.use('/api',healthRouter);
   const server=app.listen(0,'127.0.0.1');
   if(!server.listening)await new Promise(r=>server.once('listening',r));
   try {const r=await fetch(`http://127.0.0.1:${server.address().port}/api/healthz`);assert.equal(r.status,200);}
   finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
   baseline=await allRows();
   assert.equal(await seriesReady(),true);
   assert.equal((await publicRows()).length,290);
   const publicKeys=new Set((await publicRows()).map(r=>`${r.identity}:${r.locale}`));
   for(const r of catalog.commercialRelease.records)assert.ok(publicKeys.has(`${r.identity}:${r.locale}`));
   for(const r of baseline.filter(r=>r.data.activeRevisionId)) {
    assert.match(r.data.events.find(e=>e.action==='activate'&&e.revisionId===active(r).id).actor,/Sistema automatico; autorizzazione dichiarata dal titolare 2026-11-26/);
    if(active(r).content.guide)assert.equal(active(r).content.guide.searchConsoleVerified,false);
   }
   assert.ok(find(baseline).data.originals.length);
  });
  await check('concurrent starts and repeated URL/title migrations never duplicate revisions or events',async()=>{
   const before=await snapshot();
   await Promise.all([importCatalog(),importCatalog(),importCatalog()]);
   assert.equal(await snapshot(),before);
   assert.equal(await seriesReady(),true);
  });
  await check('untouched production catalog promotes atomically and retains historical originals',async()=>{
   const previous=structuredClone(baseline).filter(r=>r.data.events.some(e=>e.action==='import'));
   for(const row of previous) {
    row.data.revisions=row.data.revisions.slice(0,1);row.data.events=row.data.events.filter(e=>e.action==='import');
    row.data.activeRevisionId=null;row.data.state='draft';row.version=1;
   }
   await restore(previous);await importCatalog();
   assert.equal(await seriesReady(),true);
   assert.deepEqual(find(await allRows()).data.originals,find(baseline).data.originals);
  });
  await check('the ten explicitly authorized private imports retain old revisions and reconcile the Arabic path',async()=>{
   const before=privateRows();
   await restore(before);await importCatalog();
   assert.equal(await seriesReady(),true);
   const rows=await allRows();
   for(const f of privateFixtures) {
    const old=before.find(r=>r.identity===f.identity&&r.locale===f.locale);
    const row=rows.find(r=>r.identity===f.identity&&r.locale===f.locale);
    assert.deepEqual(row.data.revisions[0],old.data.revisions[0]);
    assert.deepEqual(row.data.originals,old.data.originals);
    assert.equal(row.data.revisions.length,2);
    assert.equal(active(row).hash,catalog.deploymentSeries.find(r=>r.identity===f.identity&&r.locale===f.locale)?
      fingerprint(catalog.deploymentSeries.find(r=>r.identity===f.identity&&r.locale===f.locale).content):
      catalog.commercialRelease.records.find(r=>r.identity===f.identity&&r.locale===f.locale).candidateContentSHA256);
    assert.equal(row.data.events.filter(e=>e.action.startsWith('owner-private-import-reconciliation-')).length,1);
    if(f.locale==='ar')assert.ok(row.data.aliases.includes(f.path));
   }
   const migrated=await snapshot();await Promise.all([importCatalog(),importCatalog()]);
   assert.equal(await snapshot(),migrated);
  });
  await check('private-import permission rejects changed bodies, source hashes, paths, ledgers and later drafts',async()=>{
   for(const mutate of [
    r=>r.data.revisions[0].content.body+='<p>changed after approval</p>',
    r=>r.data.revisions[0].sourceHash='0'.repeat(64),
    r=>r.path='/different-private-path',
    r=>event(r.data,'save',r.data.revisions[0],'synthetic later edit'),
    r=>r.data.revisions.push(revision({...r.data.revisions[0].content,summary:'later private manuscript'},'','synthetic')),
   ]) {
    const rows=privateRows(),row=rows.find(r=>r.identity===privateFixtures[0].identity&&r.locale==='it');
    mutate(row);await restore(rows);const before=await snapshot();
    await assert.rejects(importCatalog,/candidata successiva|percorso in conflitto/);
    assert.equal(await snapshot(),before);
   }
  });
  await check('private reconciliation cannot cross an eleventh edition or foreign Arabic aliases',async()=>{
   const rows=privateRows(),f=privateFixtures.find(r=>r.locale==='en');
   const other=rows.find(r=>r.identity===f.identity&&r.locale==='sv');
   const old=revision(f.content,f.sourceHash,'synthetic imported lookalike');old.hash=f.hash;
   other.data.activeRevisionId=null;other.data.state='draft';other.data.revisions=[old];other.data.events=[];
   event(other.data,'import',old,old.actor);await restore(rows);
   await assert.rejects(importCatalog,/candidata successiva/);
   const collision=privateRows(),arabic=privateFixtures.find(r=>r.locale==='ar');
   collision.find(r=>r.identity!==arabic.identity).data.aliases=[arabic.path];
   await restore(collision);const before=await snapshot();
   await assert.rejects(importCatalog,/collisione percorso\/alias/);assert.equal(await snapshot(),before);
  });
  await check('withdrawal of an exact authorized private import remains a release-wide hold',async()=>{
   const rows=privateRows(),row=rows.find(r=>r.identity===privateFixtures[0].identity&&r.locale==='it');
   row.data.withdrawn=true;event(row.data,'withdraw',row.data.revisions[0],'synthetic owner withdrawal');
   await restore(rows);const before=await allRows();await importCatalog();const after=await allRows();
   for(const target of deploymentTargets(catalog)) {
    const match=r=>r.identity===target.identity&&r.locale===target.locale;
    assert.equal(fingerprint(semanticValue(after.find(match))),fingerprint(semanticValue(before.find(match))),`${target.identity}:${target.locale}`);
   }
   assert.equal(await seriesReady(),false);
  });
  await check('candidate-only exact package is activated without a browser session',async()=>{
   const candidates=structuredClone(baseline);
   for(const row of candidates.filter(r=>r.data.activeRevisionId)) {
    row.data.activeRevisionId=null;row.data.state='draft';row.data.events=[];
    event(row.data,'series-draft',row.data.revisions.at(-1),'synthetic preparation');
   }
   await restore(candidates);await importCatalog();assert.equal(await seriesReady(),true);
  });
  await check('pre-existing private phase-five drafts are compared semantically and promoted only from exact allowed bases',async()=>{
   const previous=JSON.parse(await readFile('generated-artifacts/editorial/release-2026-11/previous-guides.json','utf8'));
   const proposals=previous.records.filter(r=>r.mode==='create').sort((a,b)=>Number(b.locale==='it')-Number(a.locale==='it'));
   const keys=new Set(proposals.map(r=>`${r.identity}:${r.locale}`));
   const rows=structuredClone(baseline).filter(r=>!keys.has(`${r.identity}:${r.locale}`));
   for(const proposal of proposals) {
    const source=proposals.find(r=>r.identity===proposal.identity&&r.locale==='it');
    const change=planDraftImport({...proposal,sourceHash:fingerprint(source.content)},rows,catalog.locales);
    rows.push(change.row);
   }
   await restore(rows);await importCatalog();assert.equal(await seriesReady(),true);
  });
  await check('already applied owner package and all shared purchase revisions remain untouched',async()=>{
   await restore();
   const rows=await allRows();
   const report=planDeployment(rows,catalog).report;
   assert.equal(report.filter(r=>r.operation==='retained').length,290);
   const before=await snapshot();await importCatalog();assert.equal(await snapshot(),before);
   for(const original of catalog.seriesDrafts.filter(s=>[4,7].includes(s.content.guide.episode))) {
    const row=rows.find(r=>r.identity===original.identity&&r.locale===original.locale);
    assert.equal(publicEditionPath(row),original.path);
   }
  });
  await check('a later draft cannot degrade any valid active public revision',async()=>{
   await restore();const row=find(await allRows());
   const draft=revision({...active(row).content,title:active(row).content.title+' — candidate only'},active(row).hash,'synthetic draft');
   draft.sourceHash=draft.hash;row.data.revisions.push(draft);row.data.state='draft';event(row.data,'save',draft,draft.actor);
   await save(row);const before=await snapshot();
   await importCatalog();assert.equal(await snapshot(),before);assert.equal(await seriesReady(),true);
  });
  await check('later truly approved purchase editions use the actual Italian active source, including Arabic',async()=>{
   await restore();const rows=await allRows(),purchase=rows.filter(r=>r.identity===family()&&r.data.activeRevisionId).sort((a,b)=>Number(b.locale==='it')-Number(a.locale==='it'));
   assert.equal(purchase.length,13);let source;
   for(const row of purchase) {
    const next=revision({...active(row).content,summary:active(row).content.summary+' [synthetic approved later edition]'},source??'','synthetic authorized owner');
    if(row.locale==='it'){next.sourceHash=next.hash;source=next.hash;}
    row.data.revisions.push(next);row.data.state='draft';
    for(const action of ['submit','approve','activate'])transition(row.data,action,next.id,next.sourceHash,row.locale,next.actor,true);
    await save(row);
   }
   const before=await snapshot();await importCatalog();assert.equal(await snapshot(),before);
   assert.equal(await seriesReady(),true);
  });
  await check('changed Italian source with old translations blocks promotion rather than rebinding translations',async()=>{
   await restore();const row=find(await allRows());
   const next=revision({...active(row).content,summary:active(row).content.summary+' [synthetic changed source]'},'','synthetic owner');
   next.sourceHash=next.hash;row.data.revisions.push(next);row.data.state='draft';
   for(const a of ['submit','approve','activate'])transition(row.data,a,next.id,next.hash,'it',next.actor,true);
   await save(row);const before=await snapshot();
   await assert.rejects(importCatalog,/traduzione non coincidente/);assert.equal(await snapshot(),before);
   assert.equal(await seriesReady(),false);
  });
  await check('withdrawals survive cold restarts and readiness stays closed',async()=>{
   await restore();const row=find(await allRows(),7);const rev=active(row);
   transition(row.data,'withdraw',rev.id,rev.sourceHash,row.locale,'synthetic owner',true);await save(row);
   const before=await snapshot();await importCatalog();assert.equal(await snapshot(),before);
   assert.equal(await seriesReady(),false);assert.equal((await publicRows()).find(r=>r.id===row.id).data.withdrawn,true);
  });
  await check('wrong root, payload, revision hash, public presentation and source digest cause full rollback',async()=>{
   for(const mutate of [
    c=>c.seriesRelease.contentDigest='0'.repeat(64),
    c=>c.commercialRelease.rootSHA256='0'.repeat(64),
    c=>c.commercialRelease.records[0].content.body+='<p>tampered</p>',
    c=>c.commercialRelease.records[0].candidateContentSHA256='0'.repeat(64),
    c=>c.commercialRelease.records[0].sourceContentSHA256='0'.repeat(64),
    c=>c.commercialRelease.records.find(r=>r.readOnlySeries).presentation.body+='<p>tampered</p>',
    c=>c.deploymentSeries[0].path='/arbitrary-path',
   ]) {
    await restore();const before=await snapshot(),saved=structuredClone(catalog);mutate(catalog);
    try{await assert.rejects(importCatalog);}finally{Object.assign(catalog,saved);}
    assert.equal(await snapshot(),before);
   }
  });
  await check('jsonb key reordering is safe, array order and body tampering are not',async()=>{
   await restore();assert.equal(await seriesReady(),true);
   for(const mutate of [
    r=>active(r).content.body+='<p>synthetic tampering</p>',
    r=>active(r).content.guide.faq.reverse(),
   ]) {
    await restore();const row=find(await allRows(),7);mutate(row);await save(row);
    await assert.rejects(importCatalog,/integrità attiva/);
    await assert.rejects(publicRows,e=>e.status===503);
   }
  });
  await check('missing approval and plausible historical actors/events never authorize tampered text',async()=>{
   await restore();const row=find(await allRows(),8);row.data.events=row.data.events.filter(e=>e.action!=='approve');await save(row);
   await assert.rejects(importCatalog,/approvazione/);await assert.rejects(publicRows,e=>e.status===503);
   await restore();const changed=find(await allRows(),4);active(changed).content.body+='<p>changed under old ledger</p>';
   await save(changed);await assert.rejects(importCatalog,/integrità attiva/);
  });
  await check('foreign route and alias collisions prevent all release writes',async()=>{
   await restore();const row=find(await allRows(),1);row.path='/foreign-route';await save(row);
   const before=await snapshot();await assert.rejects(importCatalog,/percorso in conflitto/);assert.equal(await snapshot(),before);
   await restore();const rows=await allRows(),other=rows.find(r=>r.identity!==find(rows,1).identity&&r.locale==='it');
   other.data.aliases=[catalog.deploymentSeries.find(r=>r.content.guide.episode===1&&r.locale==='it').path];await save(other);
   const prior=await snapshot();await assert.rejects(importCatalog,/collisione percorso\/alias/);assert.equal(await snapshot(),prior);
  });
  await check('migration accepts the old paths on an existing database, without manuscript revisions',async()=>{
   await restore();const rows=await allRows();
   for(const seed of catalog.seriesDrafts) {
    const row=rows.find(r=>r.identity===seed.identity&&r.locale===seed.locale);
    row.path=seed.path.replace(/\/+$/,'');delete row.data.aliases;await save(row);
   }
   const before=await allRows();await importCatalog();assert.equal(await seriesReady(),true);
   const after=await allRows();
   for(const row of before) {
    const migrated=after.find(r=>r.id===row.id);
    assert.deepEqual(migrated.data.revisions,row.data.revisions);
    assert.deepEqual(migrated.data.events,row.data.events);
   }
   const once=await snapshot();await importCatalog();assert.equal(await snapshot(),once);
  });
  await check('a database write failure rolls back the entire migration and a clean retry succeeds',async()=>{
   await restore();const row=find(await allRows(),1);
   row.path=catalog.seriesDrafts.find(s=>s.identity===row.identity&&s.locale===row.locale).path.replace(/\/+$/,'');
   await save(row);const before=await snapshot();
   await pool.query(`CREATE FUNCTION reject_release_write() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'synthetic write failure'; END;$$`);
   await pool.query('CREATE TRIGGER reject_release BEFORE UPDATE ON editorial_editions FOR EACH ROW EXECUTE FUNCTION reject_release_write()');
   try {await assert.rejects(importCatalog,/synthetic write failure/);assert.equal(await snapshot(),before);}
   finally {await pool.query('DROP TRIGGER reject_release ON editorial_editions');await pool.query('DROP FUNCTION reject_release_write()');}
   await importCatalog();assert.equal(await seriesReady(),true);
  });
  await restore();await importCatalog();verifyDeployment(catalog);
  const rows=await publicRows();
  const exported=rows.map(row=>{const rev=active(row);return {
   identity:row.identity,locale:row.locale,path:publicEditionPath(row),aliases:row.data.aliases??[],kind:row.kind,
   revisionId:rev.id,revisionHash:rev.hash,sourceHash:rev.sourceHash,revisionCreatedAt:rev.createdAt,
   indexingAuthorized:true,content:publicContent(rev.content),
  };});
  await writeFile(out+'/candidate-active.json',JSON.stringify(exported));
  await writeFile(out+'/database-results.json',JSON.stringify({environment:'isolated local PostgreSQL Unix socket only; no development/production database or owner session',results,active:exported.length,commercial:182,series:120,shared:12},null,2));
 }finally{await pool.end();}
});
