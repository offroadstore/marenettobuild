import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const out = path.join(root, 'generated-artifacts/google-reviews');
await mkdir(out, { recursive: true });
for (const [name, entry] of [
  ['server', 'artifacts/api-server/tests/google-reviews.fixture.mjs'],
  ['ui', 'artifacts/marenetto-build/tests/google-reviews.fixture.tsx'],
]) {
  const outfile = path.join(out, `${name}.test.mjs`);
  await build({
    entryPoints: [path.join(root, entry)], outfile, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic',
    define: { 'import.meta.env.BASE_URL': '"/"' },
    banner: { js: "import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);" },
  });
  const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
