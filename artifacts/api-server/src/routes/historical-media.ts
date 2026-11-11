import { Router, type IRouter } from 'express';
import manifest from '../../content/historical-media.json';
import { ObjectStorageService } from '../lib/objectStorage';

const router: IRouter = Router();
const storage = new ObjectStorageService();
const assets: Record<string, { key: string; contentType: string; sha256: string; bytes: number }> = manifest.assets;

router.get('/historical-media/:asset', async (req, res) => {
  const name = req.params.asset;
  const asset = /^[a-f0-9]{64}\.(png|jpg|jpeg|webp|gif)$/.test(name) ? assets[name] : undefined;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!asset) { res.status(404).end(); return; }
  try {
    const file = await storage.searchPublicObject(asset.key);
    if (!file) { res.status(503).setHeader('Retry-After', '3600'); res.end(); return; }
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Content-Length', asset.bytes);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"${asset.sha256}"`);
    if (req.get('If-None-Match') === `"${asset.sha256}"`) { res.status(304).end(); return; }
    const stream = file.createReadStream();
    stream.on('error', () => {
      req.log.error({ asset: name }, 'Historical media storage read failed');
      if (!res.headersSent) res.status(503).end();
      else res.destroy();
    });
    stream.pipe(res);
  } catch {
    req.log.error({ asset: name }, 'Historical media unavailable');
    res.status(503).setHeader('Retry-After', '3600'); res.end();
  }
});
export default router;
