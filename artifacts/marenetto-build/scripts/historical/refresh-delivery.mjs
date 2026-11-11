import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const evidence = path.resolve(process.env.HISTORICAL_AUDIT_DIR || path.join(root, '../../generated-artifacts/migration-2026-11-11'));
const source = JSON.parse(await readFile(path.join(evidence, 'acquisition.json'), 'utf8'));
const origin = 'http://127.0.0.1:4278';
const server = spawn(process.execPath, [path.join(root, 'scripts/serve-seo.mjs')], { env: { ...process.env, PORT: '4278' }, stdio: ['ignore', 'pipe', 'inherit'] });
const sha = value => createHash('sha256').update(value).digest('hex');
const records = [];
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
await mkdir(path.join(evidence, 'new-current'), { recursive: true });
try {
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Delivery handler exited ${code}`))); });
  for (const row of source.inventory) {
    const target = new URL(row.url);
    let url = origin + target.pathname + target.search;
    const hops = [];
    const record = { url: row.url };
    try {
      for (let i = 0; i < 8; i++) {
        if (new URL(url).origin !== origin) throw new Error('Unexpected external redirect; not followed');
        const acquiredAt = new Date().toISOString();
        const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
        const bytes = Buffer.from(await response.arrayBuffer());
        const file = `new-current/${sha(row.url).slice(0, 16)}-${stamp}-${i}.html`;
        await writeFile(path.join(evidence, file), bytes);
        hops.push({ url, status: response.status, acquiredAt, file, sha256: sha(bytes), bytes: bytes.length,
          headers: Object.fromEntries(['content-type', 'location', 'x-robots-tag', 'retry-after'].map(name => [name, response.headers.get(name)]).filter(([, value]) => value !== null)) });
        if (response.status >= 300 && response.status < 400 && response.headers.get('location')) { url = new URL(response.headers.get('location'), url).href; continue; }
        record.response = { url: origin + target.pathname + target.search, finalURL: url, status: response.status, initialStatus: hops[0].status, hops,
          htmlDocument: /html/.test(response.headers.get('content-type') ?? '') };
        break;
      }
      if (!record.response) throw new Error('Redirect limit exceeded');
    } catch (error) { record.error = String(error); }
    records.push(record);
  }
} finally { server.kill(); }
const result = { createdAt: new Date().toISOString(), origin, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  workingTreeDiffSHA256: sha(execFileSync('git', ['diff', '--', 'artifacts/marenetto-build/src', 'artifacts/api-server/src', 'lib/api-spec/openapi.yaml'])),
  routeManifestSHA256: sha(await readFile(path.join(root, 'dist/public/route-manifest.json'))), records };
await writeFile(path.join(evidence, `served-${stamp}.json`), JSON.stringify(result, null, 2));
await writeFile(path.join(evidence, 'served-current.json'), JSON.stringify(result, null, 2));
console.log(`Fresh HTTP delivery: ${records.length} inventoried URLs, ${records.filter(row => row.error).length} request errors.`);
