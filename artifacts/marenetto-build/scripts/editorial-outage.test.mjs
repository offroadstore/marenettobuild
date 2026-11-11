import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(await readFile(path.join(root,'dist/public/route-manifest.json'),'utf8'));
const existing=Object.values(manifest.editions).find(e=>e.kind==='article'&&e.locale==='it');
assert.ok(existing);
const tombstone={identity:existing.id,locale:'it',path:existing.path,kind:'article',revisionId:'withdrawn',content:{title:'Contenuto ritirato',summary:'',body:'',category:'',tags:[],image:'',imageAlt:'',sources:[],seoTitle:'',seoDescription:'',contentLanguage:'it'}};

async function start(mode, port) {
  // An isolated upstream double: no live content, database or gates are changed.
  const preload=`const original=globalThis.fetch;let calls=0;globalThis.fetch=async function(url,options){if(String(url)==='http://localhost:80/api/editorial/active'){calls++;if(${JSON.stringify(mode)}==='down'||(${JSON.stringify(mode)}==='warm-failure'&&calls>1))throw new Error('Synthetic API outage');return Response.json(${JSON.stringify([tombstone])});}return original(url,options);};`;
  const child=spawn(process.execPath,['--import',`data:text/javascript,${encodeURIComponent(preload)}`,'scripts/serve-seo.mjs'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw new Error('Synthetic test handler exited before listening');})]);
  return {child,origin:`http://127.0.0.1:${port}`};
}
async function stop(child) { const ended=once(child,'exit');child.kill();await ended; }
async function assertUnavailable(origin) {
  const response=await fetch(`${origin}${existing.path}`);
  const html=await response.text();
  assert.equal(response.status,503);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('retry-after'),'30');
  assert.match(html,/Stato editoriale|Non possiamo verificare/);
  assert.ok(!html.includes(existing.title),'the original article must not be republished');
  assert.ok(!html.includes('data-historical-key'));
  assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
}

test('withdrawal remains closed after web restart while the editorial API is unavailable',async()=>{
  const first=await start('available',4193);
  try {assert.equal((await fetch(`${first.origin}${existing.path}`)).status,404);} finally {await stop(first.child);}
  const restarted=await start('down',4193);
  try {await assertUnavailable(restarted.origin);} finally {await stop(restarted.child);}
});

test('an upstream failure never republishes the old static article after a successful withdrawal read',async()=>{
  const warmed=await start('warm-failure',4193);
  try {
    assert.equal((await fetch(`${warmed.origin}${existing.path}`)).status,404);
    await assertUnavailable(warmed.origin);
  } finally {await stop(warmed.child);}
});
