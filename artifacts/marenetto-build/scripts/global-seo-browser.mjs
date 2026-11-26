import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
import { setWebSecurityHeaders } from './security-policy.mjs';
import { PUBLIC_ORIGIN } from './public-release.mjs';

// All bytes are local. No live provider, email, authenticated session or AI.
const label=process.argv[2]??'after';
if (!['before','after'].includes(label)) throw new Error('Use before or after');
const directory=new URL(`../../../generated-artifacts/global-seo/${label}/`,import.meta.url);
const inventory=JSON.parse(await readFile(new URL('inventory.json',directory)));
const snapshotArg=process.argv.indexOf('--snapshot');
const snapshot=snapshotArg<0?[]:JSON.parse(await readFile(process.argv[snapshotArg+1],'utf8'));
const resources=JSON.parse(await readFile(new URL('resources/index.json',directory),'utf8')).results;
const root=new URL('../dist/public/',import.meta.url);
const browser=await chromium.launch({...(existsSync('/repl/tools/bin/chromium')?{executablePath:'/repl/tools/bin/chromium'}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const report={at:new Date().toISOString(),method:'Local production assets and saved HTTP HTML; virtual official www; all external requests aborted; synthetic API; enforced CSP; client History navigation per locale',pages:[],errors:[],cspViolations:[],externalRequests:[],resourceErrors:[]};
try {
  const context=await browser.newContext({locale:'it-IT',viewport:{width:1365,height:900}});
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==PUBLIC_ORIGIN) {
      report.externalRequests.push({path:new URL(request.frame().url()||PUBLIC_ORIGIN).pathname,url:url.origin+url.pathname});
      return route.abort();
    }
    if(!['GET','HEAD'].includes(request.method())) return route.fulfill({status:405,body:'No mutations in audit'});
    const image=resources.find(r=>r.path===url.pathname);
    if(image)return route.fulfill({body:await readFile(new URL('resources/'+image.file,directory)),contentType:image.type});
    if(/^\/api\/(?:network-media|historical-media)\//.test(url.pathname)) {
      report.resourceErrors.push(url.pathname);
      return route.fulfill({status:503,body:'Missing captured public image'});
    }
    if(url.pathname==='/api/editorial/active')return route.fulfill({json:snapshot});
    if(url.pathname==='/api/monitoring/public')return route.fulfill({json:{enabled:false}});
    if(url.pathname.startsWith('/api/'))return route.fulfill({json:{enabled:false,status:'unavailable',reviews:[]}});
    try {
      const entry=inventory.rows.find(r=>r.path===url.pathname);
      const file=entry ? new URL('html/'+createHash('sha256').update(entry.path).digest('hex')+'.html',directory) :
        new URL('.'+url.pathname,root);
      const ext=file.pathname.split('.').pop();
      const mime={html:'text/html',js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',avif:'image/avif',woff2:'font/woff2'};
      const headers={};
      setWebSecurityHeaders({setHeader:(name,value)=>headers[name]=value});
      // A candidate-only transport override, not a configuration or flag change.
      headers['Content-Security-Policy']=headers['Content-Security-Policy-Report-Only']??headers['Content-Security-Policy'];
      delete headers['Content-Security-Policy-Report-Only'];
      await route.fulfill({body:await readFile(file),contentType:mime[ext]??'application/octet-stream',headers});
    } catch { await route.fulfill({status:404,body:'No fixture asset'}); }
  });
  await context.exposeFunction('auditCsp',violation=>report.cspViolations.push(violation));
  await context.addInitScript(()=>{
    document.addEventListener('securitypolicyviolation',event=>window.auditCsp({path:location.pathname,directive:event.effectiveDirective,blocked:event.blockedURI,disposition:event.disposition}));
  });
  const page=await context.newPage();
  page.on('pageerror',error=>report.errors.push({path:new URL(page.url()).pathname,message:error.message}));
  for(const locale of inventory.locales) {
    const entries=inventory.rows.filter(r=>r.locale===locale);
    const home=entries.find(e=>e.id==='home');
    await page.goto(PUBLIC_ORIGIN+home.path,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.hydrated==='true');
    for(const entry of entries) {
      if(new URL(page.url()).pathname!==entry.path) {
        await page.evaluate(path=>{history.pushState(null,'',path);window.dispatchEvent(new PopStateEvent('popstate'));},entry.path);
      }
      let settled=true;
      try {
        await page.waitForFunction(({heading,lang})=>{
          const main=document.querySelector('main');
          const text=main?.querySelector('h1')?.textContent?.replace(/\s+/g,' ').trim();
          return !main?.querySelector('[aria-busy="true"]') && text===heading && document.documentElement.lang.split('-')[0]===lang;
        },{heading:entry.headings.find(h=>h.level===1)?.text,lang:locale},{timeout:8000});
      } catch {settled=false;}
      // React effects and the metadata finalizer run in the settled commit.
      await page.waitForTimeout(30);
      const actual=await page.evaluate(()=>({
        title:document.title,
        description:document.querySelector('meta[name="description"]')?.content,
        canonical:document.querySelector('link[rel="canonical"]')?.href,
        h1:document.querySelectorAll('main h1').length,
        alternates:[...document.querySelectorAll('link[hreflang]')].map(l=>({hreflang:l.hreflang,href:l.href})),
        types:[...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>{try {const j=JSON.parse(s.textContent);return(j['@graph']??[j]).map(n=>n['@type']);}catch{return['invalid'];}}),
      }));
      const issues=[];
      if(!settled)issues.push('body-not-settled');
      for(const key of ['title','description','canonical','h1']) if(actual[key]!==entry[key])issues.push(key);
      if(JSON.stringify(actual.alternates.map(a=>a.hreflang+' '+a.href).sort())!==JSON.stringify(entry.alternates.map(a=>a.hreflang+' '+a.href).sort()))issues.push('hreflang');
      if(entry.kind==='article'&&!actual.types.includes('Article'))issues.push('Article');
      report.pages.push({path:entry.path,locale,issues,...actual});
    }
    console.log(`Audited ${locale}: ${entries.length} client routes`);
  }
  await context.close();
} finally {
  await browser.close();
  await writeFile(new URL('browser.json',directory),JSON.stringify(report,null,2));
}
console.log(JSON.stringify({label,pages:report.pages.length,mismatches:report.pages.filter(p=>p.issues.length).map(p=>({path:p.path,issues:p.issues})),cspViolations:report.cspViolations,errors:report.errors,externalRequests:report.externalRequests},null,2));
if(label==='after') {
  assert.equal(report.pages.filter(p=>p.issues.length).length,0,'Initial HTML / client navigation mismatch');
  assert.deepEqual(report.cspViolations,[],'Candidate CSP violations');
  assert.deepEqual(report.errors,[],'Uncaught browser errors');
  assert.deepEqual(report.resourceErrors,[],'Uncaptured public image variants');
  assert.deepEqual(report.externalRequests,[],'Unexpected external requests before consent');
}
