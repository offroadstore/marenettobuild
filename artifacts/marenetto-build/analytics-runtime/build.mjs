import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Portable output: only Node's standard library is required at runtime.
// Never write origins, OAuth credentials or consent decisions into the bundle.
const out = new URL('../../../generated-artifacts/monitoring/dedicated-runtime/', import.meta.url);
await mkdir(out, { recursive: true });
await build({
  entryPoints: [fileURLToPath(new URL('./server.mjs', import.meta.url))],
  outfile: fileURLToPath(new URL('server.mjs', out)), bundle: true,
  platform: 'node', target: 'node22', format: 'esm',
});
await copyFile(new URL('./client.js', import.meta.url), new URL('client.js', out));
await copyFile(new URL('./README.md', import.meta.url), new URL('README.md', out));
