import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { inspect, plain } from './global-seo-audit.mjs';
import { publicEditions } from './public-release.mjs';
import { renderDocument } from './seo-document.mjs';
import { releaseMetadata } from '../src/localization/public-seo.mjs';
import { setWebSecurityHeaders } from './security-policy.mjs';

const root=new URL('../dist/public/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('route-manifest.json',root),'utf8'));
const entries=publicEditions(manifest);
const length=s=>[...s.normalize('NFC')].length;
const result=await build({stdin:{contents:`export * from './src/content/historical-presentation'; export * from './src/content/image-descriptions';`,
  resolveDir:new URL('../',import.meta.url).pathname},bundle:true,write:false,platform:'node',format:'esm'});
const { historicalPresentation,imageDescription,heroDescription }=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));

test('every sitemap document has complete native metadata, semantics and structured data',async()=>{
  assert.equal(new Set(entries.map(e=>e.locale)).size,12);
  assert.ok(entries.some(e=>e.id==='property-management'));
  const titles=new Set(),descriptions=new Set();
  for(const entry of entries) {
    const html=await readFile(new URL(manifest.pages[entry.path],root),'utf8');
    const row=inspect(html,entry);
    assert.ok(length(row.title)>=50&&length(row.title)<=60,entry.path+' title');
    assert.ok(length(row.description)>=140&&length(row.description)<=160,entry.path+' description');
    assert.ok(!titles.has(row.title),entry.path+' duplicate title');titles.add(row.title);
    assert.ok(!descriptions.has(row.description),entry.path+' duplicate description');descriptions.add(row.description);
    assert.equal(row.h1,1,entry.path);assert.deepEqual(row.hierarchy,[],entry.path);
    assert.deepEqual(row.inadequateAlt,[],entry.path);assert.deepEqual(row.jsonldIssues,[],entry.path);
    assert.equal(row.og,true,entry.path);
    assert.ok(row.canonical.startsWith('https://www.marenettobuild.com/'),entry.path);
    assert.ok(!row.schemaTypes.some(t=>['Review','AggregateRating'].includes(t)),entry.path);
    assert.equal(row.title,releaseMetadata(entry).title,entry.path);
    assert.equal(row.description,releaseMetadata(entry).description,entry.path);
  }
});

test('public historical representation preserves words while repairing headings and image semantics',()=>{
  const source='<h3>Context</h3><p>Unchanged facts.</p><h5>Question</h5><p>Answer.</p><img src="/media/articles/garden-design-esclusivo.jpg" alt="">';
  const output=historicalPresentation(source,'en');
  assert.equal(plain(output),plain(source));
  assert.match(output,/<h2>Context<\/h2>/);
  assert.match(output,/<h3>Question<\/h3>/);
  assert.equal(historicalPresentation('<h4>First card</h4><h4>Second card</h4>','en'),'<h2>First card</h2><h2>Second card</h2>');
  assert.match(output,/alt="Operator laying slabs along a garden path"/);
  const logo='<img data-historical-logo="" src="/logo.png" alt="Marenetto Build">';
  assert.equal(historicalPresentation(logo,'en'),logo);
  for(const locale of new Set(entries.map(e=>e.locale))) {
    assert.ok(imageDescription('/media/articles/garden-design-esclusivo.jpg',locale));
    assert.ok(heroDescription(locale));
  }
  assert.equal(imageDescription('/unknown.jpg','en','Existing label'),'Existing label');
  assert.equal(imageDescription('/media/articles/garden-design-esclusivo.jpg','ar','Existing label'),'Existing label');
});

test('JSON-LD cannot escape its inert script block and active SEO is never mechanically cut',()=>{
  const text='Question </script><script>alert(1)</script> & answer';
  const html=renderDocument('<html><head></head><body><div id="root"></div></body></html>',{
    edition:{id:'unknown',locale:'en',path:'/test',title:'Test',description:'Description'},
    body:'<main><h1>Test</h1></main>',
    structuredData:[{'@type':'Article',headline:text}],
  });
  const json=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  assert.equal(JSON.parse(json)['@graph'][0].headline,text);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  const description='A complete editorial sentence. '.repeat(10).trim();
  assert.equal(releaseMetadata({id:'home',locale:'en',activeSeoDescription:true,description,title:'Home'}).description,description);
});

test('CSP allows only the reviewed analytics transports and no executable inline scripts',()=>{
  const headers={};setWebSecurityHeaders({setHeader:(k,v)=>headers[k]=v});
  const csp=headers['Content-Security-Policy']??headers['Content-Security-Policy-Report-Only'];
  const directives=Object.fromEntries(csp.split(';').map(s=>s.trim().split(/\s+/)).map(([key,...values])=>[key,values]));
  assert.deepEqual(directives['default-src'],["'self'"]);
  assert.ok(!directives['script-src'].includes("'unsafe-inline'"));
  assert.ok(!directives['script-src'].includes("'unsafe-eval'"));
  assert.ok(!Object.values(directives).some(values=>values.includes('*')));
  assert.ok(directives['script-src'].includes('https://www.googletagmanager.com'));
  assert.ok(directives['connect-src'].includes('https://www.google-analytics.com'));
  assert.ok(directives['connect-src'].includes('https://region1.google-analytics.com'));
  assert.ok(directives['img-src'].includes('https://www.facebook.com/tr/'));
  assert.ok(!directives['script-src'].includes('https://connect.facebook.net'));
  assert.deepEqual(directives['object-src'],["'none'"]);
});
