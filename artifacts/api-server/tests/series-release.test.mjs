import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import healthRouter from '../src/routes/health';
import { writeFile, mkdir } from 'node:fs/promises';
import { pool } from '@workspace/db';
import catalog from 'marenetto-editorial-catalog';
import { importCatalog, allRows, publicRows, publicEditionPath, seriesReady } from '../src/lib/editorial-store.ts';
import { fingerprint, revision, transition, event, publicContent } from '../src/lib/editorial-content.ts';
const output='generated-artifacts/indexing-recovery';
await mkdir(output,{recursive:true});
const results=[];
await pool.query(`CREATE TABLE editorial_editions(
  id text PRIMARY KEY, identity text NOT NULL, locale text NOT NULL,
  path text NOT NULL UNIQUE, kind text NOT NULL CHECK(kind IN ('article','page')),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), data jsonb NOT NULL, UNIQUE(identity,locale))`);
const save=async row=>pool.query('UPDATE editorial_editions SET data=$1,version=$2,path=$3 WHERE id=$4',[row.data,row.version,row.path,row.id]);
let baseline;
async function restore(rows=baseline) {
  await pool.query('TRUNCATE editorial_editions');
  await pool.query(`INSERT INTO editorial_editions SELECT * FROM jsonb_populate_recordset(NULL::editorial_editions,$1::jsonb)`,[JSON.stringify(rows)]);
}
const snapshot=async()=>JSON.stringify(await allRows());
const seriesRow=(rows,episode=4,locale='it')=>rows.find(r=>r.locale===locale&&r.data.revisions.some(v=>v.content.guide?.episode===episode));
test('real PostgreSQL release transaction, concurrent starts, conflicts and cold restarts',async t=>{
  try {
    await t.test('existing production catalog and automatic activation without owner login',async()=>{
  const app=express();app.use('/api',healthRouter);
  const server=app.listen(0,'127.0.0.1');
  if(!server.listening)await new Promise(resolve=>server.once('listening',resolve));
  try {
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/healthz`);
    assert.equal(response.status,200,'actual API startup readiness imports and activates before returning ready');
    assert.equal((await response.json()).status,'ok');
  } finally { server.closeAllConnections();await new Promise(resolve=>server.close(resolve)); }
      assert.equal(await seriesReady(),true);
      baseline=await allRows();
      assert.equal((await publicRows()).length,120);
      assert.equal(baseline.filter(r=>r.data.activeRevisionId).length,120);
      assert.ok(seriesRow(baseline).data.originals.length>0);
      for(const row of baseline.filter(r=>r.data.activeRevisionId)) {
        const rev=row.data.revisions.find(r=>r.id===row.data.activeRevisionId);
        assert.match(rev.actor,/Sistema automatico; autorizzazione dichiarata dal titolare/);
        assert.equal(rev.content.guide.searchConsoleVerified,false);
      }
      results.push('catalogo preesistente, 120 attive, originali preservati, attore automatico veritiero');
    });
    await t.test('repeated and concurrent startups are idempotent under the real advisory lock',async()=>{
      const before=await snapshot();
      await Promise.all([importCatalog(),importCatalog(),importCatalog()]);
      assert.equal(await snapshot(),before);
      results.push('tre avvii concorrenti PostgreSQL: nessuna revisione o evento duplicato');
    });
    await t.test('candidate-only series activates exact hashes transactionally',async()=>{
      const candidates=structuredClone(baseline);
      for(const row of candidates.filter(r=>r.data.activeRevisionId)) {
        row.data.activeRevisionId=null;row.data.state='draft';
        row.data.events=row.data.events.filter(e=>!['approve','activate','submit'].includes(e.action)&&!e.action.startsWith('series-owner-'));
      }
      await restore(candidates);
      await importCatalog();
      assert.equal(await seriesReady(),true);
      const before=await snapshot();await importCatalog();assert.equal(await snapshot(),before);
      results.push('serie solo candidata: 120 attivazioni esatte, seconda esecuzione invariata');
    });
    await t.test('untouched historical catalog activates without losing immutable originals',async()=>{
      const existing=structuredClone(baseline).filter(r=>r.data.events.some(e=>e.action==='import'));
      for(const row of existing) {
        row.data.revisions=row.data.revisions.slice(0,1);
        row.data.events=row.data.events.filter(e=>e.action==='import');
        row.data.activeRevisionId=null;row.data.state='draft';row.version=1;
      }
      await restore(existing);await importCatalog();
      assert.equal(await seriesReady(),true);
      assert.deepEqual(seriesRow(await allRows()).data.originals,seriesRow(baseline).data.originals);
      results.push('catalogo storico senza override: aggiornamento autorizzato, copie originali immutate');
    });
    await t.test('integrated shared purchase and its later candidate remain byte-for-byte intact',async()=>{
      await restore();
      const row=seriesRow(await allRows());
      const current=row.data.revisions.at(-1);
      const draft=revision({...current.content,title:current.content.title+' — candidate only'},current.hash,'synthetic later candidate');
      draft.sourceHash=draft.hash;
      row.data.revisions.push(draft);row.data.state='draft';
      event(row.data,'save',draft,'synthetic later candidate');row.version++;
      await save(row);
      const before=await snapshot();
      await importCatalog();
      assert.equal(await snapshot(),before);
      assert.equal(await seriesReady(),true);
      const translations=(await publicRows()).filter(r=>r.identity===row.identity&&r.locale!=='it');
      assert.equal(translations.length,11,'a candidate Italian source does not stale public translations');
      results.push('raccordo acquisto integrato: hash attivo conservato; candidata successiva non degrada le 11 traduzioni');
    });
    await t.test('withdrawal survives a cold importer restart and never reactivates',async()=>{
      await restore();const row=seriesRow(await allRows(),7);
      const rev=row.data.revisions.at(-1);
      transition(row.data,'withdraw',rev.id,rev.sourceHash,row.locale,'synthetic owner',true);await save(row);
      const before=await snapshot();await importCatalog();assert.equal(await snapshot(),before);
      assert.equal(await seriesReady(),false);
      assert.equal((await publicRows()).find(r=>r.id===row.id).data.withdrawn,true);
      results.push('ritiro preservato al riavvio; readiness 503, nessuna riattivazione');
    });
    await t.test('wrong digest rolls back the entire transaction',async()=>{
      await restore();const before=await snapshot(),original=catalog.seriesRelease.contentDigest;
      catalog.seriesRelease.contentDigest='0'.repeat(64);
      try{await assert.rejects(importCatalog,/digest non valido/);}finally{catalog.seriesRelease.contentDigest=original;}
      assert.equal(await snapshot(),before);
      results.push('digest errato: rollback completo');
    });
    await t.test('route/alias collision and newer revisions cannot be overwritten by an old event or actor',async()=>{
      await restore();const row=seriesRow(await allRows(),1);
      row.path='/it-route-collision';await save(row);
      const before=await snapshot();await importCatalog();
      assert.equal(await snapshot(),before);assert.equal(await seriesReady(),false);
      await restore();
      const changed=seriesRow(await allRows(),4);
      const rev=changed.data.revisions.at(-1);
      rev.content.summary+=' synthetic unauthorized newer text';
      rev.hash=fingerprint(rev.content);
      await save(changed);
      const prior=await snapshot();await importCatalog();assert.equal(await snapshot(),prior);
      await assert.rejects(seriesReady,error=>error.status===503);
      await restore();
      const altered=seriesRow(await allRows(),7);
      altered.data.revisions.at(-1).content.body+='<p>synthetic drift without a hash update</p>';
      await save(altered);
      await importCatalog();
      await assert.rejects(seriesReady,error=>error.status===503);
      results.push('percorso divergente e revisione con vecchio attore/evento: nessuna sovrascrittura, readiness bloccata');
    });
    await t.test('active Italian changes stale translations, missing approval never becomes public',async()=>{
      await restore();const row=seriesRow(await allRows(),4);
      const rev=row.data.revisions.at(-1);
      rev.content.title+=' synthetic newer approved';rev.hash=fingerprint(rev.content);rev.sourceHash=rev.hash;
      row.data.events=row.data.events.filter(e=>e.revisionId!==rev.id);
      event(row.data,'approve',rev,'synthetic owner');event(row.data,'activate',rev,'synthetic owner');await save(row);
      assert.equal((await publicRows()).filter(r=>r.identity===row.identity).length,12,'stale active rows stay visible to the SEO exclusion policy, never silently restore static fallback');
      assert.equal(await seriesReady(),false);
      await restore();const unapproved=seriesRow(await allRows(),8);
      unapproved.data.events=unapproved.data.events.filter(e=>e.action!=='approve');await save(unapproved);
      await assert.rejects(publicRows,error=>error.status===503);
      results.push('sorgente attiva cambiata: traduzioni escluse; approvazione mancante: contenuto non esposto');
    });
    await restore();await importCatalog();
    const rows=await publicRows();
    const active=rows.map(row=>{
      const rev=row.data.revisions.find(r=>r.id===row.data.activeRevisionId);
      return {identity:row.identity,locale:row.locale,path:publicEditionPath(row),aliases:row.data.aliases??[],kind:row.kind,
        revisionId:rev.id,revisionHash:rev.hash,sourceHash:rev.sourceHash,revisionCreatedAt:rev.createdAt,content:publicContent(rev.content)};
    });
    await writeFile(output+'/candidate-active.json',JSON.stringify(active));
    await writeFile(output+'/database-results.json',JSON.stringify({environment:'fresh isolated local PostgreSQL, Unix socket only; no development or production data',results,active:active.length},null,2));
  }finally{await pool.end();}
});
