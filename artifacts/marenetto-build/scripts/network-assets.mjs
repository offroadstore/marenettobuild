/**
 * Offline editorial preparation. Originals and reports stay ignored.
 * Uses the existing App Storage client unchanged; never migrates old assets.
 */
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const workspace = path.resolve(root, '../..');
const output = path.join(workspace, 'generated-artifacts/network');
const plan = JSON.parse(await readFile(path.join(root, 'src/content/network/image-plan.json'), 'utf8'));
await mkdir(path.join(output, 'webp'), { recursive: true });
// Bundle only the project's own TS files. Dependencies resolve from the API
// package that already owns the storage SDK; no credentials are copied.
const bundled = await build({
  entryPoints: [path.join(workspace, 'artifacts/api-server/src/lib/objectStorage.ts')],
  bundle: true, packages: 'external', platform: 'node', format: 'cjs', write: false,
});
const adapter = path.join(output, 'storage-adapter.cjs');
await writeFile(adapter, bundled.outputFiles[0].text);
const apiRequire = createRequire(path.join(workspace, 'artifacts/api-server/package.json'));
// The generated adapter's external imports use the owning package's resolver.
const Module = apiRequire('node:module');
const compiled = new Module(adapter);
compiled.paths = apiRequire.resolve.paths('@google-cloud/storage');
compiled._compile(bundled.outputFiles[0].text, adapter);
const { ObjectStorageService, objectStorageClient } = compiled.exports;
const storage = new ObjectStorageService();
const publicRoot = storage.getPublicObjectSearchPaths()[0].replace(/^\/|\/$/g, '');
const [bucketName, ...prefix] = publicRoot.split('/');
const bucket = objectStorageClient.bucket(bucketName);
const inventory = [];
const files = {};
const thumbs = [];
for (const scene of plan.scenes) {
  const original = path.join(output, 'originals', `${scene.id}-${scene.n}.jpg`);
  const input = await readFile(original);
  const sha256 = createHash('sha256').update(input).digest('hex');
  const metadata = await sharp(input).metadata();
  const width = Math.min(1280, metadata.width);
  const ratio = 16 / 9;
  const height = Math.round(width / ratio);
  const variants = [];
  for (const w of [...new Set([480, 800, width].filter(w => w <= width))]) {
    const name = `${scene.id}-${scene.n}-${sha256.slice(0, 16)}-${w}.webp`;
    const filePath = path.join(output, 'webp', name);
    const bytes = await sharp(input).resize(w, Math.round(w / ratio), { fit: 'cover', position: 'attention', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    await writeFile(filePath, bytes);
    const key = `network/v1/${name}`;
    await bucket.file([...prefix, key].join('/')).save(bytes, {
      resumable: false, metadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' },
      preconditionOpts: { ifGenerationMatch: 0 },
    }).catch(error => { if (error.code !== 412) throw error; }); // Content-addressed, existing identical upload is safe.
    files[name] = { key, bytes: bytes.length, contentType: 'image/webp', sha256: createHash('sha256').update(bytes).digest('hex') };
    variants.push({ src: `/api/network-media/${name}`, width: w });
  }
  inventory.push({
    id: scene.id, n: scene.n, src: variants.at(-1).src,
    srcSet: variants.map(v => `${v.src} ${v.width}w`).join(', '), width, height, sha256,
    prompt: `${plan.style} ${scene.scene}`,
    generatedAt: (await stat(original)).mtime.toISOString(), review: 'pending',
  });
  const thumb = await sharp(input).resize(320, 180, { fit: 'cover' }).jpeg().toBuffer();
  thumbs.push({ input: thumb, left: (thumbs.length % 4) * 320, top: Math.floor(thumbs.length / 4) * 180 });
}
await sharp({ create: { width: 1280, height: Math.ceil(thumbs.length / 4) * 180, channels: 3, background: '#ddd4c7' } })
  .composite(thumbs).jpeg({ quality: 82 }).toFile(path.join(output, 'contact-sheet.jpg'));
// Generated source metadata only: no image bytes or originals enter Git.
await writeFile(path.join(root, 'src/content/network/images.json'), JSON.stringify(inventory, null, 2) + '\n');
await mkdir(path.join(workspace, 'artifacts/api-server/content'), { recursive: true });
await writeFile(path.join(workspace, 'artifacts/api-server/content/network-media.json'), JSON.stringify({ assets: files }, null, 2) + '\n');
console.log(`Prepared ${inventory.length} distinct scenes and ${Object.keys(files).length} App Storage WebP variants. Visual reviews remain pending.`);
