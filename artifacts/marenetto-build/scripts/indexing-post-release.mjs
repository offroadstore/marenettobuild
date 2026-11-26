// Read-only public verification. Never activates content or sends search-engine submissions.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { seriesRelease } from '../src/content/series-release.mjs';
const origin=process.argv[2],out=process.argv[3];
if(origin!=='https://www.marenettobuild.com'||!out?.startsWith('generated-artifacts/'))
  throw new Error('Usage: node scripts/indexing-post-release.mjs https://www.marenettobuild.com generated-artifacts/post-release-DATE');
await mkdir(out+'/raw',{recursive:true});
const startedAt=new Date().toISOString(),errors=[],rows=[];
const get=async path=>{
  const response=await fetch(origin+path,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(45000)});
  const body=await response.text();
  const file=createHash('sha256').update(path).digest('hex')+'.json.gz';
  await writeFile(out+'/raw/'+file,gzipSync(JSON.stringify({path,at:new Date().toISOString(),status:response.status,headers:Object.fromEntries(response.headers),body})));
  return {response,body};
};
const {response:sm,body:xml}=await get('/sitemap.xml');
assert.equal(sm.status,200);
const locations=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.equal(new Set(locations).size,locations.length);
const {response:api,body:json}=await get('/api/editorial/active');
assert.equal(api.status,200);
const active=JSON.parse(json);
for(const r of seriesRelease.records) {
  const edition=active.find(e=>e.identity===r.identity&&e.locale===r.locale&&e.path===r.path);
  if(!edition||edition.revisionId==='withdrawn'||edition.revisionHash!==r.hash||edition.sourceHash!==r.sourceHash)
    errors.push({path:r.path,error:'Revisione o sorgente attiva non coincidente: non forzare, confrontare nel CMS'});
  if(!locations.includes(origin+r.path))errors.push({path:r.path,error:'Edizione della serie assente dalla sitemap'});
}
const queue=[...locations];
await Promise.all(Array.from({length:3},async()=>{
  while(queue.length) {
    const url=queue.shift(),path=new URL(url).pathname;
    try {
      assert.equal(new URL(url).origin,origin);
      const {response,body}=await get(path);
      assert.equal(response.status,200);
      assert.match(body,/<meta\b[^>]*name="robots"[^>]*content="index, follow"/);
      assert.equal(response.headers.get('x-robots-tag'),'index, follow');
      assert.ok(body.includes(`rel="canonical" href="${url}"`));
      const alternates=[...body.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m=>({lang:m[1],url:m[2]}));
      assert.ok(alternates.every(a=>locations.includes(a.url)));
      const expected=seriesRelease.records.find(r=>r.path===path);
      if(expected) {
        const snapshot=JSON.parse(body.match(/<script type="application\/json" id="editorial-active">([\s\S]*?)<\/script>/)[1]);
        assert.ok(snapshot.some(e=>e.path===path&&e.revisionHash===expected.hash&&e.sourceHash===expected.sourceHash));
        assert.equal((body.match(/<h1\b/g)??[]).length,1);
      }
      rows.push({url,status:response.status,canonical:url,robots:'index, follow',alternates});
    }catch(error){errors.push({path,error:error.message});}
  }
}));
for(const row of rows)for(const a of row.alternates)
  if(!rows.find(r=>r.url===a.url)?.alternates.some(b=>b.url===row.url))errors.push({path:row.url,error:'hreflang non reciproco: '+a.url});
const before=JSON.parse(await readFile('generated-artifacts/indexing-recovery/live/sitemap.json','utf8')).locations;
const diff={added:locations.filter(u=>!before.includes(u)),removed:before.filter(u=>!locations.includes(u))};
if(diff.removed.length)errors.push({error:'URL della baseline mancanti',urls:diff.removed});
await writeFile(out+'/result.json',JSON.stringify({startedAt,finishedAt:new Date().toISOString(),origin,count:locations.length,
  expectedSeries:120,expectedHistorical:24,seriesDigest:seriesRelease.contentDigest,diff,errors,rows},null,2));
console.log(JSON.stringify({count:locations.length,checked:rows.length,errors,added:diff.added.length,removed:diff.removed.length},null,2));
assert.equal(errors.length,0);
