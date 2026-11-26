import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { seriesRelease } from '../src/content/series-release.mjs';
import { releaseReadiness } from './release-readiness.mjs';
import { commercialRecord } from '../src/content/commercial-release.mjs';
const out='generated-artifacts/indexing-recovery';
const active=JSON.parse(await readFile(out+'/candidate-active.json','utf8'));
const manifest=JSON.parse(await readFile(new URL('../dist/public/route-manifest.json',import.meta.url),'utf8'));
const live=JSON.parse(await readFile(out+'/live/baseline.json','utf8'));
const before=JSON.parse(await readFile(out+'/live/sitemap.json','utf8'));
const observed=JSON.parse(await readFile(out+'/live/observed-active.json','utf8'));
const origin='https://www.marenettobuild.com';
const headers={'x-forwarded-host':'www.marenettobuild.com','x-forwarded-proto':'https'};
const sha=s=>createHash('sha256').update(s).digest('hex');
const decode=s=>s.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&#x27;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replace(/\s+/g,' ').trim();
const csv=rows=> {
  const columns=[...new Set(rows.flatMap(Object.keys))];
  return '\uFEFF'+[columns,...rows.map(r=>columns.map(k=>typeof r[k]==='object'?JSON.stringify(r[k]):r[k]??''))].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
};
await mkdir(out+'/candidate/raw',{recursive:true});
await writeFile(out+'/candidate/active-snapshot.json',JSON.stringify(active));
const topology=await editorialTopology({snapshot:active,publicIndexing:true});
const results=[],failures=[],localLinks=new Set(),seoExceptions=[];
let locations, xml;
const checkedAt=new Date().toISOString();
try {
  const ready=await fetch(topology.origin+'/__release-readiness');
  assert.equal(ready.status,200);assert.equal((await ready.json()).ready,true);
  assert.equal(releaseReadiness(manifest,[]).ready,false);
  const response=await fetch(topology.origin+'/sitemap.xml',{headers});
  xml=await response.text();
  locations=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.equal(new Set(locations).size,locations.length);
  await writeFile(out+'/candidate/sitemap.xml',xml);
  const queue=[...locations];
  await Promise.all(Array.from({length:4},async()=>{
    while(queue.length) {
      const url=queue.shift(),path=new URL(url).pathname;
      try {
        const response=await fetch(topology.origin+path,{headers,redirect:'manual'});
        const html=await response.text();
        const id=sha(path);
        // Preserve exact response bytes and headers, not reconstructed metadata.
        await writeFile(`${out}/candidate/raw/${id}.json.gz`,gzipSync(JSON.stringify({path,status:response.status,headers:Object.fromEntries(response.headers),body:html})));
        const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1];
        const robots=html.match(/<meta\b[^>]*name="robots"[^>]*content="([^"]*)"/)?.[1];
        const title=decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]??'');
        const description=decode(html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/)?.[1]??'');
        const alternates=[...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m=>({lang:m[1],url:m[2]}));
        assert.equal(response.status,200,path);assert.equal(canonical,url,path);
        assert.equal(robots,'index, follow',path);assert.equal(response.headers.get('x-robots-tag'),'index, follow',path);
        assert.ok(alternates.every(a=>locations.includes(a.url)),path);
        const record=seriesRelease.records.find(r=>r.path===path);
        let series={};
        if(record) {
          const edition=active.find(r=>r.path===path);
          const presentation=commercialRecord(edition)?.presentation;
          const expected=presentation?.body??edition.content.body;
          const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]??'';
          assert.equal((main.match(/<h1\b/g)??[]).length,1,path);
          // The renderer inserts the mandatory per-image AI label between
          // approved body blocks. Check every authored block, not a contiguous
          // text string that would wrongly reject the extra disclosure.
          for(const block of expected.matchAll(/<(p|h[1-6]|li|figcaption)\b[^>]*>([\s\S]*?)<\/\1>/g))
            assert.ok(decode(main).includes(decode(block[2])),`Approved body block ${path}: ${decode(block[2]).slice(0,60)}`);
          assert.equal(edition.revisionHash,record.hash,path);assert.equal(edition.sourceHash,record.sourceHash,path);
          const graphs=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']??[]);
          assert.equal(graphs.filter(g=>g['@type']==='Article').length,1,path);
          const faq=graphs.filter(g=>g['@type']==='FAQPage');
          assert.equal(faq.length,1,path);
          for(const q of edition.content.guide.faq) assert.ok(decode(main).includes(decode(q.question))&&decode(main).includes(decode(q.answer)),path);
          for(const img of main.matchAll(/<img\b[^>]*>/g))assert.match(img[0],/alt="[^"]+"/,path);
          for(const a of main.matchAll(/href="([^"]*)"/g))if(a[1].startsWith('/'))localLinks.add(decode(a[1]).split('?')[0]);
          if([...title].length<50||[...title].length>60||[...description].length<140||[...description].length>160)
            seoExceptions.push({path,title,description,titleCharacters:[...title].length,descriptionCharacters:[...description].length,
              reason: [
                ...([...title].length<50?['Titolo localizzato conciso: mantiene l’argomento senza aggiungere parole di riempimento.']:[]),
                ...([...title].length>60?['Titolo completo: preserva la distinzione tra istituti, ambiti o verifiche; non si tronca una qualificazione sostanziale.']:[]),
                ...([...description].length<140?['Descrizione approvata breve ma compiuta: conserva la cautela specifica senza aggiungere affermazioni nuove o ripetizioni.']:[]),
                ...([...description].length>160?['Frase approvata completa: non si elimina la cautela per una quota di visualizzazione.']:[]),
              ].join(' ')});
          series={episode:record.episode,identity:record.identity,locale:record.locale,revisionId:edition.revisionId,revisionHash:record.hash,
            italianSourceHash:record.sourceHash,authorization:seriesRelease.id,active:true,indexable:true,bodyVerified:true,faqVerified:true,h1:1};
        }
        results.push({path,url,http:response.status,robots,headerRobots:response.headers.get('x-robots-tag'),canonical,title,description,
          titleCharacters:[...title].length,descriptionCharacters:[...description].length,alternates,
          raw:`candidate/raw/${id}.json.gz`,htmlSHA256:sha(html),...series});
      }catch(error){failures.push({path,error:error.message});}
    }
  }));
  for(const row of results) for(const alt of row.alternates) {
    const peer=results.find(r=>r.url===alt.url);
    if(!peer?.alternates.some(a=>a.url===row.url)) failures.push({path:row.path,error:`hreflang non reciproco ${alt.url}`});
  }
  for(const link of localLinks) {
    const response=await fetch(topology.origin+link,{headers,redirect:'manual'});
    if(![200,308].includes(response.status))failures.push({path:link,error:`link HTTP ${response.status}`});
    await response.body?.cancel();
  }
  const edition=active[0],saved=structuredClone(edition);
  Object.assign(edition,{revisionId:'withdrawn'});
  assert.equal((await fetch(topology.origin+edition.path,{headers})).status,404);
  assert.equal((await fetch(topology.origin+'/__release-readiness')).status,503);
  Object.assign(edition,saved);
  topology.setMode('connection');await topology.restart();
  const outage=await fetch(topology.origin+edition.path,{headers});
  assert.equal(outage.status,503);assert.equal(outage.headers.get('x-robots-tag'),'noindex, nofollow');
  assert.equal((await fetch(topology.origin+'/sitemap.xml',{headers})).status,503);
  assert.equal((await fetch(topology.origin+'/__release-readiness')).status,503);
  topology.setMode('available');
  assert.equal((await fetch(topology.origin+'/__release-readiness')).status,200);
}finally{await topology.close();}
const series=results.filter(r=>r.episode);
const historical=series.filter(r=>[4,7].includes(r.episode));
const compare=rows=>rows.map(r=>({...r,before:live.rows.find(b=>b.path===r.path),
  beforeRevisionId:observed.find(e=>e.path===r.path)?.revisionId??'',
  beforeRevisionHash:observed.find(e=>e.path===r.path)?.revisionHash??'non esposto dalla vecchia API',
  beforeSitemap:before.locations.includes(r.url),afterSitemap:true}));
