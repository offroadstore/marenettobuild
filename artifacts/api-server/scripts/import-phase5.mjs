import { build } from 'esbuild';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { loadPhase5 } from '../../../docs/editorial/phase5/package.mjs';
import { PHASE5_LOCALES } from '../../../docs/editorial/phase5/locales.mjs';

if (process.env.NODE_ENV === 'production') throw new Error('Solo sviluppo: nessuna importazione in produzione.');
const root = path.resolve(import.meta.dirname, '../../..');
const directory = path.join(root, 'generated-artifacts/editorial/phase5');
await mkdir(directory, { recursive: true });
const packagePath = path.join(directory, 'package.json');
const locales = process.argv.includes('--all-locales') ? PHASE5_LOCALES : ['it'];
await writeFile(packagePath, JSON.stringify(await loadPhase5({ locales }), null, 2));
const output = path.join(directory, 'import.mjs');
await build({
  entryPoints: [path.join(import.meta.dirname, 'import-phase5-entry.ts')],
  outfile: output, bundle: true, platform: 'node', format: 'esm', external: ['pg-native'],
  banner: { js: "import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);" },
  plugins: [{ name: 'editorial-catalog', setup(build) {
    build.onResolve({ filter: /^marenetto-editorial-catalog$/ }, () => ({ path: path.join(root, 'generated-artifacts/editorial/catalog.json') }));
  } }],
});
const flags = ['--apply','--update-own-drafts'].filter(flag => process.argv.includes(flag));
const result = spawnSync(process.execPath, [output, packagePath, ...flags], { cwd: root, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
