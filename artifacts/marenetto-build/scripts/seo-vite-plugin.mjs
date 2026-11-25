import { readFile } from 'node:fs/promises';
import { withFontPreload } from './font-preloads.mjs';
import { siteIconResources } from './site-icons.mjs';
import { renderDocument, resolveRoute, redirectQuery, SEO_ORIGIN } from './seo-document.mjs';
import { readActiveEditorial, editorialDocument, editorialUnavailableHTML, withEditorialSnapshot, key } from './editorial-http.mjs';

export function seoPreviewPlugin() {
  return {
    name: 'marenetto-html-response',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        return withFontPreload(html, 'it', context.path);
      },
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://preview.invalid');
        const pathname = url.pathname;
        const icon = siteIconResources.get(pathname);
        if (icon && ['GET', 'HEAD'].includes(req.method)) {
          const bytes = await readFile(`${server.config.root}/public${pathname}`);
          res.writeHead(200, { 'Content-Type': icon.type, 'Content-Length': bytes.length, 'Cache-Control': icon.cache, 'X-Robots-Tag': 'noindex, nofollow' });
          return res.end(req.method === 'HEAD' ? undefined : bytes);
        }
        if (pathname === '/llms.txt') {
          res.setHeader('X-Robots-Tag', 'noindex, nofollow');
          return next();
        }
        if (pathname === '/robots.txt') {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' });
          return res.end(req.method === 'HEAD' ? undefined : 'User-agent: *\nDisallow: /\n');
        }
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
          const blockedLocale = module.blockedPublicLocale(decodeURIComponent(pathname));
          if (blockedLocale) {
            const { body } = await module.render(pathname, blockedLocale);
            const template = await server.transformIndexHtml(pathname, await readFile(`${server.config.root}/index.html`, 'utf8'));
            const html = renderDocument(template, { edition: { locale: blockedLocale, state: 'draft' }, body, status: 404 });
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
            return res.end(req.method === 'HEAD' ? undefined : html);
          }
          const active = await readActiveEditorial();
          const live = active.find(e => [e.path,...(e.aliases ?? [])].some(path => key(path) === key(pathname)));
          const dynamicLibrary = module.editions.find(e => key(e.path) === key(pathname) && ['articles','guides','search'].includes(e.id));
          if (live || (dynamicLibrary && active.some(e => e.kind === 'article' && e.locale === dynamicLibrary.locale))) {
            const locale = live?.locale ?? dynamicLibrary.locale;
            const rendered = await module.render(pathname, locale, active);
            const template = await server.transformIndexHtml(pathname, await readFile(`${server.config.root}/index.html`, 'utf8'));
            const status = live?.revisionId === 'withdrawn' ? 404 : 200;
            const edition = live ?? { ...dynamicLibrary, content: { seoTitle: dynamicLibrary.title, seoDescription: dynamicLibrary.description } };
            res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
            return res.end(req.method === 'HEAD' ? undefined : editorialDocument(template, rendered, edition, active, status));
          }
          const originals = module.historicalInventory;
          const original = originals.find(page => page.key === (pathname.replace(/\/+$/, '') || '/'));
          const holding = original?.state === 'awaiting-confirmation' && original.kind !== 'article' && !original.editorialCorrection ? original : undefined;
          if (holding) {
            const pending = JSON.parse(await readFile(`${server.config.root}/src/content/pending-content.json`, 'utf8'));
            const rendered = await module.render(pathname, holding.locale);
            const template = await server.transformIndexHtml(pathname, await readFile(`${server.config.root}/index.html`, 'utf8'));
            res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '86400' });
            return res.end(req.method === 'HEAD' ? undefined : withEditorialSnapshot(renderDocument(template, { edition: { ...holding, state: 'draft', description: pending[holding.locale] }, body: rendered.body, status: 503 }), active));
          }
          const isReview = /^\/__localization-review\/[a-z]{2}\//.test(pathname);
          const reviewMatch = pathname.match(/^\/__localization-review\/([a-z]{2})\/(.+)$/);
          let route = resolveRoute(pathname, module.editions, module.redirects);
          // Development-only, noindex editorial previews. These are never
          // emitted by build-seo or recognized by the production handler.
          const networkPreview = !server.config.isProduction && module.networkPreviewPage(pathname);
          if (networkPreview) route = { status: 200, edition: {
            ...networkPreview, path: pathname, state: 'draft', sitemap: false, approval: null,
            contentLanguage: networkPreview.locale,
          } };
          const networkServicesLocale = !server.config.isProduction && pathname.match(/^\/__network-services-review\/([a-z]{2})\/?$/)?.[1];
          if (networkServicesLocale && module.NETWORK_PAGES.some(page => page.locale === networkServicesLocale)) {
            const source = module.editions.find(e => e.locale === networkServicesLocale && e.id === 'service-local');
            route = { status: 200, edition: { ...source, path: pathname, state: 'draft', sitemap: false, approval: null } };
          }
          if (pathname === module.reviewHubEdition.path) route = { status: 200, edition: module.reviewHubEdition };
          if (isReview && reviewMatch) {
            const source = module.editions.find(e => module.reviewPathForEdition(e) === pathname);
            if (source) route = { status: 200, edition: { ...source, path: pathname, state: 'translated' } };
          }
          if (route.status === 308) { res.writeHead(308, { Location: `${route.target}${redirectQuery(url.search, route.target)}` }); return res.end(); }
          const candidate = pathname.split('/')[1];
          const locale = route.edition?.locale ?? (module.editions.some(e => e.locale === candidate) ? candidate : 'it');
          const rendered = await module.render(pathname, locale, active);
          const template = await server.transformIndexHtml(pathname, await readFile(`${server.config.root}/index.html`, 'utf8'));
          const html = renderDocument(template, {
            edition: route.edition ? { ...route.edition, ...rendered.metadata } : undefined, body: rendered.body, status: route.status,
            alternates: route.edition ? module.equivalentEditions(route.edition.id) : [],
            canonicalPath: networkPreview?.path ?? (route.edition ? module.canonicalEdition(route.edition).path : undefined),
            structuredData: networkPreview ? module.networkStructuredData(networkPreview, SEO_ORIGIN) :
              route.edition && (route.edition.kind === 'article' || original?.state !== 'awaiting-confirmation' || route.edition.approval) ? module.editionStructuredData(route.edition, SEO_ORIGIN) : [],
          });
          res.writeHead(route.status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
          return res.end(req.method === 'HEAD' ? undefined : withEditorialSnapshot(html, active));
        } catch (error) {
          if (error.code === 'EDITORIAL_UNAVAILABLE') {
            res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '30' });
            return res.end(req.method === 'HEAD' ? undefined : editorialUnavailableHTML);
          }
          return next(error);
        }
      });
    },
  };
}
