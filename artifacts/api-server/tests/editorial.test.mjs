import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { cleanBody, safeUrl, revision, transition, validateContent, publicContent, reviewedRevision } from '../src/lib/editorial-content.ts';
import { assertNetworkActivation, assertSeriesRelease, publicEditionPath } from '../src/lib/editorial-store.ts';
import catalog from 'marenetto-editorial-catalog';
const content = { title: 'Prova', summary: '', body: '<p>Testo</p>', category: '', tags: [], image: '', imageAlt: '', sources: [], seoTitle: '', seoDescription: '', contentLanguage: 'it' };
test('series public URLs preserve approved historical spelling without preventing deliberate URL edits',()=>{
  for(const seed of catalog.seriesDrafts) {
    const row={identity:seed.identity,locale:seed.locale,path:seed.path.replace(/\/+$/,'')};
    assert.equal(publicEditionPath(row),seed.path);
    assert.equal(publicEditionPath({...row,path:'/deliberately-changed'}),'/deliberately-changed');
  }
  assert.equal(publicEditionPath({identity:'unrelated',locale:'it',path:'/untouched'}),'/untouched');
});
test('owner series approval is bound to the complete exact release, not future text edits',()=>{
  assert.doesNotThrow(()=>assertSeriesRelease());
  const first=catalog.seriesDrafts[0].content;
  const title=first.title;
  try {
    first.title='Synthetic unapproved change';
    assert.throws(()=>assertSeriesRelease(),/non corrispondono alla consegna approvata/);
  } finally { first.title=title; }
});
test('series guides require real review records and Search Console account verification', () => {
  const guide={episode:1,faq:[],technicalReview:'',editorialReview:'',languageReview:'',sourcesCurrent:false,searchConsoleVerified:false};
  const make=updates=>{const rev=revision({...content,guide:{...guide,...updates}},'source','test');return {rev,data:{state:'review',activeRevisionId:null,historical:false,correction:false,revisions:[rev],events:[],originals:[]}};};
  let {rev,data}=make({});
  assert.throws(()=>transition(data,'approve',rev.id,'source','it','owner',true),e=>e.status===409);
  ({rev,data}=make({technicalReview:'Synthetic reviewer evidence',editorialReview:'Synthetic evidence',languageReview:'Synthetic evidence',sourcesCurrent:true}));
  transition(data,'approve',rev.id,'source','it','owner',true);
  assert.throws(()=>transition(data,'activate',rev.id,'source','it','owner',true),e=>e.status===409);
  assert.throws(()=>validateContent({...content,guide,body:'<img src=https://i.ytimg.com/vi/test/a.jpg>'},['it']));
  assert.throws(()=>validateContent({...content,guide:{...guide,video:{thumbnail:'https://i.ytimg.com/fake.jpg'}}},['it']));
  const privateContent={...content,guide:{...guide,technicalReview:'Private reviewer note',editorialReview:'Private note',languageReview:'Private language note'}};
  assert.equal(publicContent(privateContent).guide.technicalReview,'');
  assert.equal(privateContent.guide.technicalReview,'Private reviewer note');
  assert.equal(reviewedRevision(privateContent,{...privateContent,title:'New text'}).guide.technicalReview,'');
  assert.equal(reviewedRevision(privateContent,{...privateContent,guide:{...privateContent.guide,editorialReview:'New actual review'}}).guide.technicalReview,'Private reviewer note');
  assert.throws(()=>reviewedRevision(privateContent,content));
});
test('HTML and URLs reject executable/private payloads while preserving text', () => {
  const html = cleanBody('<p onclick="alert(1)">OK<script>alert(2)</script><a href="javascript:alert(1)">link</a><img src="/api/internal/files/secret" onerror="alert(3)"></p>');
  assert.ok(html.includes('OK'));
  assert.doesNotMatch(html, /onclick|onerror|javascript:|<script|secret/);
  for (const url of ['javascript:alert(1)', '//evil.test/x', '/api/internal/x', 'https://x.test/private/x', 'https://x.test/x?X-Goog-Signature=abc', 'https://user:pass@x.test/x']) assert.equal(safeUrl(url,true),false,url);
  assert.equal(safeUrl('/media/articles/test.jpg',true),true);
});
test('assisted internal review permits owner activation without inventing professional or Search Console verification', () => {
  const guide={episode:1,faq:[],technicalReview:'',editorialReview:'AI-assisted fixture',languageReview:'AI-assisted fixture',sourcesCurrent:false,searchConsoleVerified:false,
    reviewBasis:'ai-assisted-internal',documentaryReview:'Dated documentary fixture, not current-law certification',technicalHeading:'Da verificare con il tecnico incaricato',technicalNotice:'Later amendments and case applicability must be checked.',reviewDisclosure:'AI-assisted, not professional sign-off'};
  const rev=revision({...content,guide},'source','synthetic-test');
  const data={state:'review',activeRevisionId:null,historical:false,correction:false,revisions:[rev],events:[],originals:[]};
  transition(data,'approve',rev.id,'source','it','owner',true);
  transition(data,'activate',rev.id,'source','it','owner',true);
  assert.equal(data.activeRevisionId,rev.id);
  assert.equal(rev.content.guide.searchConsoleVerified,false);
  assert.equal(rev.content.guide.technicalReview,'');
  assert.equal(publicContent(rev.content).guide.documentaryReview,'');
  const changed=reviewedRevision(rev.content,{...rev.content,title:'Changed fixture'});
  assert.equal(changed.guide.documentaryReview,'');
  const next=revision(changed,'source','synthetic-test');
  assert.throws(()=>transition({...data,state:'review',revisions:[next]},'approve',next.id,'source','it','owner',true),e=>e.status===409);
});
test('network assets remain illustrative allowlisted media, not arbitrary private object access', () => {
  const src = '/api/network-media/comfort-0-0123456789abcdef-800.webp';
  assert.equal(safeUrl(src, true), true);
  assert.match(cleanBody(`<figure><img src="${src}" alt="Illustrazione" width="800" height="450" loading="lazy"><figcaption>Generata con IA</figcaption></figure>`), /width="800" height="450"/);
  assert.equal(safeUrl('/api/internal/files/original.jpg', true), false);
});
test('all 156 native network seeds preserve holds and require the exact reviewed revision', () => {
  const seeds = catalog.records.filter(seed => seed.identity.startsWith('network-'));
  assert.equal(seeds.length, 156);
  for (const seed of seeds) {
    const row = { identity: seed.identity, locale: seed.locale, path: seed.path };
    const sanitized = { ...seed.content, body: cleanBody(seed.content.body) };
    assert.equal(seed.releaseReady, seed.locale === 'ar');
    if (seed.locale === 'ar') assert.doesNotThrow(() => assertNetworkActivation(row, sanitized));
    else assert.throws(() => assertNetworkActivation(row, sanitized), error => error.status === 409);
    assert.throws(() => assertNetworkActivation(row, { ...sanitized, summary: sanitized.summary + ' changed' }), error => error.status === 409);
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
      const seriesRows=importedRows.filter(row=>row.data.revisions.some(rev=>rev.content.guide));
      assert.equal(seriesRows.length,120);
      const releaseEvent=`${catalog.seriesRelease.id}:${catalog.seriesRelease.contentDigest}`;
      assert.ok(seriesRows.every(row=>row.data.events.filter(e=>e.action===releaseEvent).length===1),'owner release is idempotent');
      const publicSeries=(await request('/editorial/active')).data.filter(row=>row.content.guide);
      assert.equal(publicSeries.length,120,'only the hash-bound owner-approved release enters the public snapshot');
      assert.ok(publicSeries.every(row=>row.content.guide.technicalReview==='' && row.content.guide.documentaryReview==='' && row.content.guide.searchConsoleVerified===false));
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
