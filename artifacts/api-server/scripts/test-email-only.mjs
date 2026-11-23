import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../../..');
const outfile = path.join(root, 'generated-artifacts/email-only/tests.mjs');
await mkdir(path.dirname(outfile), { recursive: true });
await build({
  entryPoints: [path.join(root, 'artifacts/api-server/tests/email-only.fixture.mjs')],
  bundle: true, platform: 'node', format: 'esm', outfile,
  banner: { js: "import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);" },
  plugins: [{ name: 'no-storage-or-real-smtp', setup(build) {
    build.onResolve({ filter: /^@workspace\/db$|^pg$|^drizzle-orm/ }, () => { throw new Error('Email-only route must not import a database'); });
    build.onResolve({ filter: /^nodemailer$/ }, () => ({ path: 'smtp', namespace: 'fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
      loader: 'js', contents: `export const createTransport=()=>({
        async sendMail(message) {
          globalThis.smtpMessages.push(message);
          if(globalThis.smtpMode==='failure') throw new Error('sensitive@example.invalid');
          return globalThis.smtpMode==='rejected' ? {accepted:[],rejected:['info@marenetto.com']} : {accepted:['info@marenetto.com'],rejected:[]};
        }, close(){globalThis.closed++;}
      });`,
    }));
  } }],
});
const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
const result = spawnSync(process.execPath, ['--test', outfile], { env, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
