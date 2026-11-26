import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import express from 'express';
import { applyRelease } from '../../../docs/editorial/release-2026-11/owner-apply.mjs';
import { fingerprint, transition } from '../src/lib/editorial-content.ts';
import { allRows } from '../src/lib/editorial-store.ts';
import router from '../src/routes/editorial.ts';
import {pool} from '@workspace/db';

if(process.env.COMMERCIAL_RELEASE_ISOLATED!=='true'||pool.__isolatedTestOnly!==true) throw new Error('This suite MUST use the in-memory adapter, never a database.');

const directory='generated-artifacts/editorial/release-2026-11';
const pack=JSON.parse(await readFile(`${directory}/package.json`,'utf8'));
const app=express();
app.use(express.json({limit:'1mb'}));
app.use((req,_res,next)=>{req.log={error(){}};next();});
app.use('/api',router);
const server=app.listen(0,'127.0.0.1');
await once(server,'listening');
const origin=`http://127.0.0.1:${server.address().port}/api`;
function transport(role='synthetic-owner') {
  return async (path,method='GET',body) => {
    const res=await fetch(origin+path,{method,headers:{'content-type':'application/json','x-isolated-test-role':role},...(body===undefined?{}:{body:JSON.stringify(body)})});
    const data=await res.json();
    if(!res.ok) throw Object.assign(new Error(`${res.status}: ${data.error}`),{status:res.status});
    return data;
  };
}
const api=transport();
const run=(input=pack,apply=false)=>applyRelease({pack:input,transport:api,apply,digest:fingerprint});
test('182 exact editions pass the actual CMS routes in isolated memory only', async t=>{
  try {
    const imported=await api('/internal/editorial');
    const originals=structuredClone(await allRows());
    await t.test('anonymous and editor cannot approve; no gate bypass in production code',async()=>{
      await assert.rejects(()=>transport('anonymous')('/internal/editorial'),e=>e.status===401);
      const row=await api(`/internal/editorial/${imported[0].id}`);
      await assert.rejects(()=>transport('editor')(`/internal/editorial/${row.id}/action`,'POST',{version:row.version,revisionId:row.revisions.at(-1).id,action:'approve'}),e=>e.status===403);
    });
    await t.test('read-only preflight, content tampering and route collision',async()=>{
      assert.equal((await run()).report.length,182);
      assert.deepEqual(await allRows(),originals);
      const altered=structuredClone(pack);
      altered.records[0].content.summary+=' alterato';
      await assert.rejects(()=>run(altered),/Testo alterato/);
      const presentation=structuredClone(pack);
      presentation.records.find(r=>r.readOnlySeries).readOnlySeries=false;
      await assert.rejects(()=>run(presentation),/Presentazione alterata/);
      const collision=structuredClone(pack);
      collision.records[0].path=originals.find(r=>r.identity!==collision.records[0].identity).path;
      collision.rootSHA256=fingerprint(collision.records.map(r=>[r.identity,r.locale,r.path,r.canonicalPath,r.candidateContentSHA256,r.sourceContentSHA256,r.presentationSHA256??null]));
      await assert.rejects(()=>run(collision),/Collisione|Percorso storico/);
    });
    await t.test('newer purchase revision is never overwritten',async()=>{
      const summary=imported.find(r=>r.identity===pack.records.find(r=>r.mode==='revise-existing').identity&&r.locale==='it');
      const row=(await allRows()).find(r=>r.id===summary.id);
      const before=structuredClone(row);
      row.data.revisions.at(-1).actor='synthetic-later-owner-edit';
      row.data.revisions.at(-1).content.title+=' — later';
      row.data.revisions.at(-1).hash=fingerprint(row.data.revisions.at(-1).content);
      await assert.rejects(()=>run(),/Revisione successiva/);
      Object.assign(row,before);
    });
    await t.test('drafts and missing approval never become public',async()=>{
      const purchase=pack.records.find(r=>r.mode==='revise-existing'&&r.locale==='it');
      const summary=imported.find(r=>r.identity===purchase.identity&&r.locale==='it');
      const row=await api(`/internal/editorial/${summary.id}`);
      await assert.rejects(()=>api(`/internal/editorial/${row.id}/action`,'POST',{
        version:row.version,revisionId:row.revisions.at(-1).id,action:'activate',
      }),e=>e.status===409);
      assert.equal((await api('/editorial/active')).length,120,'Only the separate series is already active');
    });
    let activated;
    await t.test('real submit, approve and activate transitions persist exact source links',async()=>{
      activated=await run(pack,true);
      assert.equal(activated.report.length,182);
      const rows=await allRows();
      const preserved=originals.filter(r=>r.data.revisions.at(-1)?.content.guide);
      assert.equal(preserved.length,120);
      for(const original of preserved)assert.deepEqual(rows.find(r=>r.id===original.id),original,'All series revisions, row versions, video and approval events are retained');
      await writeFile(`${directory}/series-preservation.json`,JSON.stringify({seriesRows:120,retainedPurchase:pack.records.filter(r=>r.readOnlySeries).length,otherSeries:108,unchanged:true},null,2));
      for(const r of pack.records) {
        const row=rows.find(s=>s.identity===r.identity&&s.locale===r.locale);
        const revision=row.data.revisions.find(v=>v.id===row.data.activeRevisionId);
        assert.equal(row.data.state,'active');
        assert.equal(revision.hash,r.candidateContentSHA256);
        assert.equal(revision.sourceHash,r.sourceContentSHA256);
        assert.deepEqual(revision.content,r.content);
        assert.ok(row.data.events.some(e=>e.action==='approve'&&e.revisionId===revision.id&&e.hash===revision.hash));
        const original=originals.find(s=>s.id===row.id);
        if(original) {
          assert.deepEqual(row.data.originals,original.data.originals);
          assert.deepEqual(row.data.aliases,original.data.aliases);
          assert.deepEqual(row.data.revisions.slice(0,original.data.revisions.length),original.data.revisions);
        }
      }
      await writeFile(`${directory}/candidate-activation.json`,JSON.stringify({
        environment:'isolated in-memory SQL adapter; no development/production database or real authentication',
        ...activated,
      },null,2));
      const active=await api('/editorial/active');
      assert.equal(active.length,290);
      await writeFile(`${directory}/candidate-active.json`,JSON.stringify(active,null,2));
    });
    await t.test('repetition is idempotent and activation gates remain mandatory',async()=>{
      const before=structuredClone(await allRows());
      await run(pack,true);
      assert.deepEqual(await allRows(),before);
      const row=before.find(r=>r.identity===pack.records[0].identity&&r.locale==='it');
      await assert.rejects(()=>api(`/internal/editorial/${row.id}/action`,'POST',{version:row.version-1,revisionId:row.data.activeRevisionId,action:'submit'}),e=>e.status===409);
      const live=(await allRows()).find(r=>r.id===row.id);
      const rev=live.data.revisions.at(-1);
      transition(live.data,'submit',rev.id,rev.sourceHash,'it','synthetic-owner',true);
      transition(live.data,'approve',rev.id,rev.sourceHash,'it','synthetic-owner',true);
      const old=process.env.MARENETTO_TESTING_APPROVED;
      delete process.env.MARENETTO_TESTING_APPROVED;
      try {await assert.rejects(()=>api(`/internal/editorial/${row.id}/action`,'POST',{version:row.version,revisionId:rev.id,action:'activate'}),e=>e.status===503);}
      finally{process.env.MARENETTO_TESTING_APPROVED=old;Object.assign(live,structuredClone(row));}
    });
    await t.test('active aliases cannot be captured by another family',async()=>{
      const other=(await allRows()).find(r=>r.identity===pack.records[1].identity&&r.locale==='it');
      const aliases=other.data.aliases;
      other.data.aliases=[...(aliases??[]),pack.records[0].path];
      try {await assert.rejects(()=>run(pack,true),/Collisione con percorso o alias attivo/);}
      finally {if(aliases)other.data.aliases=aliases;else delete other.data.aliases;}
    });
    await t.test('withdrawal never repeats into reactivation without a new owner decision',async()=>{
      const live=(await allRows()).find(r=>r.identity===pack.records[0].identity&&r.locale==='ar');
      const before=structuredClone(live);
      const rev=live.data.revisions.at(-1);
      transition(live.data,'withdraw',rev.id,rev.sourceHash,'ar','synthetic-owner',true);
      await assert.rejects(()=>run(pack,true),/Ritiro da rispettare/);
      assert.equal(live.data.activeRevisionId,null);
      Object.assign(live,before);
    });
    await t.test('a withdrawal of the previous active revision also protects a newer exact draft',async()=>{
      const live=(await allRows()).find(r=>r.identity===pack.records[1].identity&&r.locale==='ar');
      const latest=live.data.revisions.at(-1);
      const earlier=structuredClone(latest);
      earlier.id+='-synthetic-previous';earlier.content.body+='<p>synthetic earlier revision</p>';earlier.hash=fingerprint(earlier.content);
      live.data.revisions.unshift(earlier);live.data.activeRevisionId=earlier.id;live.data.state='draft';
      transition(live.data,'withdraw',earlier.id,earlier.sourceHash,'ar','synthetic-owner',true);
      // The preceding test restored its fixture, so only this independent
      // withdrawal can cause the rejection through the normal API.
      await assert.rejects(()=>run(pack,true),/Ritiro da rispettare/);
      assert.equal(live.data.activeRevisionId,null);
      assert.equal(live.data.revisions.at(-1).hash,latest.hash);
    });
  } finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
});
