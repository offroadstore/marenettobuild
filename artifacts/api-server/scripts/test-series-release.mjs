import { build } from 'esbuild';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../../..');
const parent = path.join(root, 'generated-artifacts/indexing-recovery/postgres');
await mkdir(parent,{recursive:true});
const directory = await mkdtemp(parent+'/run-');
const data = path.join(directory, 'data'), socket = path.join(directory, 'socket');
await mkdir(socket, { recursive:true });
const require = createRequire(path.join(root,'lib/db/package.json'));
const pg = require.resolve('pg');
const user = execFileSync('id',['-un'],{encoding:'utf8'}).trim();
// Fresh local cluster, Unix socket only. No environment database URL is read.
execFileSync('initdb',['-D',data,'--auth=trust','--no-locale','-U',user],{stdio:'pipe'});
execFileSync('pg_ctl',['-D',data,'-l',path.join(directory,'server.log'),'-o',`-h '' -k ${socket} -p 55491 -F`,'-w','start'],{stdio:'pipe'});
try {
  const out = path.join(directory,'tests.mjs');
  await build({entryPoints:[path.join(root,'artifacts/api-server/tests/series-release.test.mjs')],outfile:out,bundle:true,platform:'node',format:'esm',
    external:['pg-native'],
    banner:{js:"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);"},
    plugins:[{name:'isolated-real-postgres',setup(b) {
      b.onResolve({filter:/^@workspace\/db$/},()=>({path:'local-socket-only',namespace:'isolated-db'}));
      b.onLoad({filter:/.*/,namespace:'isolated-db'},()=>({loader:'js',resolveDir:path.join(root,'lib/db'),contents:`
        const pg=require(${JSON.stringify(pg)});
        export const pool = new pg.Pool({host:${JSON.stringify(socket)},port:55491,user:${JSON.stringify(user)},database:'postgres',max:5});
        export const db=undefined;
      `}));
      b.onResolve({filter:/^marenetto-editorial-catalog$/},()=>({path:path.join(root,'generated-artifacts/editorial/catalog.json')}));
    }}]});
  const result=spawnSync(process.execPath,['--test',out],{cwd:root,stdio:'inherit'});
  process.exitCode=result.status??1;
} finally {
  execFileSync('pg_ctl',['-D',data,'-m','immediate','-w','stop'],{stdio:'pipe'});
}
