import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { publicEditions, PUBLIC_ORIGIN } from './public-release.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';

// Read-only audit of the real candidate HTTP handler. Its editorial upstream is
// an isolated empty snapshot: no customer data, mutations or email deliveries.
const manifest = JSON.parse(await readFile(new URL('../dist/public/route-manifest.json', import.meta.url)));
const entries = publicEditions(manifest);
const topology = await editorialTopology({ publicIndexing: true });
const headers = { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' };
const report = { scope: 'Candidate, not deployed production; isolated editorial snapshot', pages: [], links: [], images: [], failures: [] };
const fail = (path, message) => report.failures.push({ path, message });
const decode = value => String(value).replaceAll('&amp;', '&').replaceAll('&quot;', '"');
const paths = new Set();
const images = new Set();
const titles = new Map();
const descriptions = new Map();
async function candidateHead(path) {
  for (let hop = 0; hop < 5; hop++) {
    const response = await fetch(topology.origin + path, { headers, method: 'HEAD', redirect: 'manual' });
    const location = response.headers.get('location');
    if (!location || ![301, 302, 307, 308].includes(response.status)) return response;
    const target = new URL(location, PUBLIC_ORIGIN);
    if (target.origin !== PUBLIC_ORIGIN) return response;
    path = target.pathname + target.search;
  }
  throw new Error('Internal redirect loop: ' + path);
}
try {
  const xml = await (await fetch(topology.origin + '/sitemap.xml', { headers })).text();
  const sitemapPaths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(decode(m[1])).pathname);
  if (sitemapPaths.length !== entries.length) fail('/sitemap.xml', 'Inventory count differs');
  for (const path of sitemapPaths) {
    const response = await fetch(topology.origin + path, { headers });
    const html = await response.text();
    const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    const og = html.match(/<meta property="og:url" content="([^"]*)"/)?.[1];
    report.pages.push({ path, status: response.status, title, description, canonical });
    if (response.status !== 200) fail(path, `Sitemap URL returned ${response.status}`);
    if (response.headers.has('x-robots-tag') || /name="robots" content="[^"]*noindex/.test(html)) fail(path, 'Unexpected noindex');
    if (decode(canonical) !== PUBLIC_ORIGIN + path || decode(og) !== PUBLIC_ORIGIN + path) fail(path, 'Canonical/Open Graph mismatch');
    for (const [kind, value, seen] of [['title', title, titles], ['description', description, descriptions]]) {
      if (!value) fail(path, `Missing ${kind}`);
      if (seen.has(value)) fail(path, `Duplicate ${kind}: ${seen.get(value)}`);
      seen.set(value, path);
    }
    const graphs = [];
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { const data = JSON.parse(match[1]); graphs.push(...(data['@graph'] ?? [data])); }
      catch { fail(path, 'Invalid JSON-LD'); }
    }
    const organization = graphs.find(graph => graph['@type'] === 'GeneralContractor');
    if (!organization?.name || organization.address?.addressLocality !== 'Cefalù' ||
      !organization.telephone || !organization.areaServed) fail(path, 'Incomplete GeneralContractor data');
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\balt=/.test(match[0])) fail(path, 'Image without alt');
      const src = match[0].match(/\bsrc="([^"]+)"/)?.[1];
      if (src?.startsWith('/')) images.add(decode(src));
    }
    for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)) {
      const url = new URL(decode(match[1]), PUBLIC_ORIGIN + path);
      if (url.origin === PUBLIC_ORIGIN) paths.add(url.pathname);
    }
  }
  for (const path of paths) {
    if (/^\/(?:internal|sign-in|sign-up|__localization-review|owner-demo)(?:\/|$)/.test(path)) continue;
    const response = await candidateHead(path);
    report.links.push({ path, status: response.status });
    if (response.status >= 400) fail(path, `Internal link returned ${response.status}`);
  }
  for (const path of images) {
    // The fixture intentionally has no media service. Check actual read-only
    // historical media against the workspace gateway, never a production POST.
    const url = path.startsWith('/api/historical-media/') ? 'http://localhost:80' + path : topology.origin + path;
    const response = await fetch(url, { headers, method: 'HEAD' });
    const bytes = Number(response.headers.get('content-length')) || null;
    report.images.push({ path, status: response.status, bytes });
    if (response.status !== 200) fail(path, `Image returned ${response.status}`);
  }
} finally { await topology.close(); }
const directory = new URL('../../../generated-artifacts/seo-audit/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('release-readiness.json', directory), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  pages: report.pages.length, internalLinks: report.links.length, images: report.images.length,
  failures: report.failures, largestImages: report.images.filter(i => i.bytes).sort((a, b) => b.bytes - a.bytes).slice(0, 5),
}, null, 2));
if (report.failures.length) process.exitCode = 1;
