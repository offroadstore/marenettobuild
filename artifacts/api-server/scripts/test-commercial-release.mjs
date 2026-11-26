import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..');
const out=path.join(root,'generated-artifacts/editorial/release-2026-11/cms-test.mjs');
await mkdir(path.dirname(out),{recursive:true});
await build({entryPoints:[path.join(root,'artifacts/api-server/tests/commercial-release.test.mjs')],outfile:out,
  bundle:true,platform:'node',format:'esm',
  banner:{js:"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);"},
  plugins:[{name:'strict-isolated-cms',setup(build){
    build.onResolve({filter:/^@workspace\/db$/},()=>({path:path.join(root,'artifacts/api-server/tests/support/commercial-memory-db.mjs')}));
    build.onResolve({filter:/^marenetto-editorial-catalog$/},()=>({path:path.join(root,'generated-artifacts/editorial/catalog.json')}));
    build.onResolve({filter:/middlewares\/internalAccess$/},()=>({path:'synthetic-auth',namespace:'isolated'}));
    build.onLoad({filter:/.*/,namespace:'isolated'},()=>({loader:'js',contents:`
      export const requireInternalAccess=(req,res,next)=>{
        const role=req.headers['x-isolated-test-role'];
        if(!['synthetic-owner','editor','viewer'].includes(role))return res.status(401).json({error:'No synthetic test identity'});
        req.internalMember={role:role==='synthetic-owner'?'owner':role,email:'synthetic-candidate@example.invalid'};next();
      };
      export const requirePermission=p=>(req,res,next)=>req.internalMember.role==='viewer'&&p==='cms:write'?res.status(403).json({error:'Denied'}):next();
    `}));
  }}]});
const env={...process.env,COMMERCIAL_RELEASE_ISOLATED:'true',MARENETTO_PRIVACY_APPROVED:'true',MARENETTO_PROVIDERS_APPROVED:'true',MARENETTO_TESTING_APPROVED:'true'};
delete env.NODE_TEST_CONTEXT;
const result=spawnSync(process.execPath,['--test',out],{cwd:root,stdio:'inherit',env});
process.exitCode=result.status??1;
