import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outputRoot = path.join(root, 'dist/public');
const origin = new URL(process.env.VITE_PUBLIC_SITE_URL || 'https://marenetto-build-sito-e-portale.replit.app').origin;
const localeRecords = JSON.parse(await readFile(path.join(root, 'src/localization/locales.json'), 'utf8'));
const publicPages = JSON.parse(await readFile(path.join(root, 'src/localization/public-pages.json'), 'utf8'));
const requiredPages = ['home', 'services', 'process', 'abroad', 'request', 'contact'];
const published = localeRecords.filter(locale => locale.publication === 'published');
const template = await readFile(path.join(outputRoot, 'index.html'), 'utf8');

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function setMeta(html, attribute, key, tag) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<meta\\s+${attribute}="${escapedKey}"[^>]*>`);
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function renderPageHtml(baseHtml, locale, pageKey, pageData) {
  const localeTag = locale.code === 'it' ? 'it-IT' : locale.code;
  const canonical = new URL(pageData.path, origin).toString();
  const alternates = published.map(alternateLocale => [
    alternateLocale.code === 'it' ? 'it-IT' : alternateLocale.code,
    publicPages[alternateLocale.code][pageKey].path,
  ]);
  alternates.push(['x-default', publicPages.it[pageKey].path]);
  let html = baseHtml
    .replace(/<html[^>]*>/, `<html lang="${localeTag}" dir="${locale.direction}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageData.title)}</title>`);

  html = setMeta(html, 'name', 'description', `<meta name="description" content="${escapeHtml(pageData.description)}" />`);
  html = setMeta(html, 'property', 'og:title', `<meta property="og:title" content="${escapeHtml(pageData.title)}" />`);
  html = setMeta(html, 'property', 'og:description', `<meta property="og:description" content="${escapeHtml(pageData.description)}" />`);
  html = setMeta(html, 'property', 'og:url', `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  html = setMeta(html, 'property', 'og:locale', `<meta property="og:locale" content="${locale.code === 'it' ? 'it_IT' : locale.code === 'en' ? 'en_GB' : locale.code}" />`);
  html = setMeta(html, 'name', 'twitter:title', `<meta name="twitter:title" content="${escapeHtml(pageData.title)}" />`);
  html = setMeta(html, 'name', 'twitter:description', `<meta name="twitter:description" content="${escapeHtml(pageData.description)}" />`);

  const alternateTags = alternates.map(([hreflang, pathname]) => `<link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(new URL(pathname, origin).toString())}" />`).join('\n    ');
  const canonicalAndAlternates = `<link rel="canonical" href="${escapeHtml(canonical)}" />\n    ${alternateTags}`;
  html = html.replace(/<link\s+rel="canonical"[^>]*>\s*/g, '');
  return html.replace('</head>', `    ${canonicalAndAlternates}\n  </head>`);
}

if (localeRecords.length !== 29 || new Set(localeRecords.map(locale => locale.code)).size !== 29) {
  throw new Error(`Expected 29 unique locale records; found ${localeRecords.length}.`);
}
if (published.length !== 29 || !published.every(locale => locale.copyStatus === 'complete' && locale.reviewStatus === 'approved-current-copy')) {
  throw new Error('All 29 locales must have complete, owner-approved copy before the public build.');
}

const sitemapEntries = [];
for (const locale of published) {
  const translations = publicPages[locale.code];
  if (!translations || requiredPages.some(page => !translations[page]?.path || !translations[page]?.title || !translations[page]?.description)) {
    throw new Error(`Locale ${locale.code} is missing page content or SEO metadata.`);
  }
  if (!requiredPages.every(page => locale.completePages?.includes(page))) {
    throw new Error(`Locale ${locale.code} is missing editorially complete pages.`);
  }

  for (const pageKey of requiredPages) {
    const pageData = translations[pageKey];
    const targetPath = pageData.path.replace(/^\/+|\/+$/g, '');
    const pageDirectory = path.join(outputRoot, targetPath);
    await mkdir(pageDirectory, { recursive: true });
    await writeFile(path.join(pageDirectory, 'index.html'), renderPageHtml(template, locale, pageKey, pageData));

    const alternateLinks = [
      ...published.map(alternateLocale => [
        alternateLocale.code === 'it' ? 'it-IT' : alternateLocale.code,
        publicPages[alternateLocale.code][pageKey].path,
      ]),
      ['x-default', publicPages.it[pageKey].path],
    ].map(([hreflang, pathname]) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(new URL(pathname, origin).toString())}" />`).join('\n');
    sitemapEntries.push(`  <url>\n    <loc>${escapeXml(new URL(pageData.path, origin).toString())}</loc>\n${alternateLinks}\n  </url>`);
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapEntries.join('\n')}\n</urlset>\n`;
await writeFile(path.join(outputRoot, 'sitemap.xml'), sitemap);
