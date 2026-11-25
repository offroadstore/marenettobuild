import { build } from 'esbuild';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '../../..');
const out = path.join(root, 'generated-artifacts/editorial/phase5/tests.mjs');
await mkdir(path.dirname(out), { recursive: true });
await build({
  entryPoints: [path.join(root, 'artifacts/api-server/tests/phase5-drafts.test.mjs')],
  outfile: out, bundle: true, platform: 'node', format: 'esm',
  // Keep the private loader at its source location for its relative manuscripts.
  plugins: [{ name: 'private-manuscripts', setup(build) {
    build.onResolve({ filter: /docs\/editorial\/phase5\/(?:package|sources)\.mjs$/ }, args => ({
      path: path.resolve(args.resolveDir, args.path), external: true,
    }));
  } }],
  banner: { js: "import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);" },
});
const testEnv = { ...process.env, PHASE5_BUNDLED_TEST: 'true' };
// A native wildcard-suite entry can invoke this runner. Passing the parent's
// node:test context makes the child silently skip collecting the real tests.
delete testEnv.NODE_TEST_CONTEXT;
const result = spawnSync(process.execPath, ['--test', out], { cwd: root, stdio: 'inherit', env: testEnv });
process.exitCode = result.status ?? 1;
