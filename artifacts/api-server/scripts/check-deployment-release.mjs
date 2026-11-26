import {build} from 'esbuild';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..');
const output=path.join(root,'generated-artifacts/editorial/read-only-preflight.mjs');
await build({entryPoints:[path.join(import.meta.dirname,'check-deployment-release.ts')],outfile:output,
 bundle:true,platform:'node',format:'esm',external:['pg-native'],
 banner:{js:"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);"},
 plugins:[{name:'catalog',setup(b){b.onResolve({filter:/^marenetto-editorial-catalog$/},()=>({path:path.join(root,'generated-artifacts/editorial/catalog.json')}));}}]});
const result=spawnSync(process.execPath,[output],{cwd:root,stdio:'inherit'});
process.exitCode=result.status??1;