const prior=new Set(before.locations),after=new Set(locations);
const diff={added:locations.filter(u=>!prior.has(u)),removed:before.locations.filter(u=>!after.has(u))};
const duplicates=key=>Object.entries(Object.groupBy(series,r=>r[key])).filter(([,v])=>v.length>1).map(([value,rows])=>({value,paths:rows.map(r=>r.path)}));
if(duplicates('title').length||duplicates('description').length)failures.push({error:'Metadati duplicati nelle 120 edizioni',titles:duplicates('title'),descriptions:duplicates('description')});
await writeFile(out+'/candidate/inventory.csv',csv(results));
await writeFile(out+'/series-before-after.csv',csv(compare(series)));
await writeFile(out+'/historical-before-after.csv',csv(compare(historical)));
await writeFile(out+'/seo-length-exceptions.json',JSON.stringify(seoExceptions,null,2));
const audit={checkedAt,revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  environment:'production HTTP process with explicit WWW HTTPS public indexing and real isolated PostgreSQL activation snapshot; not production database',
  seriesDigest:seriesRelease.contentDigest,liveSitemap:before.locations.length,candidateSitemap:locations.length,
  passed:results.length,series:series.length,historical:historical.length,realNewSeries:series.filter(r=>![4,7].includes(r.episode)).length,
  diff,failures,seoExceptions:seoExceptions.length,results};
await writeFile(out+'/candidate/audit.json',JSON.stringify(audit,null,2));
console.log(JSON.stringify({...audit,results:undefined,diff:{added:diff.added.length,removed:diff.removed.length}},null,2));
assert.equal(failures.length,0);assert.equal(series.length,120);assert.equal(historical.length,24);
assert.equal(diff.removed.length,0);assert.ok(locations.length>=930);
