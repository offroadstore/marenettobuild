import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { cleanBody, safeUrl, revision, transition } from '../src/lib/editorial-content.ts';
import { assertNetworkActivation } from '../src/lib/editorial-store.ts';
import catalog from 'marenetto-editorial-catalog';
const content = { title: 'Prova', summary: '', body: '<p>Testo</p>', category: '', tags: [], image: '', imageAlt: '', sources: [], seoTitle: '', seoDescription: '', contentLanguage: 'it' };
test('HTML and URLs reject executable/private payloads while preserving text', () => {
  const html = cleanBody('<p onclick="alert(1)">OK<script>alert(2)</script><a href="javascript:alert(1)">link</a><img src="/api/internal/files/secret" onerror="alert(3)"></p>');
  assert.ok(html.includes('OK'));
  assert.doesNotMatch(html, /onclick|onerror|javascript:|<script|secret/);
  for (const url of ['javascript:alert(1)', '//evil.test/x', '/api/internal/x', 'https://x.test/private/x', 'https://x.test/x?X-Goog-Signature=abc', 'https://user:pass@x.test/x']) assert.equal(safeUrl(url,true),false,url);
  assert.equal(safeUrl('/media/articles/test.jpg',true),true);
});
test('network assets remain illustrative allowlisted media, not arbitrary private object access', () => {
  const src = '/api/network-media/comfort-0-0123456789abcdef-800.webp';
  assert.equal(safeUrl(src, true), true);
  assert.match(cleanBody(`<figure><img src="${src}" alt="Illustrazione" width="800" height="450" loading="lazy"><figcaption>Generata con IA</figcaption></figure>`), /width="800" height="450"/);
  assert.equal(safeUrl('/api/internal/files/original.jpg', true), false);
});
test('all 144 native network seeds require exact additional checks before activation', () => {
  const seeds = catalog.records.filter(seed => seed.identity.startsWith('network-'));
  assert.equal(seeds.length, 144);
  for (const seed of seeds) {
    assert.equal(seed.releaseReady, false);
    assert.throws(() => assertNetworkActivation({ identity: seed.identity, locale: seed.locale, path: seed.path }, seed.content), error => error.status === 409);
  }
  assert.doesNotThrow(() => assertNetworkActivation({ identity: 'unrelated-cms-entry' }, content));
});
test('exact-revision owner approval, source changes and draft/active isolation', () => {
  const rev = revision(content, 'source-one', 'test-owner');
  const data = { state: 'draft', activeRevisionId: null, historical: false, correction: false, revisions: [rev], events: [], originals: [] };
  transition(data,'submit',rev.id,'source-one','it','editor',false);
  assert.throws(() => transition(data,'approve',rev.id,'source-one','it','editor',false),e => e.status === 403);
  transition(data,'approve',rev.id,'source-one','it','owner',true);
  assert.throws(() => transition(data,'activate',rev.id,'source-two','it','owner',true),e => e.status === 409);
  transition(data,'activate',rev.id,'source-one','it','owner',true);
  const active = data.activeRevisionId;
  const draft = revision({ ...content, title: 'Bozza nuova' },'source-one','editor');
  data.revisions.push(draft); data.state='draft';
  assert.equal(data.activeRevisionId,active);
  transition(data,'restore',rev.id,'source-one','it','editor',false);
  assert.equal(data.activeRevisionId,active);
  assert.notEqual(data.revisions.at(-1).id,rev.id);
  assert.deepEqual(data.revisions.at(-1).content,rev.content);
});
test('foreign editions containing Italian cannot gain a language approval', () => {
  const rev = revision(content,'source','editor');
  const data = { state: 'review', activeRevisionId: null, historical: true, correction: false, revisions: [rev], events: [], originals: [] };
  assert.throws(() => transition(data,'approve',rev.id,'source','ar','owner',true),e => e.status === 409);
});
test('owner can retire the existing catalog without approving a new composition', () => {
  const original=revision(content,'source','import');
  const data={state:'draft',activeRevisionId:null,historical:true,correction:false,revisions:[original],events:[{action:'import',revisionId:original.id,actor:'import',at:original.createdAt,hash:original.hash,sourceHash:'source'}],originals:[]};
  transition(data,'withdraw',original.id,'source','it','owner',true);
  assert.equal(data.withdrawn,true);
  assert.equal(data.events.at(-1).action,'withdraw');
  assert.equal(data.events.at(-1).revisionId,original.id);
  assert.throws(()=>transition(data,'withdraw',original.id,'source','it','owner',true),e=>e.status===409);
});

