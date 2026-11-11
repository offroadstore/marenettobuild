/** Owner-requested public source copies, in a dedicated immutable storage prefix.
 * No production content is overwritten and no storage paths or credentials logged.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ObjectStorageService, objectStorageClient } from '../src/lib/objectStorage';

const workspace = process.cwd();
const evidence = path.resolve(workspace, 'generated-artifacts/migration-2026-11-11');
const ledger = JSON.parse(await readFile(path.join(evidence, 'assets.json'), 'utf8'));
const service = new ObjectStorageService();
const prefix = service.getPublicObjectSearchPaths()[0];
const parts = prefix.replace(/^\/+/, '').split('/');
const bucketName = parts.shift()!;
const objectPrefix = parts.join('/');
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const backend: Record<string, { key: string; contentType: string; sha256: string; bytes: number }> = {};
const frontend: Record<string, string> = {};
for (const row of ledger.rows) {
  if (row.state !== 'superato' || !/^image\/(?:png|jpeg|webp|gif)(?:;|$)/.test(row.contentType ?? '')) continue;
  const extension = ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[row.contentType.split(';')[0]];
  const filename = `${row.sha256}.${extension}`;
  const key = `historical-migration/${filename}`;
  if (!backend[filename]) {
    const bytes = await readFile(path.join(evidence, row.file));
    if (sha(bytes) !== row.sha256) throw new Error('Historical image integrity check failed before upload');
    const file = objectStorageClient.bucket(bucketName).file(`${objectPrefix}/${key}`);
    try {
      await file.save(bytes, { resumable: false, preconditionOpts: { ifGenerationMatch: 0 },
        metadata: { contentType: row.contentType, cacheControl: 'public, max-age=31536000, immutable' } });
    } catch (error) {
      if ((error as { code?: number }).code !== 412) throw new Error('Historical image storage write failed; manifests were not changed');
    }
    const [saved] = await file.download();
    if (sha(saved) !== row.sha256) throw new Error('Historical image integrity check failed after storage read');
    backend[filename] = { key, contentType: row.contentType, sha256: row.sha256, bytes: bytes.length };
  }
  frontend[row.url] = `/api/historical-media/${filename}`;
}
if (!Object.keys(frontend).length) throw new Error('No verified historical images available; no manifests written');
await writeFile(path.join(workspace, 'artifacts/api-server/content/historical-media.json'), JSON.stringify({ assets: backend }, null, 2) + '\n');
await writeFile(path.join(workspace, 'artifacts/marenetto-build/src/content/historical-media.json'), JSON.stringify(frontend, null, 2) + '\n');
await writeFile(path.join(evidence, 'media-storage-verification.json'), JSON.stringify({
  createdAt: new Date().toISOString(), sourceURLs: Object.keys(frontend).length, distinctFiles: Object.keys(backend).length,
  bytes: Object.values(backend).reduce((sum, file) => sum + file.bytes, 0),
  integrity: 'Downloaded App Storage bytes match SHA-256 of independently acquired historical source',
  mapping: frontend, productionPublished: false,
}, null, 2));
console.log(`Historical media copied and read-back verified: ${Object.keys(frontend).length} source URLs, ${Object.keys(backend).length} immutable images.`);
