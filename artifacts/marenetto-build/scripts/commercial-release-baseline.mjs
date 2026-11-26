import {createServer} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const workspace=path.resolve(import.meta.dirname,'../../..');
const root=path.join(workspace,'artifacts/marenetto-build');
const out=path.join(workspace,'generated-artifacts/editorial/release-2026-11');
const base=process.env.COMMERCIAL_BASELINE_REF??'f68745fbddc8e31fb8fbbb9e3bb038797236ac85';
const json=async file=>JSON.parse(await readFile(file,'utf8'));
const active=await json(path.join(out,'candidate-active.json'));
const pack=await json(path.join(out,'package.json'));
const previousActive=active.filter(e=>e.content.tags.includes('serie-cefalu-madonie'));
const manifest=await json(path.join(root,'dist/public/route-manifest.json'));
const hash=s=>createHash('sha256').update(s).digest('hex');
const normalize=s=>s.replace(/ data-(?:replit-metadata|component-name)="[^"]*"/g,'');
function difference(before,after) {
  let n=0;while(n<before.length&&n<after.length&&before[n]===after[n])n++;
  return {offset:n,before:before.slice(Math.max(0,n-50),n+120),after:after.slice(Math.max(0,n-50),n+120)};
}
const changed=new Set(execFileSync('git',['diff','--name-only',base],{cwd:workspace,encoding:'utf8'}).trim().split('\n').filter(p=>p.startsWith('artifacts/marenetto-build/src/')&&/\.(?:tsx?|mjs)$/.test(p)));
const baselineServer=await createServer({
  configFile:path.join(root,'vite.config.ts'),
  server:{middlewareMode:true,hmr:false},appType:'custom',
  plugins:[{name:'immutable-baseline-source',enforce:'pre',load(id){
    const relative=path.relative(workspace,id.split('?')[0]);
    if(!changed.has(relative)) return;
    return execFileSync('git',['show',`${base}:${relative}`],{cwd:workspace,encoding:'utf8',maxBuffer:8*1024*1024});
  }}],
});
const results=[],failures=[];
try {
  const baseline=await baselineServer.ssrLoadModule('/src/entry-server.tsx');
  const candidate=await import('../dist/server/entry-server.mjs');
  const protectedPages=Object.values(manifest.editions).filter(e=>
    e.kind==='legal'||['home','atelier','property-management','contact','request','process'].includes(e.id)||
    (e.locale==='ar'&&e.kind==='article'&&!pack.records.some(r=>r.path.replace(/\/+$/,'')===e.path.replace(/\/+$/,''))));
  const unique=[...new Map(protectedPages.map(e=>[e.path,e])).values()];
  for(const e of unique) {
    try {
      const before=await baseline.render(e.path,e.locale,previousActive);
      const after=await candidate.render(e.path,e.locale,active);
      if(normalize(after.body)!==normalize(before.body))throw new Error(JSON.stringify(difference(normalize(before.body),normalize(after.body))));
      results.push({path:e.path,locale:e.locale,kind:e.kind,id:e.id,baselineRawSHA256:hash(before.body),candidateRawSHA256:hash(after.body),normalizedBaselineSHA256:hash(normalize(before.body)),normalizedCandidateSHA256:hash(normalize(after.body)),same:true});
    }catch(error){failures.push({path:e.path,error:error.stack});}
  }
  // Pillars may gain only the explicitly requested reading list.
  for(const e of Object.values(manifest.editions).filter(e=>e.source?.startsWith('four-areas:'))) {
    const before=await baseline.render(e.path,e.locale,previousActive);
    const after=await candidate.render(e.path,e.locale,active);
    const stripped=after.body.replace(/<section class="fa-section" aria-labelledby="fa-reading">[\s\S]*?<\/section>/,'');
    if(normalize(stripped)!==normalize(before.body)) failures.push({path:e.path,error:'Differenza non limitata ai collegamenti informativi della pillar',difference:difference(normalize(before.body),normalize(stripped))});
    else results.push({path:e.path,locale:e.locale,id:e.id,onlyAuthorizedReadingLinks:true});
  }
}finally{await baselineServer.close();}
await writeFile(path.join(out,'rendered-baseline.json'),JSON.stringify({baselineCommit:base,checkedAt:new Date().toISOString(),normalizationWhitelist:['data-replit-metadata','data-component-name'],compared:results.length,results,failures},null,2));
console.log(JSON.stringify({compared:results.length,failures},null,2));
assert.deepEqual(failures,[]);
