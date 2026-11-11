import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
const workspace = path.resolve(import.meta.dirname, '..');
const output = path.join(workspace, 'generated-artifacts/production-audit-2026-11-11');
const built = path.join(workspace, 'artifacts/marenetto-build/dist/public');
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(path.join(built, 'route-manifest.json'), 'utf8'));
const editions = Object.values(manifest.editions);
const pages = [];
const strip = value => value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
for (const [url, file] of Object.entries(manifest.pages)) {
  const html = await readFile(path.join(built, file), 'utf8');
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
  const description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1] ?? '';
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i)?.[1] ?? '';
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => strip(match[1]));
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]);
  const structuredData = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  pages.push({
    path: url, file, title, titleChars: strip(title).length, description, descriptionChars: description.length,
    canonical, h1, noindex: /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html),
    imageCount: images.length, imagesMissingAltAttribute: images.filter(image => !/\balt=/.test(image)).length,
    structuredDataCount: structuredData.length,
    invalidStructuredData: structuredData.filter(match => { try { JSON.parse(match[1]); return false; } catch { return true; } }).length,
    htmlBytes: Buffer.byteLength(html),
  });
}
const assets = [];
for (const file of await readdir(path.join(built, 'assets'))) {
  if (!/\.(?:js|css)$/.test(file)) continue;
  const bytes = await readFile(path.join(built, 'assets', file));
  assets.push({ file, bytes: bytes.length, gzipBytes: gzipSync(bytes).length });
}
const headerNames = ['content-type', 'cache-control', 'x-robots-tag', 'content-security-policy',
  'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy',
  'access-control-allow-origin', 'access-control-allow-credentials', 'vary'];
const responses = [];
for (const route of ['/', '/robots.txt', '/sitemap.xml', '/api/healthz', '/api/internal/session', '/audit-route-non-esistente-2026/']) {
  const response = await fetch('http://127.0.0.1:80' + route, {
    headers: { Origin: 'https://audit.invalid' }, redirect: 'manual',
  });
  const body = await response.text();
  responses.push({
    path: route, status: response.status,
    headers: Object.fromEntries(headerNames.filter(header => response.headers.has(header)).map(header => [header, response.headers.get(header)])),
    bodyStart: ['/robots.txt', '/sitemap.xml', '/api/healthz', '/api/internal/session'].includes(route) ? body.slice(0, 2000) : undefined,
    initialHTMLHasH1: /<h1\b/.test(body), initialHTMLHasBody: /data-historical-body/.test(body),
  });
}
const duplicateTitles = Object.entries(Object.groupBy(pages, page => page.title)).filter(([, rows]) => rows.length > 1).map(([title, rows]) => ({ title, count: rows.length, paths: rows.map(row => row.path) }));
const summary = {
  createdAt: new Date().toISOString(), scope: 'Development preview and existing generated HTML; no production requests or user-data writes.',
  generatedHTMLPages: pages.length, registeredEditions: editions.length,
  editionStates: Object.fromEntries(Object.entries(Object.groupBy(editions, edition => edition.state)).map(([state, rows]) => [state, rows.length])),
  eligibleSitemapEditions: editions.filter(edition => edition.state === 'published' && edition.approval && edition.sitemap).length,
  manifestOrigin: manifest.origin, manifestIndexing: manifest.indexing,
  missingTitle: pages.filter(page => !page.title).length,
  missingDescription: pages.filter(page => !page.description).length,
  missingCanonical: pages.filter(page => !page.canonical).length,
  noH1: pages.filter(page => !page.h1.length).length,
  multipleH1: pages.filter(page => page.h1.length > 1).length,
  noindexPages: pages.filter(page => page.noindex).length,
  duplicateTitleGroups: duplicateTitles.length,
  imagesMissingAltAttributeOccurrences: pages.reduce((total, page) => total + page.imagesMissingAltAttribute, 0),
  invalidStructuredData: pages.reduce((total, page) => total + page.invalidStructuredData, 0),
  legalEditionsFound: editions.filter(edition => /privacy|cookie|termini/i.test(edition.id + ' ' + edition.path + ' ' + edition.title)).map(edition => edition.path),
  largestJS: assets.filter(asset => asset.file.endsWith('.js')).sort((a, b) => b.bytes - a.bytes).slice(0, 5),
  responses,
};
await writeFile(path.join(output, 'technical-audit.json'), JSON.stringify({ summary, pages, duplicateTitles, assets }, null, 2));
console.log(JSON.stringify(summary, null, 2));
