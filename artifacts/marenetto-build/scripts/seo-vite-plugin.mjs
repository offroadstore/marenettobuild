import { readFile } from 'node:fs/promises';
import { renderDocument, resolveRoute, redirectQuery, SEO_ORIGIN } from './seo-document.mjs';

export function seoPreviewPlugin() {
  return {
    name: 'marenetto-html-response',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://preview.invalid');
        const pathname = url.pathname;
        if (!['GET', 'HEAD'].includes(req.method) || /^\/(?:@|src\/|node_modules\/|assets\/|media\/|brand\/|api(?:\/|$)|__mockup(?:\/|$))/.test(pathname) || /\.(?:js|css|json|svg|png|jpe?g|webp|avif|woff2?|txt|xml)(?:$|\?)/.test(pathname)) return next();
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
        if (/^\/(?:internal|sign-in|sign-up)(?:\/|$)/.test(pathname) || pathname === '/owner-demo') return next();
        try {
          const held = JSON.parse(await readFile(`${server.config.root}/src/content/historical/held-feeds.json`, 'utf8'));
          if (held[pathname.replace(/\/+$/, '')]) {
            res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '86400' });
            return res.end(req.method === 'HEAD' ? undefined : 'Feed temporaneamente in attesa di conferma dei contenuti.');
          }
          const feeds = JSON.parse(await readFile(`${server.config.root}/src/content/historical/feeds.json`, 'utf8'));
          const feed = feeds[pathname.replace(/\/+$/, '')];
          if (feed) {
            res.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-cache' });
            return res.end(req.method === 'HEAD' ? undefined : await readFile(`${server.config.root}/public/${feed}`));
          }
          const module = await server.ssrLoadModule('/src/entry-server.tsx');
          const originals = module.historicalInventory;
          const original = originals.find(page => page.key === (pathname.replace(/\/+$/, '') || '/'));
          const holding = original?.state === 'awaiting-confirmation' && original.kind !== 'article' && !original.editorialCorrection ? original : undefined;
          if (holding) {
            const pending = JSON.parse(await readFile(`${server.config.root}/src/content/pending-content.json`, 'utf8'));
            const rendered = await module.render(pathname, holding.locale);
            const template = await server.transformIndexHtml(pathname, await readFile(`${server.config.root}/index.html`, 'utf8'));
            res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '86400' });
            return res.end(req.method === 'HEAD' ? undefined : renderDocument(template, { edition: { ...holding, state: 'draft', description: pending[holding.locale] }, body: rendered.body, status: 503 }));
          }
          const isReview = /^\/__localization-review\/[a-z]{2}\//.test(pathname);
          const reviewMatch = pathname.match(/^\/__localization-review\/([a-z]{2})\/(.+)$/);
          let route = resolveRoute(pathname, module.editions, module.redirects);
          if (pathname === module.reviewHubEdition.path) route = { status: 200, edition: module.reviewHubEdition };
          if (isReview && reviewMatch) {
            const source = module.editions.find(e => module.reviewPathForEdition(e) === pathname);
            if (source) route = { status: 200, edition: { ...source, path: pathname, state: 'translated' } };
          }
          if (route.status === 308) { res.writeHead(308, { Location: `${route.target}${redirectQuery(url.search, route.target)}` }); return res.end(); }
          const candidate = pathname.split('/')[1];
          const locale = route.edition?.locale ?? (module.editions.some(e => e.locale === candidate) ? candidate : 'it');
          const rendered = await module.render(pathname, locale);
          const template = await server.transformIndexHtml(pathname, await readFile(`${server.config.root}/index.html`, 'utf8'));
          const html = renderDocument(template, {
            edition: route.edition ? { ...route.edition, ...rendered.metadata } : undefined, body: rendered.body, status: route.status,
            alternates: route.edition ? module.equivalentEditions(route.edition.id) : [],
            canonicalPath: route.edition ? module.canonicalEdition(route.edition).path : undefined,
            structuredData: route.edition && original?.state !== 'awaiting-confirmation' ? module.editionStructuredData(route.edition, SEO_ORIGIN) : [],
          });
          res.writeHead(route.status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
          return res.end(req.method === 'HEAD' ? undefined : html);
        } catch (error) { return next(error); }
      });
    },
  };
}
