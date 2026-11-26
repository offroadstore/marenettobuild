import { createServer } from 'vite';
import { mkdir, writeFile, readFile, mkdtemp, rename } from 'node:fs/promises';
import path from 'node:path';
import { buildSeriesDrafts } from '../../../scripts/series-drafts.mjs';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const output=path.resolve(root,'../../generated-artifacts/editorial');
await mkdir(output,{recursive:true});
const staging=await mkdtemp(path.join(output,'build-'));
const compilerEnv={...process.env,EDITORIAL_BUILD_ROOT:staging};
const authorize=process.argv.includes('--authorize-deployment');
const checkOnly = !authorize;
process.env.PORT ||= '4189';
process.env.BASE_PATH ||= '/';
process.env.NODE_ENV = 'production';
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null }, appType: 'custom' });
try {
  const { exportEditorialCatalog, exportSeriesContext } = await vite.ssrLoadModule('/src/content/editorial-export.ts');
  const catalog = await exportEditorialCatalog();
  catalog.seriesContext = exportSeriesContext();
  catalog.seriesDrafts = await buildSeriesDrafts(catalog.records, catalog.seriesContext);
  catalog.seriesRelease = JSON.parse(await readFile(path.resolve(root, '../../docs/editorial/costruire-cefalu-madonie/owner-release.json'), 'utf8'));
  const inventory = JSON.parse(await readFile(path.join(root,'src/content/historical/index.json'),'utf8'));
  const updates = JSON.parse(await readFile(path.join(root,'src/content/historical-source-updates.json'),'utf8'));
  const originals = {};
  for (const locale of catalog.locales) {
    try { Object.assign(originals, JSON.parse(await readFile(path.join(root, `src/content/historical/${locale}.json`), 'utf8'))); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for (const record of catalog.records) {
    if (record.originalKey) {
      record.originalBody = originals[record.originalKey]?.html ?? '';
      record.originalMetadata = { ...record.originalMetadata, immutableSnapshot: inventory.find(page => page.key === record.originalKey), datedSourceUpdate: updates[record.originalKey] ?? null };
    }
  }
  await mkdir(path.resolve(root, '../../generated-artifacts/editorial'), { recursive: true });
  await writeFile(path.join(staging,'catalog.json'), JSON.stringify(catalog));
  // Only the explicit authoring command may update an approved index. Normal
  // API/web builds verify it in every environment, including development.
  await vite.close();
  const compiler = path.join(staging,'prepare-series-index.mjs');
  await build({ entryPoints: [path.resolve(root, '../api-server/scripts/prepare-series-index.ts')], outfile: compiler,
    bundle: true, platform: 'node', format: 'esm',
    banner: { js: "import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);" } });
  execFileSync(process.execPath, [compiler, ...(checkOnly ? ['--check'] : [])], { cwd: path.resolve(root, '../..'), stdio: 'inherit',env:compilerEnv });
  execFileSync(process.execPath,[path.join(root,'scripts/prepare-commercial-release.mjs'),...(!checkOnly?['--authorize']:[])],{cwd:root,stdio:'inherit',env:compilerEnv});
  const deploymentCompiler=path.join(staging,'prepare-deployment.mjs');
  await build({entryPoints:[path.resolve(root,'../api-server/scripts/prepare-deployment-release.ts')],outfile:deploymentCompiler,
    bundle:true,platform:'node',format:'esm',banner:{js:"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);"}});
  execFileSync(process.execPath,[deploymentCompiler,...(process.argv.includes('--authorize-deployment')?['--authorize']:[])],{cwd:path.resolve(root,'../..'),stdio:'inherit',env:compilerEnv});
  await mkdir(path.join(output,'release-2026-11'),{recursive:true});
  for(const file of ['package.json','previous-guides.json','protected-baseline.json','owner-activate-console.js'])
    await rename(path.join(staging,'release-2026-11',file),path.join(output,'release-2026-11',file));
  // Publish only the complete, validated payload, atomically. Parallel API/web
  // compilers never expose a partial catalog or rewrite approval indexes.
  await rename(path.join(staging,'catalog.json'),path.join(output,'catalog.json'));
  console.log(`Catalogo editoriale: ${catalog.records.length} edizioni, ${catalog.locales.length} lingue. Nessuna approvazione importata.`);
} finally { await vite.close(); }
