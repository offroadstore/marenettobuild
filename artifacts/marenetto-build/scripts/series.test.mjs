import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { buildSeriesDrafts } from '../../../scripts/series-drafts.mjs';
import { readyVideo, seriesStructuredData, seriesLabels } from '../src/content/series-public.mjs';
import { render } from '../dist/server/entry-server.mjs';
import { mergeActiveMetadata } from '../src/localization/public-seo.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { seriesRelease } from '../src/content/series-release.mjs';
const historicalDrafts = await buildSeriesDrafts();
const drafts=historicalDrafts.map(d=>({...d,path:seriesRelease.records.find(r=>r.identity===d.identity&&r.locale===d.locale).path}));
// These are synthetic test values, never imported into the CMS or served publicly.
const video = {youtubeId:'TEST_ONLY01',title:'Synthetic test video',description:'Test fixture only',thumbnail:'/media/test-only.jpg',uploadDate:'2025-01-10',spokenLanguage:'it',author:'Synthetic test credit',rights:'Synthetic permission fixture',transcriptLanguage:'en',transcript:'Actual transcript fixture for automated tests only.',transcriptReviewed:true};
const edition = (draft, withVideo=false) => ({...draft,revisionId:'synthetic-active',
  revisionHash:seriesRelease.records.find(r=>r.identity===draft.identity&&r.locale===draft.locale)?.hash,
  sourceHash:seriesRelease.records.find(r=>r.identity===draft.identity&&r.locale===draft.locale)?.sourceHash,
  content:{...draft.content,guide:{...draft.content.guide,...(withVideo?{video}:{})}}});

