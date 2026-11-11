// Test-only router: the standalone HTML handler is not the artifact gateway.
// Forward only immutable public images to the running API; never proxy lead,
// authentication or private-file operations from the regression suite.
import { createServer, request } from 'node:http';

const port = Number(process.env.PORT ?? 4188);
const staticPort = port + 1;
process.env.PORT = String(staticPort);
await import('../scripts/serve-seo.mjs');

createServer((req, res) => {
  let pathname;
  try { pathname = new URL(req.url, 'http://localhost').pathname; }
  catch { res.writeHead(400); res.end(); return; }
  const publicImage = ['GET', 'HEAD'].includes(req.method)
    && /^\/api\/historical-media\/[a-f0-9]{64}\.(?:png|jpe?g|webp|gif)$/.test(pathname);
  const targetPort = publicImage ? 80 : staticPort;
  const headers = { ...req.headers, host: `127.0.0.1:${targetPort}` };
  delete headers.authorization;
  delete headers.cookie;
  const upstream = request({
    hostname: '127.0.0.1', port: targetPort,
    method: req.method, path: req.url, headers,
  }, response => {
    res.writeHead(response.statusCode ?? 502, response.headers);
    response.pipe(res);
  });
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502);
    res.end('Test preview upstream unavailable');
  });
  req.pipe(upstream);
}).listen(port, '127.0.0.1', () => {
  console.log(`Test-only preview gateway listening on ${port}`);
});
