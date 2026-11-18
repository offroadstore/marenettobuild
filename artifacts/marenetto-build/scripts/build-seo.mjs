import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { renderDocument, escapeHtml, SEO_ORIGIN } from './seo-document.mjs';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'dist/public');
const reports = path.resolve(root, '../../generated-artifacts/seo-audit');
await mkdir(reports, { recursive: true });
const template = await readFile(path.join(output, 'index.html'), 'utf8');
process.env.NODE_ENV = 'production';
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom' });
try {
  const { render, editions, redirects: allRedirects, blockedPublicLocale, excludedRoutes, equivalentEditions, canonicalEdition, editionStructuredData, reviewPathForEdition, reviewHubEdition, historicalInventory: originalInventory } = await vite.ssrLoadModule('/src/entry-server.tsx');
  const redirects = Object.fromEntries(Object.entries(allRedirects).filter(([source, target]) => !blockedPublicLocale(source) && !blockedPublicLocale(target)));
  const publicEditions = editions.filter(edition => !blockedPublicLocale(edition.path));
  const matrix = [];
  const heldOriginals = originalInventory.filter(page => !blockedPublicLocale(page.path) && page.state === 'awaiting-confirmation' && !page.editorialCorrection);
  const heldArticles = heldOriginals.filter(page => page.kind === 'article');
  const heldNonArticles = heldOriginals.filter(page => page.kind !== 'article');
  const pendingMessages = JSON.parse(await readFile(path.join(root, 'src/content/pending-content.json'), 'utf8'));
  const manifest = { origin: SEO_ORIGIN, indexing: false, pages: {}, errors: {}, redirects, excludedRoutes, heldPages: {}, unreviewedArticles: {}, correctedPages: {}, feeds: JSON.parse(await readFile(path.join(root, 'src/content/historical/feeds.json'), 'utf8')), heldFeeds: JSON.parse(await readFile(path.join(root, 'src/content/historical/held-feeds.json'), 'utf8')) };
  for (const edition of publicEditions) {
    if (heldOriginals.some(original => original.key === (edition.path.replace(/\/+$/, '') || '/'))) continue;
    const { body, fullTextProof, missingTranslations } = await render(edition.path, edition.locale);
    if (!body.includes('<h1') || body.includes('aria-busy="true"')) throw new Error(`Incomplete server render: ${edition.path}`);
    const canonicalPath = canonicalEdition(edition).path;
    const alternates = equivalentEditions(edition.id);
    const canonical = new URL(canonicalPath, SEO_ORIGIN).href;
    const original = originalInventory.find(page => page.path === edition.path);
    const graph = original?.state === 'awaiting-confirmation' ? undefined : editionStructuredData(edition, SEO_ORIGIN);
    const html = renderDocument(template, { edition, body, alternates, canonicalPath, structuredData: graph });
    const file = path.join(edition.path.replace(/^\/|\/$/g, ''), 'index.html');
    await mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await writeFile(path.join(output, file), html);
    manifest.pages[edition.path] = file;
    if (original?.state === 'awaiting-confirmation' && original.kind === 'article') manifest.unreviewedArticles[original.key] = file;
    if (original?.editorialCorrection) manifest.correctedPages[original.key] = original.editorialCorrection;
    matrix.push({ ...edition, editorialCorrection: original?.editorialCorrection ?? null, fullTextProof, status: 200, initialHTML: 'React server render: full body', renderedCheck: 'See separate rendered-results.json; builds do not certify browser results', h1: body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, ''), canonical, alternates: edition.state === 'published' ? alternates.map(a => a.path) : [], links: [...body.matchAll(/href="([^"]+)"/g)].map(match => match[1]), missingTranslations, checksMissing: ['native-speaker review', 'assistive technology', ...(edition.approval ? [] : ['owner approval'])] });
  }
  for (const original of heldArticles) {
    const { body } = await render(original.path, original.locale);
    const edition = { ...original, state: 'draft', approval: null, sitemap: false };
    const canonicalPath = original.path;
    const canonical = new URL(canonicalPath, SEO_ORIGIN).href;
    const file = path.join(original.path.replace(/^\/|\/$/g, ''), 'index.html');
    await mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await writeFile(path.join(output, file), renderDocument(template, { edition, body, canonicalPath }));
    manifest.pages[original.path] = file;
    manifest.unreviewedArticles[original.key] = file;
    matrix.push({ ...edition, status: 200, canonical, alternates: [], indexable: false, editorialReview: 'Exact historical copy; owner confirmation still pending', initialHTML: 'Full original body restored at historical URL; preview noindex; excluded from sitemap and hreflang' });
  }
  for (const original of heldNonArticles) {
    const { body } = await render(original.path, original.locale);
    const file = `holding${original.path}index.html`;
    await mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await writeFile(path.join(output, file), renderDocument(template, { edition: { ...original, state: 'draft', description: pendingMessages[original.locale] }, body, status: 503 }));
    manifest.heldPages[original.key] = file;
    matrix.push({ ...original, status: 503, sitemap: false, approval: null, initialHTML: 'Unavailable pending exact confirmations; no rewritten substitute' });
  }
  // Review routes are explicit. Their catalogs never override ordinary pages.
  for (const edition of editions.filter(e => e.locale !== 'it')) {
    const reviewPath = reviewPathForEdition(edition);
    if (reviewPath === edition.path) continue; // Original already rendered, not an AI draft.
    const { body, metadata, fullTextProof, missingTranslations } = await render(reviewPath, edition.locale);
    const review = { ...edition, ...metadata, path: reviewPath, state: 'translated' };
    const html = renderDocument(template, { edition: review, body });
    const file = path.join(reviewPath.slice(1), 'index.html');
    await mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await writeFile(path.join(output, file), html);
    manifest.pages[reviewPath] = file;
    matrix.push({ ...review, fullTextProof, sitemap: false, status: 200, initialHTML: 'Full React render; draft catalog', missingTranslations, h1: body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, ''), checksMissing: ['owner approval', 'native-speaker review'] });
  }
  const hubRender = await render(reviewHubEdition.path, 'it');
  await writeFile(path.join(output, '__localization-review/index.html'), renderDocument(template, { edition: reviewHubEdition, body: hubRender.body }));
  manifest.pages[reviewHubEdition.path] = '__localization-review/index.html';
  matrix.push({ ...reviewHubEdition, status: 200, initialHTML: 'Full React render; editorial tool, not public content' });
  const error = await render('/not-a-real-route', 'it');
  await writeFile(path.join(output, '404.html'), renderDocument(template, { body: error.body, status: 404 }));
  for (const locale of new Set(editions.map(e => e.locale))) {
    const notFound = await render(locale === 'it' ? '/not-a-real-route' : `/${locale}/not-a-real-route`, locale);
    const file = `errors/${locale}.html`;
    await mkdir(path.join(output, 'errors'), { recursive: true });
    await writeFile(path.join(output, file), renderDocument(template, { edition: { locale, state: 'draft', title: '404 | Marenetto Build', description: '404' }, body: notFound.body, status: 404 }));
    manifest.errors[locale] = file;
  }
  const gone = await render('/translation-ok', 'it');
  await writeFile(path.join(output, '410.html'), renderDocument(template, { body: gone.body, status: 410 }));
  await writeFile(path.join(output, 'private-shell.html'), template);
  manifest.editions = Object.fromEntries(publicEditions.map(edition => [edition.path, edition]));
  await writeFile(path.join(output, 'route-manifest.json'), JSON.stringify(manifest, null, 2));
  const published = publicEditions.filter(e => e.sitemap && e.state === 'published' && e.approval);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${published.map(e => `  <url><loc>${escapeHtml(new URL(e.path, SEO_ORIGIN).href)}</loc>${equivalentEditions(e.id).map(a => `<xhtml:link rel="alternate" hreflang="${a.locale === 'it' ? 'it-IT' : a.locale}" href="${escapeHtml(new URL(a.path, SEO_ORIGIN).href)}" />`).join('')}</url>`).join('\n')}\n</urlset>\n`;
  await writeFile(path.join(output, 'sitemap.xml'), sitemap);
  await writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  await writeFile(path.join(reports, 'route-matrix.json'), JSON.stringify({ editions: matrix, redirects, excludedRoutes }, null, 2));
  const cols = ['path', 'locale', 'id', 'kind', 'state', 'approval', 'contentLanguage', 'status', 'sitemap', 'h1', 'canonical', 'source', 'renderedCheck', 'missingTranslations', 'checksMissing'];
  await writeFile(path.join(reports, 'route-matrix.csv'), [cols.join(','), ...matrix.map(row => cols.map(key => `"${String(Array.isArray(row[key]) ? row[key].join(' | ') : row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n'));
  console.log(`Rendered ${matrix.filter(row => row.status === 200).length} successful documents, ${Object.keys(manifest.unreviewedArticles).length} unreviewed historical articles, ${Object.keys(manifest.correctedPages).length} preview-corrected pages, and ${heldNonArticles.length} temporary holding documents. Future eligible sitemap: ${published.length}. Preview remains noindex.`);
} finally { await vite.close(); }
