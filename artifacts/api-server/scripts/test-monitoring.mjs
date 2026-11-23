import { build } from 'esbuild';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '../../..');
const dbRequire = createRequire(path.join(root, 'lib/db/package.json'));
const pgPath = dbRequire.resolve('pg');
const drizzlePath = dbRequire.resolve('drizzle-orm/node-postgres');
const out = path.join(root, 'generated-artifacts/monitoring/tests.mjs');
const schema = `monitoring_fixture_${randomUUID().replaceAll('-', '')}`;
await mkdir(path.dirname(out), { recursive: true });
// These replacements exist in this isolated test bundle only. Neither headers,
// fake OAuth sessions nor provider fixtures can authorize the running application.
await build({
  entryPoints: [path.join(root, 'artifacts/api-server/tests/monitoring.fixture.mjs')],
  outfile: out, bundle: true, platform: 'node', format: 'esm', external: ['pg-native'],
  banner: { js: "import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);" },
  plugins: [{ name: 'isolated-monitoring-fixtures', setup(build) {
    build.onResolve({ filter: /^pg$/ }, () => ({ path: pgPath }));
    build.onResolve({ filter: /^@workspace\/db$/ }, () => ({ path: 'db', namespace: 'fixture' }));
    build.onResolve({ filter: /^@clerk\/express$/ }, () => ({ path: 'clerk', namespace: 'fixture' }));
    build.onResolve({ filter: /middlewares\/internalAccess$/ }, () => ({ path: 'auth', namespace: 'fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => {
      const files = {
        db: `import pg from '${pgPath}';
          import {drizzle} from '${drizzlePath}';
          import * as schema from '${root}/lib/db/src/schema/index.ts';
          export * from '${root}/lib/db/src/schema/index.ts';
          export const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,options:'-c search_path=${schema}'});
          export const db=drizzle(pool,{schema});`,
        clerk: `export const getAuth=req=>({sessionId:req.headers['x-fixture-session']||'fixture-session'});`,
        auth: `export {requirePermission} from '${root}/artifacts/api-server/src/middlewares/internalPermissions.ts';
          export function requireInternalAccess(req,res,next) {
            const role=req.headers['x-fixture-role'];
            if(!['owner','editor','viewer'].includes(role))return res.status(401).json({error:'Accesso richiesto'});
            req.internalMember={id:1,email:'fixture@example.invalid',role};next();
          }`,
      };
      return { loader: 'ts', resolveDir: root, contents: files[args.path] };
    });
  } }],
});
const excluded = new Set(['OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'BING_WEBMASTER_API_KEY', 'MONITORING_AI_TRIGGER_KEY', 'REPLIT_DEPLOYMENT']);
// Enumerate names first; do not even copy the real provider credential values.
const fixtureEnv = Object.fromEntries(Object.keys(process.env).filter(key => !excluded.has(key)).map(key => [key, process.env[key]]));
fixtureEnv.MONITORING_TEST_SCHEMA = schema;
const result = spawnSync(process.execPath, ['--test', out], {
  cwd: root, stdio: 'inherit', env: fixtureEnv,
});
process.exitCode = result.status ?? 1;
if (process.exitCode === 0) {
  const uiOut = path.join(root, 'generated-artifacts/monitoring/ui-tests.mjs');
  await build({
    stdin: { contents: `import './artifacts/marenetto-build/tests/monitoring.fixture.tsx'; import './artifacts/marenetto-build/tests/monitoring-export.fixture.tsx'; import './artifacts/marenetto-build/tests/analytics.fixture.tsx';`, resolveDir: root, loader: 'tsx' },
    outfile: uiOut, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic',
    loader: { '.css': 'empty' },
    banner: { js: "import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);" },
  });
  const ui = spawnSync(process.execPath, ['--test', uiOut], { cwd: root, stdio: 'inherit' });
  process.exitCode = ui.status ?? 1;
}
if (process.exitCode === 0) {
  const runtime = spawnSync(process.execPath, ['--test', path.join(root, 'artifacts/marenetto-build/analytics-runtime/runtime.test.mjs')], { cwd: root, stdio: 'inherit' });
  process.exitCode = runtime.status ?? 1;
}