test('120 complete internally approved editions, requested priority, separate sources and honest review states', () => {
  assert.equal(drafts.length,120);
  assert.deepEqual(drafts.slice(0,16).map(d=>`${d.content.guide.episode}:${d.locale}`),[1,4,8,10].flatMap(n=>['it','en','de','nl'].map(l=>`${n}:${l}`)));
  for(const d of drafts) {
    assert.ok(d.content.body.length>800,`${d.locale}:${d.content.guide.episode}`);
    assert.equal(d.content.contentLanguage,d.locale);
    assert.ok(d.content.guide.faq.length>=2);
    assert.equal(d.content.guide.technicalReview,'');
    assert.equal(d.content.guide.sourcesCurrent,false);
    assert.equal(d.content.guide.searchConsoleVerified,false);
    assert.equal(d.content.guide.reviewBasis,'ai-assisted-internal');
    assert.ok(d.content.guide.technicalNotice.includes('2025'));
    assert.ok(d.content.guide.documentaryReview.includes('not a professional opinion'));
    assert.match(d.content.image,/^\/api\/network-media\//);
    assert.equal(d.content.guide.video,undefined);
    assert.ok(d.content.body.includes('info@marenetto.com'));
    const path=d.content.guide.episode===10?(d.locale==='it'?'/arredi-su-misura':`/${d.locale}/bespoke-furniture`):(d.locale==='it'?'/area-servizi-edili':`/${d.locale}/local-building-area`);
    assert.ok(d.content.body.includes(`href="${path}"`));
  }
});
test('all historical purchase/pool URLs and identities are retained', async () => {
  const historical=JSON.parse(await readFile(new URL('../src/content/historical/index.json',import.meta.url),'utf8'));
  for(const d of drafts.filter(d=>[4,7].includes(d.content.guide.episode))) {
    const original=historical.find(h=>h.family.slice(1)===d.identity&&h.locale===d.locale);
    if(original) assert.equal(d.path,original.path);
  }
});
test('exact authorized active series can index without claiming Search Console ownership',()=>{
  const d=edition(drafts[0]);
  const [entry]=mergeActiveMetadata([{path:d.path,locale:d.locale,indexing:'allowed',sitemap:true}],[d]);
  assert.notEqual(entry.indexing,'never');
  assert.equal(entry.sitemap,true);
  assert.equal(d.content.guide.searchConsoleVerified,false);
});
test('placeholder has Article and visible FAQ schema, never fabricated VideoObject', () => {
  for(const d of drafts) {
    const schema=seriesStructuredData(edition(d),'https://example.invalid');
    assert.deepEqual(schema.map(s=>s['@type']),['Article','FAQPage']);
    assert.equal(schema[0].author.name,'Marenetto Build');
    assert.equal(schema[1].mainEntity.length,d.content.guide.faq.length);
    assert.equal(schema[0].datePublished,undefined);
  }
  assert.equal(readyVideo(video),true);
  for(const change of [{thumbnail:'https://i.ytimg.com/test.jpg'},{thumbnail:'/media/../private.jpg'},{transcript:''},{rights:''},{transcriptReviewed:false},{uploadDate:'2025-02-30'},{uploadDate:'2999-01-01'},{youtubeId:'" onclick="bad'}])
    assert.equal(readyVideo({...video,...change}),false);
  const graph=seriesStructuredData(edition(drafts[0],true),'https://example.invalid');
  assert.equal(graph[2]['@type'],'VideoObject');
  assert.equal(graph[2].duration,undefined);
  assert.equal(graph[2].embedUrl,'https://www.youtube-nocookie.com/embed/TEST_ONLY01');
  assert.equal(graph[2].inLanguage,'it');
});
test('SSR includes every language’s placeholder, FAQ, sources and mandatory final warning, without player',async()=>{
  for(const draft of drafts) {
    const {body}=await render(draft.path,draft.locale,[edition(draft)]);
    assert.ok(body.includes('series-video'),`${draft.locale}:${draft.path}`);
    assert.ok(body.includes(seriesLabels[draft.locale][1]));
    assert.ok(body.includes(seriesLabels[draft.locale][7]));
    assert.ok(!/<iframe[^>]*youtube|<img[^>]*(?:ytimg|youtube)|(?:preconnect|dns-prefetch)[^>]*youtube/.test(body));
    const escaped=draft.content.guide.faq[0].answer.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
    assert.ok(body.includes(escaped),`${draft.locale}:${draft.content.guide.episode}`);
    for(const s of draft.content.sources) assert.ok(body.includes(s.url.replaceAll('&','&amp;')));
  }
});
test('real video SSR preserves transcript and language without any video request', async()=>{
  const d=edition(drafts[0],true),{body}=await render(d.path,d.locale,[d]);
  assert.ok(body.includes(video.transcript));
  assert.match(body,/lang="en"/);
  assert.ok(!body.includes('youtube-nocookie.com'));
  assert.ok(!body.includes('<iframe'));
  const noVideo=await render(drafts[0].path,'it',[edition(drafts[0])]);
  assert.ok(!noVideo.body.includes('data-testid="series-video-consent"'));
});
test('the existing guide archive and series navigation link all ten actual active editions',async()=>{
  const active=drafts.map(d=>edition(d));
  for(const locale of ['it','en','de','nl','fr']){
    const peers=active.filter(d=>d.locale===locale);
    const path=locale==='it'?'/guide':`/${locale}/guides`;
    const archive=await render(path,locale,active);
    const detail=await render(peers[0].path,locale,active);
    assert.ok(detail.body.includes('data-testid="series-navigation"'));
    assert.ok((archive.body.match(/data-image-disclosure="ai-generated"/g)??[]).length>=10,`${locale}: individual image labels in guide archive`);
    for(const peer of peers){
      assert.ok(archive.body.includes(`href="${peer.path}"`),`${locale}: archive ${peer.path}`);
      assert.ok(detail.body.includes(`href="${peer.path}"`),`${locale}: series ${peer.path}`);
    }
  }
});
test('active series preserve native historical article cards and archive headings',async()=>{
  const active=drafts.map(d=>edition(d));
  const inventory=JSON.parse(await readFile(new URL('../src/content/historical/index.json',import.meta.url),'utf8'));
  const escape=value=>value.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  for(const locale of ['en','de','nl','fr']){
    const archive=inventory.find(p=>p.locale===locale&&p.family==='/articoli'&&p.state==='restored');
    const {body}=await render(archive.path,locale,active);
    assert.ok(body.includes(`>${escape(archive.h1)}</h1>`),`${locale}: native archive heading`);
    const unchanged=inventory.filter(p=>p.locale===locale&&p.kind==='article'&&p.state==='restored'&&!active.some(d=>d.identity===p.family.slice(1)&&d.locale===locale));
    assert.ok(unchanged.length>0);
    for(const original of unchanged){
      assert.ok(body.includes(escape(original.h1)),`${locale}: preserve ${original.path}`);
      assert.ok(body.includes(`href="${original.path}"`));
    }
  }
});
test('a real active snapshot does not change authored pillar metadata or indexing policy',async()=>{
  const active=drafts.map(d=>edition(d));
  const manifest=JSON.parse(await readFile(new URL('../dist/public/route-manifest.json',import.meta.url),'utf8'));
  const topology=await editorialTopology({snapshot:active,publicIndexing:true});
  try{
    for(const locale of ['it','en','de','nl','fr']){
      const pillar=Object.values(manifest.editions).find(e=>e.id==='pillar-villas'&&e.locale===locale);
      const response=await fetch(topology.origin+pillar.path,{headers:{'x-forwarded-host':'www.marenettobuild.com','x-forwarded-proto':'https'}});
      assert.equal(response.status,200);
      const html=await response.text();
      const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
      assert.ok(html.includes(`<title>${escape(pillar.title)}</title>`),`${locale}: authored title with active series`);
      assert.match(html,/<meta name="robots" content="index, follow"/);
      assert.equal(response.headers.get('x-robots-tag'),'index, follow');
    }
    const response=await fetch(topology.origin+active[0].path,{headers:{'x-forwarded-host':'www.marenettobuild.com','x-forwarded-proto':'https'}});
    const html=await response.text();
    assert.match(html,/<meta name="robots" content="index, follow"/);
    assert.ok(html.includes(seriesLabels.it[7]));
    assert.ok(!html.includes('<iframe'));
  }finally{await topology.close();}
});
test('old analytics choices never grant external media; media choice never changes other categories',async()=>{
  const bundle=await build({stdin:{contents:"export * from './src/lib/analytics/preferences'; export {LEGAL_VERSION} from './src/content/legal';",resolveDir:new URL('../',import.meta.url).pathname},bundle:true,write:false,platform:'node',format:'esm'});
  const {readPreferences,savePreferences,LEGAL_VERSION}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
  const at=Date.now(), old={schema:2,version:LEGAL_VERSION,at,statistics:true,marketing:true};
  assert.equal(readPreferences(JSON.stringify(old)).externalMedia,false);
  let raw;
  globalThis.localStorage={setItem(_k,v){raw=v;},getItem(){return raw;}};
  const saved=savePreferences(false,false,true);
  assert.deepEqual([saved.statistics,saved.marketing,saved.externalMedia],[false,false,true]);
  assert.equal(readPreferences(JSON.stringify({...saved,at:0})),null);
  assert.equal(readPreferences(JSON.stringify({...saved,externalMedia:'true'})),null);
  delete globalThis.localStorage;
});
