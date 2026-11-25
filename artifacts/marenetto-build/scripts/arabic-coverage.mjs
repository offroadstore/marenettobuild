import { createServer } from 'vite';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

process.env.PORT ||= '4188';
process.env.BASE_PATH ||= '/';
const root = path.resolve(import.meta.dirname, '..');
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { editions, render, editionStructuredData, redirects } = await vite.ssrLoadModule('/src/entry-server.tsx');
  const { releaseMetadata } = await vite.ssrLoadModule('/src/localization/public-seo.mjs');
  const { NETWORK_PAGES, networkPublic, networkPreviewPath } = await vite.ssrLoadModule('/src/content/network/index.ts');
  const { ARABIC_PUBLIC_RELEASE } = await vite.ssrLoadModule('/src/localization/arabic-release.ts');
  const { ARABIC_EDITORIAL_ARTICLES } = await vite.ssrLoadModule('/src/content/arabic-editorial/index.ts');
  const all = editions.filter(e => e.locale === 'ar');
  const findings = new Set();
  const known = new Set([...editions.map(e => e.path.replace(/\/+$/, '') || '/'), ...Object.keys(redirects)]);
  const rows = [];
  const errors = [];
  for (const edition of all) {
    try {
    const requestPath = ARABIC_PUBLIC_RELEASE ? edition.path : `/__localization-review/ar-site${edition.path.slice(3)}`;
    const result = await render(requestPath, 'ar');
    result.missingTranslations.forEach(s => findings.add(s));
    const metadata = releaseMetadata(edition, result.body, editions);
    const hrefs = [...result.body.matchAll(/\bhref="([^"]+)"/g)].map(m => m[1].replaceAll('&amp;', '&'));
    const missingLinks = [...new Set(hrefs.filter(h => h.startsWith('/') && !h.startsWith('//'))
      .map(h => h.split(/[?#]/)[0].replace(/\/+$/, '') || '/')
      .filter(h => !known.has(h) && !/^\/(?:__|internal|sign-in|sign-up|documents|assets|fonts|images|api|brand)(?:\/|$)/.test(h)))];
    const graph = editionStructuredData(edition, 'https://www.marenettobuild.com');
    rows.push({
      path: edition.path, id: edition.id, state: edition.state, source: edition.source,
      title: metadata.title, titleLength: [...metadata.title].length,
      description: metadata.description, descriptionLength: [...metadata.description].length,
      h1Count: (result.body.match(/<h1\b/g) ?? []).length,
      arabicCharacters: (result.body.match(/\p{Script=Arabic}/gu) ?? []).length,
      missingLinks, schemas: graph.map(n => n['@type']),
      sampleLatin: [...new Set((result.body.replace(/<[^>]*>/g, ' ').match(/[A-Za-z][A-Za-z0-9®().,/:;—–'’ -]{14,}/g) ?? []).map(s => s.trim()))],
    });
    } catch (error) { errors.push({ path: edition.path, message: error.message }); }
  }
  const output = path.resolve(root, '../../generated-artifacts/atelier');
  await mkdir(output, { recursive: true });
  const network = NETWORK_PAGES.filter(p => p.locale === 'ar').map(p => ({ path: p.path, public: networkPublic(p), preview: networkPreviewPath(p.locale, p.id) }));
  const report = { released: ARABIC_PUBLIC_RELEASE, total: rows.length, errors, network, articles: ARABIC_EDITORIAL_ARTICLES.length, missingTranslations: [...findings].sort(), pages: rows };
  await writeFile(path.join(output, 'arabic-coverage.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    released: report.released, total: rows.length, articles: report.articles,
    errors,
    networkPublic: network.filter(p => p.public).length,
    missingTranslations: report.missingTranslations,
    invalid: rows.filter(r => r.h1Count !== 1 || r.arabicCharacters < 100 || r.missingLinks.length || r.titleLength < 50 || r.titleLength > 60 || r.descriptionLength < 140 || r.descriptionLength > 160)
      .map(({ path, id, titleLength, descriptionLength, h1Count, missingLinks }) => ({ path, id, titleLength, descriptionLength, h1Count, missingLinks })),
    uniqueLatin: [...new Set(rows.flatMap(r => r.sampleLatin))],
  }, null, 2));
} finally { await vite.close(); }
