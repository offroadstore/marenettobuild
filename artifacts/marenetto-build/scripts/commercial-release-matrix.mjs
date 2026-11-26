import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {editorialTopology} from './test-support/editorial-topology.mjs';
import {publicEditions,releaseSitemap} from './public-release.mjs';
import {commercialEntries,commercialFAQ} from '../src/content/commercial-release.mjs';

const workspace=path.resolve(import.meta.dirname,'../../..');
const out=path.join(workspace,'generated-artifacts/editorial/release-2026-11');
const json=async file=>JSON.parse(await readFile(file,'utf8'));
const pack=await json(path.join(out,'package.json'));
const active=await json(path.join(out,'candidate-active.json'));
const manifest=await json(new URL('../dist/public/route-manifest.json',import.meta.url));
const checksum=value=>createHash('sha256').update(value).digest('hex');
const hash=value=>checksum(JSON.stringify(value));
const text=html=>html.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&#x27;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
const count=s=>[...s].length;
const headers={'x-forwarded-host':'www.marenettobuild.com','x-forwarded-proto':'https'};
const source=await json(path.join(out,'candidate-activation.json'));
assert.equal(active.length,290); assert.equal(commercialEntries(active).length,182);
assert.equal(source.rootSHA256,pack.rootSHA256);
assert.equal(new Set(pack.records.map(r=>r.identity)).size,14);
assert.equal(new Set(pack.records.map(r=>r.path)).size,182);
assert.equal(new Set(pack.records.map(r=>(r.presentation??r.content).seoTitle)).size,182);
const eligible=publicEditions(manifest,active);
const sitemap=releaseSitemap(eligible);
const baseline=publicEditions(manifest,active.filter(e=>e.content.tags.includes('serie-cefalu-madonie')));
const affectedPaths=new Set(pack.records.map(r=>r.path.replace(/\/+$/,'')));
const unaffected=baseline.filter(r=>!affectedPaths.has(r.path.replace(/\/+$/,'')));
for(const before of unaffected) {
  const after=eligible.find(r=>r.path===before.path);
  assert.deepEqual(after,before,`Metadati estranei cambiati: ${before.path}`);
}
await mkdir(path.join(out,'html-evidence'),{recursive:true});
const server=await editorialTopology({snapshot:active,publicIndexing:true});
const rows=[],evidence=[],localLinks=new Set(),failures=[];
try {
  for(const r of pack.records) {
    try {
      const response=await fetch(server.origin+r.canonicalPath,{headers,redirect:'error'});
      const html=await response.text();
      assert.equal(response.status,200,r.path);
      const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
      assert.ok(main,'main');
      const title=text(html.match(/<title>([\s\S]*?)<\/title>/)[1]);
      const description=text(html.match(/<meta name="description" content="([^"]*)"/)[1]);
      const h1=[...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(m=>text(m[1]));
      assert.equal(title,(r.presentation??r.content).seoTitle);assert.equal(description,(r.presentation??r.content).seoDescription);
      assert.ok(count(title)>=30&&count(title)<=65);assert.ok(count(description)>=70&&count(description)<=165);
      assert.deepEqual(h1,[r.content.title]);assert.ok(main.includes(r.readOnlySeries?'data-testid="technical-notice"':'id="release-technical-notice"'));
      assert.ok(/WhatsApp|واتساب/.test(main));assert.ok(main.includes('<figcaption>'));
      const alts=[...main.matchAll(/<img\b[^>]*alt="([^"]*)"/g)].map(m=>text(m[1]));
      assert.ok(alts.length>0&&alts.every(Boolean));
      const alternates=[...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m=>[m[1],text(m[2])]);
      assert.equal(alternates.length,14,'13 lingue e x-default');
      for(const peer of pack.records.filter(s=>s.identity===r.identity)) assert.ok(alternates.some(([lang,url])=>lang===(peer.locale==='it'?'it-IT':peer.locale)&&url==='https://www.marenettobuild.com'+peer.canonicalPath));
      assert.ok(html.includes(`rel="canonical" href="https://www.marenettobuild.com${r.canonicalPath}"`));
      assert.ok(html.includes('name="robots" content="index, follow"'));
      assert.ok(sitemap.includes(`<loc>https://www.marenettobuild.com${r.canonicalPath}</loc>`));
      const graph=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])['@graph']??[]);
      for(const type of ['Article','FAQPage','BreadcrumbList']) assert.equal(graph.filter(s=>s['@type']===type).length,1,`Schema ${type}`);
      const article=graph.find(s=>s['@type']==='Article');
      assert.equal(article.author.name,'Marenetto Build');assert.equal(article.inLanguage,r.locale);
      assert.equal(article.dateCreated,r.preparedAt);assert.ok(article.dateModified);
      const faq=graph.find(s=>s['@type']==='FAQPage').mainEntity;
      assert.deepEqual(faq.map(f=>[f.name,f.acceptedAnswer.text]),commercialFAQ(r.presentation?.body??r.content.body,r.presentation?.faq).map(f=>[f.question,f.answer]));
      assert.equal(faq.length,r.faq.length);
      const crumbs=graph.find(s=>s['@type']==='BreadcrumbList').itemListElement;
      assert.equal(crumbs.length,3);assert.equal(crumbs[2].item,'https://www.marenettobuild.com'+r.canonicalPath);
      const links=[...main.matchAll(/href="([^"]*)"/g)].map(m=>text(m[1]));
      assert.ok(!links.some(h=>/^(?:mailto:|tel:)/.test(h)),'Nessuna seconda richiesta commerciale nel contenuto');
      const request=links.filter(h=>h.includes('source=editorial-2026-11-26'));
      assert.equal(request.length,1,'Una CTA nel contenuto');
      assert.equal(new URL(request[0],'https://www.marenettobuild.com').searchParams.get('article'),r.identity);
      for(const href of links.filter(h=>h.startsWith('#'))) assert.ok(main.includes(`id="${href.slice(1)}"`),`Ancora ${href}`);
      for(const href of links.filter(h=>h.startsWith('/'))) localLinks.add(href.split('?')[0]);
      const dir=html.match(/<html[^>]*dir="([^"]*)"/)[1];
      assert.equal(dir,r.locale==='ar'?'rtl':'ltr');
      const receipt=source.report.find(s=>s.identity===r.identity&&s.locale===r.locale);
      assert.equal(receipt.hash,hash(r.content));
      rows.push({
        identity:r.identity,area:r.area,locale:r.locale,url:'https://www.marenettobuild.com'+r.canonicalPath,
        candidate:r.readOnlySeries?'active-retained-series-tested-isolated':'active-tested-isolated',
        public:r.readOnlySeries?'retained-series-public-status-not-rechecked':'not-released-by-this-task',
        urlStatus:r.mode==='revise-existing'?'existing-preserved':r.locale!=='ar'&&r.content.tags.includes('secondary-guide')?'existing-guide-candidate-preserved':'new-candidate-url',
        revisionId:receipt.revisionId,hash:receipt.hash,italianSourceHash:receipt.sourceHash,presentationHash:r.presentationSHA256??'',retainedSeries:Boolean(r.readOnlySeries),
        review:'AI-assisted; not native/professional',authorization:'owner-declared 2026-11-26; isolated synthetic transitions',
        title,titleCharacters:count(title),description,descriptionCharacters:count(description),h1:h1[0],h1Count:h1.length,
        alts:alts.join(' | '),articleSchema:1,faqSchema:1,faqVisible:faq.length,breadcrumbSchema:1,
        canonical:'https://www.marenettobuild.com'+r.canonicalPath,hreflang:alternates.length,sitemapExpected:true,
        localLinks:links.filter(h=>h.startsWith('/')).join(' | '),illustration:'AI-authored original schematic; localized caption and AI label',
        bodySHA256:checksum(main),htmlSHA256:checksum(html),http:response.status,direction:dir,
      });
      const rawHead=html.slice(html.indexOf('<head>'),html.indexOf('</head>')+7);
      const sharedSnapshot=rawHead.match(/<script type="application\/json" id="editorial-active">([\s\S]*?)<\/script>/);
      assert.ok(sharedSnapshot);
      const snapshotSHA256=checksum(sharedSnapshot[1]);
      if(evidence.length===0) await writeFile(path.join(out,'shared-active-snapshot.json'),sharedSnapshot[1]);
      else assert.equal(snapshotSHA256,evidence[0].snapshotSHA256);
      evidence.push({identity:r.identity,locale:r.locale,headers:Object.fromEntries(response.headers),
        head:rawHead.replace(sharedSnapshot[0],`<!-- exact shared-active-snapshot.json; SHA256 ${snapshotSHA256} -->`),
        rawHeadSHA256:checksum(rawHead),snapshotSHA256,graph,links,bodySHA256:checksum(main)});
      if(['it','de','ar'].includes(r.locale)&&r.identity===pack.records[0].identity) await writeFile(path.join(out,'html-evidence',r.locale+'.html'),html);
    }catch(error){failures.push({identity:r.identity,locale:r.locale,path:r.path,error:error.stack});}
  }
  for(const href of localLinks) {
    const response=await fetch(server.origin+href,{headers,redirect:'manual'});
    if(![200,301,308].includes(response.status)) failures.push({link:href,status:response.status});
    await response.body?.cancel();
  }
  const renderer=await import('../dist/server/entry-server.mjs');
  const archives=[];
  for(const locale of [...new Set(pack.records.map(r=>r.locale))]) {
    const libraryPath=locale==='it'?'/guide':`/${locale}/guides`;
    const {body}=await renderer.render(libraryPath,locale,active);
    for(const r of pack.records.filter(r=>r.locale===locale)) {
      if(locale==='ar'){assert.ok(body.includes(`href="${r.canonicalPath}"`));continue;}
      const tag=body.match(new RegExp(`<a\\b[^>]*data-testid="card-guide-${r.identity}"[^>]*>`))?.[0];
      assert.ok(tag,`Guida nell’archivio ${locale}/${r.identity}`);
      assert.ok(tag.includes(`href="${r.canonicalPath}"`),`Indirizzo canonico della guida ${locale}/${r.identity}`);
    }
    assert.ok(!/src=""/.test(body));
    archives.push({locale,path:libraryPath,authorizedGuides:14,canonicalDestinations:true,noEmptyImages:true});
  }
  await writeFile(path.join(out,'guide-archive-evidence.json'),JSON.stringify({
    scope:'All thirteen local guide archives expose all fourteen active authorized families',
    archives,
  },null,2));
  // Withdrawal and cold-start failure are tested using the actual HTTP server.
  const savedIndex=active.findIndex(e=>e.identity===pack.records[0].identity&&e.locale===pack.records[0].locale);
  const saved=structuredClone(active[savedIndex]);
  active[savedIndex]={...saved,revisionId:'withdrawn',content:{...saved.content,title:'withdrawn',body:''}};
  const savedCanonical=pack.records.find(r=>r.identity===saved.identity&&r.locale===saved.locale).canonicalPath;
  const withdrawn=await fetch(server.origin+savedCanonical,{headers,redirect:'error'});
  assert.equal(withdrawn.status,404);assert.ok(!(await withdrawn.text()).includes('id="release-request"'));
  const withdrawnSitemap=releaseSitemap(publicEditions(manifest,active));
  assert.ok(!withdrawnSitemap.includes(`<loc>https://www.marenettobuild.com${savedCanonical}</loc>`));
  Object.assign(active[savedIndex],saved);
  server.setMode('connection');
  await server.restart();
  const outage=await fetch(server.origin+pack.records[8].canonicalPath,{headers,redirect:'error'});
  assert.equal(outage.status,503);assert.ok(!(await outage.text()).includes('id="release-request"'));
  server.setMode('available');
  const recovered=await fetch(server.origin+pack.records[8].canonicalPath,{headers,redirect:'error'});
  assert.equal(recovered.status,200);await recovered.body?.cancel();
  await writeFile(path.join(out,'http-safety.json'),JSON.stringify({withdrawn:404,coldOutage:503,recovered:200,logs:server.logs},null,2));
}finally{await server.close();}
const columns=Object.keys(rows[0]??{});
const csvCell=value=>`"${String(value??'').replaceAll('"','""')}"`;
await writeFile(path.join(out,'matrix.csv'),'\uFEFF'+[columns,...rows.map(r=>columns.map(c=>r[c]))].map(row=>row.map(csvCell).join(',')).join('\n'));
await writeFile(path.join(out,'matrix.json'),JSON.stringify({rootSHA256:pack.rootSHA256,checkedAt:new Date().toISOString(),expected:182,passed:rows.length,failures,rows},null,2));
await writeFile(path.join(out,'http-evidence.json'),JSON.stringify(evidence,null,2));
const protectedBaseline=await json(path.join(out,'protected-baseline.json'));
const changedProtected=protectedBaseline.entries.filter(line=>{
  const [definition,file]=line.split('\t');
  return execFileSync('git',['hash-object',file],{cwd:workspace,encoding:'utf8'}).trim()!==definition.split(' ')[2];
});
await writeFile(path.join(out,'protected-files.json'),JSON.stringify({baseline:protectedBaseline.commit,files:protectedBaseline.entries.length,changed:changedProtected,unaffectedMetadata:unaffected.length},null,2));
assert.deepEqual(changedProtected,[]);
console.log(JSON.stringify({expected:182,passed:rows.length,localLinks:localLinks.size,protectedFiles:protectedBaseline.entries.length,unaffectedMetadata:unaffected.length,failures},null,2));
assert.equal(failures.length,0);
assert.equal(rows.length,182);
