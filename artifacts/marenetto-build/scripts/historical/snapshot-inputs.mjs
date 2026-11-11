import { readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const workspace = path.resolve(root, '../..');
const evidence = path.resolve(process.env.HISTORICAL_AUDIT_DIR || path.join(workspace, 'generated-artifacts/migration-2026-11-11'));
const rows = [];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = path.join(root, 'dist/public/route-manifest.json');
const builtAt = (await stat(manifest)).mtime.toISOString();
async function add(file) {
  const bytes = await readFile(file);
  rows.push({ file: path.relative(workspace, file), bytes: bytes.length, sha256: sha(bytes), modifiedAt: (await stat(file)).mtime.toISOString() });
}
async function scan(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) await scan(file);
    else await add(file);
  }
}
await scan(path.join(root, 'src'));
for (const file of ['scripts/build-seo.mjs', 'scripts/seo-document.mjs', 'scripts/serve-seo.mjs', 'vite.config.ts', 'index.html', 'package.json']) await add(path.join(root, file));
for (const file of ['src/routes/index.ts', 'src/routes/historical-media.ts', 'src/lib/objectStorage.ts', 'src/lib/objectAcl.ts', 'content/historical-media.json']) await add(path.join(workspace, 'artifacts/api-server', file));
const document = { createdAt: new Date().toISOString(), gitHEAD: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  gitHEADIsNotClaimedAsCleanServedRevision: true, builtAt, routeManifestSHA256: sha(await readFile(manifest)),
  files: rows, sourceFilesNewerThanWebBuild: rows.filter(row => row.file.startsWith('artifacts/marenetto-build/src/') && row.modifiedAt > builtAt).map(row => row.file) };
await writeFile(path.join(evidence, 'code-inputs.json'), JSON.stringify(document, null, 2));
console.log(`Recorded ${rows.length} source-input hashes; ${document.sourceFilesNewerThanWebBuild.length} frontend source files newer than the measured build.`);
