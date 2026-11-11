import { build } from 'esbuild';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname,'../../..');
const out = path.join(root,'generated-artifacts/editorial/tests.mjs');
await mkdir(path.dirname(out),{recursive:true});
await build({ entryPoints:[path.join(root,'artifacts/api-server/tests/editorial.test.mjs')], outfile:out, bundle:true, platform:'node',format:'esm',external:['pg-native'],
  banner:{js:"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);"},
  plugins:[{name:'test-only-auth',setup(build){
    build.onResolve({filter:/^marenetto-editorial-catalog$/},()=>({path:path.join(root,'generated-artifacts/editorial/catalog.json')}));
    build.onResolve({filter:/middlewares\/internalAccess$/},()=>({path:'auth',namespace:'test-auth'}));
    build.onLoad({filter:/.*/,namespace:'test-auth'},()=>({loader:'js',contents:`
      export function requireInternalAccess(req,res,next) {
        const role=req.headers['x-test-role'];
        if(!['owner','editor','viewer'].includes(role)) return res.status(401).json({error:'Sign in'});
        req.internalMember={id:1,email:'synthetic-test@example.invalid',role}; next();
      }
      export function requirePermission(permission) { return (req,res,next) => {
        if(permission==='cms:write' && req.internalMember.role==='viewer') return res.status(403).json({error:'Denied'});
        next();
      }; }
    `}));
  }}] });
const result=spawnSync(process.execPath,['--test',out],{cwd:root,stdio:'inherit',env:{...process.env,EDITORIAL_HTTP_TEST:'true'}});
process.exitCode=result.status??1;
