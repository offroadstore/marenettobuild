export const SEO_ORIGIN = new URL(process.env.VITE_PUBLIC_SITE_URL || 'https://preview.invalid').origin;
export const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export function redirectQuery(search, target) {
  const allowed = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id']);
  if (/\/(?:ricerca|search)$/.test(target)) allowed.add('q');
  const safe = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(search)) if (allowed.has(key) && !safe.has(key)) safe.append(key, value);
  return safe.size ? `?${safe}` : '';
}

export function renderDocument(template, { edition, body, alternates = [], canonicalPath, status = 200, structuredData = [] }) {
  const locale = edition?.locale ?? 'it';
  const title = edition?.title ?? (status === 410 ? 'Pagina rimossa | Marenetto Build' : 'Pagina non trovata | Marenetto Build');
  const description = edition?.description ?? 'La pagina richiesta non è disponibile. Torna alla homepage di Marenetto Build.';
  const canonical = new URL(canonicalPath ?? edition?.path ?? '/', SEO_ORIGIN).href;
  let html = template
    .replace(/<html[^>]*>/, `<html lang="${locale === 'it' ? 'it-IT' : locale}" dir="ltr" data-edition-locale="${locale}">`)
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>/g, '')
    .replace(/<meta\b[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const metas = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="robots" content="noindex, nofollow" />`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    ...Object.entries({ title, description, url: canonical, type: edition?.kind === 'article' ? 'article' : 'website', locale: locale === 'it' ? 'it_IT' : locale }).map(([key, value]) => `<meta property="og:${key}" content="${escapeHtml(value)}" />`),
    `<meta property="og:image" content="${SEO_ORIGIN}/media/home/approved-hero-1672.jpg" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${SEO_ORIGIN}/media/home/approved-hero-1672.jpg" />`,
  ];
  if (status === 200) {
    metas.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`);
    // Unreviewed editions must not claim published equivalents, including x-default.
    if (edition?.state === 'published') for (const alternate of alternates) {
      metas.push(`<link rel="alternate" hreflang="${alternate.locale === 'it' ? 'it-IT' : alternate.locale}" href="${escapeHtml(new URL(alternate.path, SEO_ORIGIN).href)}" />`);
    }
    if (edition?.state === 'published' && alternates.some(a => a.locale === 'it')) {
      metas.push(`<link rel="alternate" hreflang="x-default" href="${escapeHtml(new URL(alternates.find(a => a.locale === 'it').path, SEO_ORIGIN).href)}" />`);
    }
  }
  if (structuredData.length) metas.push(`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': structuredData }).replaceAll('<', '\\u003c')}</script>`);
  return html.replace('</head>', `${metas.join('\n')}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

export function resolveRoute(pathname, editions, redirects) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/translation-ok') return { status: 410 };
  const edition = editions.find(e => (e.path.replace(/\/+$/, '') || '/') === normalized);
  if (!edition && redirects[normalized]) return { status: 308, target: redirects[normalized] };
  if (!edition) return { status: 404 };
  if (pathname !== edition.path) return { status: 308, target: edition.path };
  return { status: 200, edition };
}
