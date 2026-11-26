import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
process.env.PORT||='4198';process.env.BASE_PATH||='/';
const out=path.resolve(import.meta.dirname,'../../../generated-artifacts/editorial/release-2026-11');
const pack=JSON.parse(await readFile(path.join(out,'package.json'),'utf8'));
const active=JSON.parse(await readFile(path.join(out,'candidate-active.json'),'utf8'));
const vite=await createServer({configFile:new URL('../vite.config.ts',import.meta.url).pathname,
  optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false},appType:'custom'});
const savedDocument=globalThis.document,savedWindow=globalThis.window;
const checks=[];
try {
  const {applyPublicReleaseMetadata}=await vite.ssrLoadModule('/src/lib/public-release-meta.ts');
  const nodes=[];
  const matches=(node,selector)=>node.tag===selector.split('[')[0]&&[...selector.matchAll(/\[([^\]=]+)(?:="([^"]*)")?\]/g)]
    .every(([,key,value])=>value===undefined?node.getAttribute(key)!==undefined:node.getAttribute(key)===value);
  const head={
    querySelector:selector=>nodes.find(n=>matches(n,selector)),
    querySelectorAll:selector=>nodes.filter(n=>matches(n,selector)),
    appendChild:node=>nodes.push(node),
    append:node=>nodes.push(node),
  };
  globalThis.document={title:'',documentElement:{dataset:{publicIndexing:'true'}},head,
    querySelector:selector=>selector==='main'?{outerHTML:'<main></main>'}:head.querySelector(selector),
    createElement:tag=>({tag,attrs:{},textContent:'',setAttribute(key,value){this.attrs[key]=value;},
      getAttribute(key){return this.attrs[key]??this[key];},remove(){nodes.splice(nodes.indexOf(this),1);}})};
  // A DOM adapter, not a real browser or request to this host.
  globalThis.window={location:{hostname:'www.marenettobuild.com'}};
  for(const r of pack.records) {
    assert.equal(applyPublicReleaseMetadata(r.path,active),true);
    assert.equal(document.title,(r.presentation??r.content).seoTitle);
    assert.equal(head.querySelector('meta[name="description"]').getAttribute('content'),(r.presentation??r.content).seoDescription);
    assert.equal(head.querySelector('meta[name="robots"]').getAttribute('content'),'index, follow');
    assert.equal(head.querySelector('link[rel="canonical"]').href,'https://www.marenettobuild.com'+r.canonicalPath);
    const links=head.querySelectorAll('link[rel="alternate"][hreflang]');
    assert.equal(links.length,14);
    for(const peer of pack.records.filter(p=>p.identity===r.identity))assert.ok(links.some(link=>link.hreflang===(peer.locale==='it'?'it-IT':peer.locale)&&link.href==='https://www.marenettobuild.com'+peer.canonicalPath));
    const graph=JSON.parse(head.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
    for(const type of ['Article','FAQPage','BreadcrumbList'])assert.equal(graph.filter(g=>g['@type']===type).length,1);
    assert.equal(graph.find(g=>g['@type']==='Article').inLanguage,r.locale);
    assert.equal(graph.find(g=>g['@type']==='FAQPage').mainEntity.length,r.faq.length);
    checks.push({identity:r.identity,locale:r.locale,path:r.path,canonical:r.canonicalPath,title:document.title,hreflang:links.length,schemas:true});
  }
  applyPublicReleaseMetadata('/',active);
  assert.equal(head.querySelector('meta[property="og:image"]').getAttribute('content'),'https://www.marenettobuild.com/media/home/cefalu-hero-left-1672.jpg');
  window.location.hostname='preview.example.invalid';
  applyPublicReleaseMetadata(pack.records[0].path,active);
  assert.equal(head.querySelector('meta[name="robots"]').getAttribute('content'),'noindex, nofollow');
  assert.equal(head.querySelectorAll('link[rel="alternate"][hreflang]').length,0);
}finally{
  if(savedDocument===undefined)delete globalThis.document;else globalThis.document=savedDocument;
  if(savedWindow===undefined)delete globalThis.window;else globalThis.window=savedWindow;
  await vite.close();
}
await writeFile(path.join(out,'client-metadata-evidence.json'),JSON.stringify({
  method:'actual client metadata function with synthetic DOM and host; no network, no browser session',
  rootSHA256:pack.rootSHA256,passed:checks.length,homeImageRestored:true,previewExclusion:true,checks,
},null,2));
console.log('Client metadata DOM assertions passed: '+checks.length+'/182; canonical, social reset, schemas, hreflang and preview exclusion. Direction is verified separately by the real browser.');