// This route import is replaced ONLY by the isolated test runner, never by the
// application build. No real Clerk identity, email or publication is involved.
if (process.env.EDITORIAL_HTTP_TEST === 'true') {
  const express = (await import('express')).default;
  const router = (await import('../src/routes/editorial.ts')).default;
  const { pool } = await import('@workspace/db');
  const { allRows, detail } = await import('../src/lib/editorial-store.ts');
  const { GetEditorialResponse } = await import('@workspace/api-zod');
  const app = express(); app.use(express.json({limit:'1mb'})); app.use((req,_res,next) => { req.log={error(){}}; next(); }); app.use('/api',router);
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const identity = `synthetic-editorial-${randomUUID()}`;
  const ids=[];
  const request = async (path, role='owner', method='GET', data) => {
    const res = await fetch(base+path,{method,headers:{'content-type':'application/json','x-test-role':role},body:data===undefined?undefined:JSON.stringify(data)});
    return {status:res.status,data:await res.json()};
  };
  test('API import, roles, conflicts, approval/activation, RTL, withdraw and restore persist', async () => {
    try {
      assert.equal((await request('/internal/editorial','anonymous')).status,401);
      const first = await request('/internal/editorial');
      assert.equal(first.status,200);
      assert.equal((await request('/internal/editorial')).data.length,first.data.length);
      const importedRows = await allRows();
      for (const imported of importedRows) assert.doesNotThrow(() => GetEditorialResponse.parse(detail(imported,importedRows)), `${imported.identity}:${imported.locale}`);
      const input={identity,locale:'it',path:`/${identity}`,kind:'article',content};
      assert.equal((await request('/internal/editorial','viewer','POST',input)).status,403);
      let created=await request('/internal/editorial','editor','POST',input);
      assert.equal(created.status,201); let row=created.data; ids.push(row.id);
      assert.equal((await request('/internal/editorial','editor','POST',input)).status,409);
      const call = async (action,role='owner') => request(`/internal/editorial/${row.id}/action`,role,'POST',{version:row.version,revisionId:row.revisions.at(-1).id,action});
      const saved = await request(`/internal/editorial/${row.id}`,'editor','PUT',{version:row.version,content:{...content,title:'Persistente'}});
      assert.equal(saved.status,200);
      assert.equal((await request(`/internal/editorial/${row.id}`,'editor','PUT',{version:row.version,content})).status,409);
      row=saved.data;
      row=(await call('submit','editor')).data;
      assert.equal((await call('approve','editor')).status,403);
      row=(await call('approve')).data;
      const oldGates = ['MARENETTO_PRIVACY_APPROVED','MARENETTO_PROVIDERS_APPROVED','MARENETTO_TESTING_APPROVED'].map(key => [key,process.env[key]]);
      try {
        delete process.env.MARENETTO_PRIVACY_APPROVED;
        assert.equal((await call('activate')).status,503);
        // Isolated, in-process route test only. These flags never reach workflows.
        for (const [key] of oldGates) process.env[key]='true';
        row=(await call('activate')).data;
        assert.equal(row.state,'active');
        let active=(await request('/editorial/active')).data.find(e=>e.identity===identity);
        assert.equal(active.content.title,'Persistente');
        const rtl=await request('/internal/editorial','editor','POST',{...input,locale:'ar',path:`/ar/${identity}`,content:{...content,contentLanguage:'ar',title:'اختبار',body:'<p dir="rtl">نص للاختبار</p>'}});
        assert.equal(rtl.status,201); ids.push(rtl.data.id);
        const translatedId=rtl.data.id;
        const draft=await request(`/internal/editorial/${row.id}`,'editor','PUT',{version:row.version,content:{...content,title:'Nuova sorgente'}});
        row=draft.data;
        assert.equal((await request(`/internal/editorial/${translatedId}`)).data.stale,true);
        active=(await request('/editorial/active')).data.find(e=>e.identity===identity && e.locale==='it');
        assert.equal(active.content.title,'Persistente');
        assert.equal((await request(`/internal/editorial/${row.id}`)).data.revisions.at(-1).content.title,'Nuova sorgente');
        row=(await call('withdraw')).data;
        assert.equal((await request('/editorial/active')).data.find(e=>e.identity===identity && e.locale==='it').revisionId,'withdrawn');
        row=(await call('restore','editor')).data;
        assert.equal(row.state,'draft'); assert.equal(row.activeRevisionId,null);
      } finally { for (const [key,value] of oldGates) { if(value===undefined) delete process.env[key]; else process.env[key]=value; } }
    } finally {
      await pool.query('DELETE FROM editorial_editions WHERE identity=$1',[identity]);
      server.close(); await pool.end();
    }
  });
}
