import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { resolveRoute, redirectQuery } from './seo-document.mjs';

const root = path.resolve(import.meta.dirname, '../dist/public');
const manifest = JSON.parse(await readFile(path.join(root, 'route-manifest.json'), 'utf8'));
const editions = Object.keys(manifest.pages).map(path => ({ path }));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };
// Deliberately preview-only. Production indexing is NOT enabled by an env typo or host header.
export const server = createServer(async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const holding = manifest.heldPages?.[pathname.replace(/\/+$/, '')];
    if (holding) {
      const content = await readFile(path.join(root, holding));
      res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '86400' });
      return res.end(req.method === 'HEAD' ? undefined : content);
    }
    if (manifest.heldFeeds?.[pathname.replace(/\/+$/, '')]) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '86400' });
      return res.end(req.method === 'HEAD' ? undefined : 'Feed temporaneamente in attesa di conferma dei contenuti.');
    }
    const feed = manifest.feeds?.[pathname.replace(/\/+$/, '')];
    if (feed) {
      const bytes = await readFile(path.join(root, feed));
      res.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-cache' });
      return res.end(req.method === 'HEAD' ? undefined : bytes);
    }
    const route = resolveRoute(pathname, editions, manifest.redirects);
    if (route.status === 308) {
      res.writeHead(308, { Location: `${route.target}${redirectQuery(url.search, route.target)}`, 'Cache-Control': 'no-cache' });
      return res.end();
    }
    let file;
    let status = route.status;
    if (route.edition) file = manifest.pages[route.edition.path];
    else if (/^\/(internal|sign-in|sign-up)(\/|$)/.test(pathname) || pathname === '/owner-demo') { file = 'private-shell.html'; status = 200; }
    else if (/^\/(?:assets|media|brand|documents)\//.test(pathname) || ['/favicon.svg', '/robots.txt', '/sitemap.xml'].includes(pathname)) {
      file = pathname.slice(1);
      status = 200;
    } else file = status === 410 ? '410.html' : manifest.errors[pathname.split('/')[1]] ?? '404.html';
    const filename = path.resolve(root, file);
    if (!filename.startsWith(`${root}/`)) { res.writeHead(404); return res.end(); }
    let content;
    try { if (!(await stat(filename)).isFile()) throw new Error('Not a file'); content = await readFile(filename); }
    catch { status = 404; file = '404.html'; content = await readFile(path.join(root, file)); }
    res.writeHead(status, {
      'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': file.startsWith('assets/') ? 'public, max-age=31536000, immutable' : file.startsWith('media/') ? 'public, max-age=86400' : 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    const malformed = error instanceof URIError;
    // Do not log query strings, headers or personal fields from requests.
    console.error('Preview HTTP request failed', { name: error.name, code: error.code ?? null });
    res.writeHead(malformed ? 400 : 500);
    res.end(malformed ? 'Bad request' : 'Internal server error');
  }
});
if (!process.env.PORT || !Number.isInteger(Number(process.env.PORT))) throw new Error('A valid PORT is required.');
server.listen(Number(process.env.PORT), '0.0.0.0', () => console.log(`Preview HTTP handler listening on ${process.env.PORT}; indexing disabled`));
