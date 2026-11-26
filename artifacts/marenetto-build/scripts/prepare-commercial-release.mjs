import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadRelease } from '../../../docs/editorial/release-2026-11/package.mjs';
import { loadPhase5 } from '../../../docs/editorial/phase5/package.mjs';
import { PHASE5_LOCALES } from '../../../docs/editorial/phase5/locales.mjs';
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const root = path.resolve(import.meta.dirname,'../../..');
const output = path.join(process.env.EDITORIAL_BUILD_ROOT??path.join(root,'generated-artifacts/editorial'),'release-2026-11');
const checkOnly=!process.argv.includes('--authorize');
await mkdir(output,{recursive:true});
const pack = await loadRelease();
await writeFile(path.join(output,'package.json'),JSON.stringify(pack,null,2));
await writeFile(path.join(output,'previous-guides.json'),JSON.stringify(await loadPhase5({locales:PHASE5_LOCALES})));
await mkdir(path.join(root,'artifacts/marenetto-build/public/media/editorial'),{recursive:true});
if(!checkOnly) await sharp(await readFile(path.join(root,'docs/editorial/release-2026-11/project-diagram.svg')))
  .png().toFile(path.join(root,'artifacts/marenetto-build/public/media/editorial/project-diagram.png'));
const failures = [];
for (const r of pack.records) {
  const title=[...r.content.seoTitle].length, description=[...r.content.seoDescription].length;
  if (title<30||title>65||description<70||description>165) failures.push({locale:r.locale,identity:r.identity,title,description,text:r.content.seoTitle});
}
process.stdout.write(JSON.stringify({editions:pack.records.length,rootSHA256:pack.rootSHA256,failures},null,2)+'\n');
if(failures.length) process.exitCode=1;
if (!failures.length) {
  const entry = path.join(output,'prepare.mjs');
  await build({
    entryPoints:[path.join(root,'artifacts/api-server/scripts/prepare-commercial-release-entry.ts')],
    outfile:entry,bundle:true,platform:'node',format:'esm',
    banner:{js:"import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);"},
  });
  const result=spawnSync(process.execPath,[entry,...(checkOnly?['--check']:[])],{cwd:root,stdio:'inherit',env:{...process.env,NODE_ENV:'development'}});
  process.exitCode=result.status ?? 1;
}
