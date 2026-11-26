import { createServer } from 'vite';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildSeriesDrafts } from '../../../scripts/series-drafts.mjs';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const checkOnly = process.env.NODE_ENV === 'production';
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
  await writeFile(path.resolve(root, '../../generated-artifacts/editorial/catalog.json'), JSON.stringify(catalog));
  const compiler = path.resolve(root, '../../generated-artifacts/editorial/prepare-series-index.mjs');
  await build({ entryPoints: [path.resolve(root, '../api-server/scripts/prepare-series-index.ts')], outfile: compiler,
    bundle: true, platform: 'node', format: 'esm',
    banner: { js: "import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);" } });
  execFileSync(process.execPath, [compiler, ...(checkOnly ? ['--check'] : [])], { cwd: path.resolve(root, '../..'), stdio: 'inherit' });
  console.log(`Catalogo editoriale: ${catalog.records.length} edizioni, ${catalog.locales.length} lingue. Nessuna approvazione importata.`);
} finally { await vite.close(); }
