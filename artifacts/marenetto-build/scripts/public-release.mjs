import { escapeHtml, redirectQuery, resolveRoute } from './seo-document.mjs';

export const PUBLIC_ORIGIN = 'https://www.marenettobuild.com';
export const APPROVED_LOCALES = new Set(['it', 'en', 'de', 'fr', 'es', 'nl', 'pt', 'pl', 'ru', 'sv', 'no', 'da']);
export const PUBLIC_ROBOTS = `User-agent: *
Allow: /
Disallow: /internal
Disallow: /api/
Disallow: /owner-demo
Disallow: /sign-in
Disallow: /sign-up
Disallow: /__localization-review
Sitemap: ${PUBLIC_ORIGIN}/sitemap.xml
`;

export function publicHost(req) {
  const forwarded = req.headers['x-forwarded-host'];
  const raw = String((Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.headers.host || '');
  return raw.split(',')[0].trim().toLowerCase().replace(/:443$/, '');
}
export function canonicalRedirect(req, manifest, env = process.env) {
  if (env.NODE_ENV !== 'production') return undefined;
  const host = publicHost(req);
  if (!['marenettobuild.com', 'www.marenettobuild.com'].includes(host)) return undefined;
  const url = new URL(req.url, PUBLIC_ORIGIN);
  const pathname = decodeURIComponent(url.pathname);
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const historicalAlias = normalized === '/en/articoli' ? '/en/articles/' : undefined;
  const route = historicalAlias ? { status: 308, target: historicalAlias } :
    resolveRoute(pathname, Object.keys(manifest.pages).map(path => ({ path })), manifest.redirects);
  const protocol = String(req.headers['x-forwarded-proto'] ?? 'https').split(',')[0].trim();
  if (host === 'www.marenettobuild.com' && protocol === 'https' && route.status !== 308) return undefined;
  // Compose host, HTTPS and historical path normalization in one application hop.
  const target = route.status === 308 ? route.target : pathname;
  return `${PUBLIC_ORIGIN}${target}${route.status === 308 ? redirectQuery(url.search, target) : url.search}`;
}
export function indexingEnabled(req, env = process.env) {
  // Second release gate, enabled only after production redirects are proven.
  return env.NODE_ENV === 'production' && env.MARENETTO_PUBLIC_INDEXING === 'true' &&
    publicHost(req) === 'www.marenettobuild.com';
}
export function publicEditions(manifest, active = []) {
  const withdrawn = new Set(active.filter(e => e.revisionId === 'withdrawn')
    .flatMap(e => [e.path, ...(e.aliases ?? [])]).map(path => path.replace(/\/+$/, '') || '/'));
  return Object.values(manifest.editions).filter(e =>
    APPROVED_LOCALES.has(e.locale) && e.kind !== 'search' && manifest.pages[e.path] &&
    e.path !== '/en/articoli/' && !e.path.startsWith('/__localization-review') &&
    !withdrawn.has(e.path.replace(/\/+$/, '') || '/'));
}
export function alternateEditions(edition, entries) {
  const byLocale = new Map();
  for (const entry of entries.filter(e => e.id === edition.id)) {
    if (!byLocale.has(entry.locale) || entry.path === edition.path) byLocale.set(entry.locale, entry);
  }
  return [...byLocale.values()];
}
export function alternateLinks(edition, entries) {
  const alternates = alternateEditions(edition, entries);
  return [...alternates.map(e => ({ lang: e.locale === 'it' ? 'it-IT' : e.locale, path: e.path })),
    ...alternates.filter(e => e.locale === 'it').map(e => ({ lang: 'x-default', path: e.path }))];
}
export function releaseSitemap(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.map(e => `  <url><loc>${escapeHtml(PUBLIC_ORIGIN + e.path)}</loc>${alternateLinks(e, entries).map(a => `<xhtml:link rel="alternate" hreflang="${a.lang}" href="${escapeHtml(PUBLIC_ORIGIN + a.path)}" />`).join('')}</url>`).join('\n')}\n</urlset>\n`;
}
export function publicDocument(html, edition, entries) {
  return String(html).replace('<html ', '<html data-public-indexing="true" ')
    .replace(/<meta\b[^>]*name="robots"[^>]*>/g, '<meta name="robots" content="index, follow" />')
    .replace(/<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>/g, '')
    .replace(/(<meta\b[^>]*property="og:url"[^>]*content=")[^"]*"/g, `$1${PUBLIC_ORIGIN}${escapeHtml(edition.path)}"`)
    .replace('</head>', `<link rel="canonical" href="${escapeHtml(PUBLIC_ORIGIN + edition.path)}" />\n${alternateLinks(edition, entries).map(a => `<link rel="alternate" hreflang="${a.lang}" href="${escapeHtml(PUBLIC_ORIGIN + a.path)}" />`).join('\n')}\n</head>`);
}
