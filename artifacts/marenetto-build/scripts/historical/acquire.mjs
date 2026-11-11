import { mkdir, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { extractDocument } from './extract.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const output = path.resolve(root, '../../generated-artifacts/historical-fidelity');
const origin = 'https://www.marenettobuild.com';
const targetOrigin = 'http://127.0.0.1:4198';
const MAX_URLS = 650;
const sha = value => createHash('sha256').update(value).digest('hex');
await mkdir(path.join(output, 'original'), { recursive: true });
await mkdir(path.join(output, 'new'), { recursive: true });
await mkdir(path.join(output, 'legacy'), { recursive: true });
await copyFile(path.join(root, 'content/source-articles-it.json'), path.join(output, 'legacy/source-articles-it.json'));
const legacy = JSON.parse(await readFile(path.join(root, 'content/source-articles-it.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(root, 'dist/public/route-manifest.json'), 'utf8'));
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const browser = await chromium.launch({ executablePath: '/repl/tools/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const parser = await browser.newPage();
const service = spawn(process.execPath, [path.join(root, 'scripts/serve-seo.mjs')], { env: { ...process.env, PORT: '4198' }, stdio: ['ignore', 'pipe', 'inherit'] });
const inventory = new Map();
const records = new Map();
const discoveryDocuments = [];
const errors = [];
if (process.argv.includes('--resume')) {
  const previous = JSON.parse(await readFile(path.join(output, 'acquisition.json'), 'utf8'));
  for (const row of previous.inventory) inventory.set(row.url, row);
  for (const row of previous.records) if (!row.error) records.set(row.url, row);
  discoveryDocuments.push(...previous.discoveryDocuments);
  console.info(`Resuming: ${records.size} completed; ${inventory.size - records.size} pending/failed.`);
}
const canon = value => {
  try {
    const u = new URL(value, origin);
    if (!['www.marenettobuild.com', 'marenettobuild.com'].includes(u.hostname) || !['http:', 'https:'].includes(u.protocol)) return null;
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) if (/^utm_|^(?:fbclid|gclid)$/i.test(key)) u.searchParams.delete(key);
    if (/^\/(?:fw360-security|sms|internal|modules|admin)(?:\/|$)/i.test(u.pathname)) return null;
    if (u.pathname.startsWith('/m/') && !u.pathname.includes('/blog/feed')) return null;
    if (/\.(?:jpe?g|png|webp|svg|gif|avif|woff2?|css|js|ico|pdf|docx?|xlsx?|zip|txt)$/i.test(u.pathname)) return null;
    return u.href;
  } catch { return null; }
};
function add(url, discovery, family = null, declaredLocale = null) {
  const key = canon(url);
  if (!key) return;
  let row = inventory.get(key);
  if (!row) {
    row = { url: key, discoveries: [], family, declaredLocale };
    inventory.set(key, row);
  }
  if (!row.discoveries.includes(discovery)) row.discoveries.push(discovery);
  row.family ??= family;
  row.declaredLocale ??= declaredLocale;
}
async function acquire(url, side, key) {
  const hops = [];
  let current = url;
  for (let i = 0; i < 8; i++) {
    const acquiredAt = new Date().toISOString();
    const response = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'MarenettoMigrationAudit/1.0 (read-only, owner-requested)' } });
    const bytes = Buffer.from(await response.arrayBuffer());
    const file = `${side}/${key}-${acquiredAt.replace(/[:.]/g, '-')}-${i}.html`;
    await writeFile(path.join(output, file), bytes);
    const hop = { url: current, status: response.status, acquiredAt, bytes: bytes.length, sha256: sha(bytes), file,
      headers: Object.fromEntries(['content-type', 'location', 'content-language', 'x-robots-tag', 'last-modified'].map(k => [k, response.headers.get(k)]).filter(([, v]) => v !== null)) };
    hops.push(hop);
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      current = new URL(response.headers.get('location'), current).href;
      if (side === 'original' && !canon(current)) throw new Error(`External redirect not acquired: ${current}`);
      if (side === 'new' && new URL(current).origin !== targetOrigin) throw new Error(`Unexpected target-origin redirect: ${current}`);
      continue;
    }
    return { url, finalURL: current, status: response.status, initialStatus: hops[0].status, hops, html: bytes.toString('utf8') };
  }
  throw new Error(`Redirect chain exceeded at ${url}`);
}
try {
  await new Promise((resolve, reject) => { service.stdout.once('data', resolve); service.once('error', reject); service.once('exit', code => reject(new Error(`Comparison handler stopped: ${code}`))); });
  for (const endpoint of ['/robots.txt', '/sitemap.xml']) {
    const result = await acquire(origin + endpoint, 'original', sha(endpoint).slice(0, 16));
    const summary = { ...result }; delete summary.html;
    discoveryDocuments.push(summary);
    if (endpoint.endsWith('.xml') && result.status === 200) {
      const entries = await parser.evaluate(xml => {
        const d = new DOMParser().parseFromString(xml, 'application/xml');
        return [...d.getElementsByTagName('url')].map(node => ({
          loc: node.getElementsByTagName('loc')[0]?.textContent,
          alternates: [...node.getElementsByTagNameNS('*', 'link')].map(a => ({ url: a.getAttribute('href'), lang: a.getAttribute('hreflang') })),
        }));
      }, result.html);
      for (const entry of entries) {
        add(entry.loc, 'sitemap-loc', entry.loc, 'it');
        for (const a of entry.alternates) add(a.url, 'sitemap-hreflang', entry.loc, a.lang);
      }
    }
  }
  add('https://marenettobuild.com/', 'owner-specified-origin');
  for (const alias of Object.keys(manifest.redirects)) add(origin + alias + '/', 'configured-redirect-not-proof-of-history');
  let capped = false;
  while (true) {
    const pending = [...inventory.values()].filter(row => !records.has(row.url)).slice(0, 3);
    if (!pending.length) break;
    if (records.size + pending.length > MAX_URLS) { capped = true; break; }
    await Promise.all(pending.map(async row => {
      const key = sha(row.url).slice(0, 16);
      const record = { ...row, key };
      records.set(row.url, record);
      try {
        const original = await acquire(row.url, 'original', key);
        record.original = { ...original }; delete record.original.html;
        if (/html/.test(original.hops.at(-1).headers['content-type'] ?? '')) {
          record.original.document = await parser.evaluate(extractDocument, { html: original.html, url: original.finalURL, side: 'original' });
          if (original.status === 200) {
            const doc = record.original.document;
            for (const link of doc.links) add(link.href, link.context, null, null);
            for (const alt of doc.alternates) add(alt.href, 'head-hreflang', row.family, alt.lang);
            for (const feed of doc.feeds) add(feed, 'public-cms-feed');
            if (doc.next) add(doc.next, 'pagination');
          }
        } else if (/xml|rss|atom/.test(original.hops.at(-1).headers['content-type'] ?? '') || original.finalURL.includes('/blog/feed')) {
          record.original.feed = await parser.evaluate(xml => {
            const d = new DOMParser().parseFromString(xml, 'application/xml');
            return { title: d.querySelector('channel > title')?.textContent, items: [...d.querySelectorAll('item,entry')].map(item => ({ title: item.querySelector('title')?.textContent, link: item.querySelector('link')?.textContent || item.querySelector('link')?.getAttribute('href'), guid: item.querySelector('guid,id')?.textContent })) };
          }, original.html);
          for (const item of record.original.feed.items) add(item.link, 'public-cms-feed-item');
        }
        const sourceURL = new URL(row.url);
        const candidate = await acquire(targetOrigin + sourceURL.pathname + sourceURL.search, 'new', key);
        record.new = { ...candidate }; delete record.new.html;
        if (/html/.test(candidate.hops.at(-1).headers['content-type'] ?? '')) record.new.document = await parser.evaluate(extractDocument, { html: candidate.html, url: candidate.finalURL, side: 'new' });
      } catch (error) { record.error = String(error); errors.push({ url: row.url, error: String(error) }); }
    }));
    if (records.size % 30 < 3) await writeFile(path.join(output, 'acquisition.json'), JSON.stringify({ commit, acquiredAt: new Date().toISOString(), originalOrigin: origin, candidateOrigin: targetOrigin, sourceType: 'live independent historical public site; not a project catalog', capped, records: [...records.values()], inventory: [...inventory.values()], discoveryDocuments, errors }, null, 2));
    if (records.size % 30 < 3) console.info(`Acquired ${records.size}; discovered ${inventory.size}; errors ${errors.length}`);
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  const final = { commit, acquiredAt: new Date().toISOString(), originalOrigin: origin, candidateOrigin: targetOrigin, sourceType: 'live independent historical public site; not a project catalog', capped, records: [...records.values()], inventory: [...inventory.values()], discoveryDocuments, errors,
    legacyArchive: { file: 'legacy/source-articles-it.json', sha256: sha(await readFile(path.join(output, 'legacy/source-articles-it.json'))), recordedFetchedAt: legacy.fetchedAt, note: 'Recorded date is not independently proven acquisition. Destination articles are existing project rework, not this archive verbatim.', articles: legacy.articles.map(a => ({ slug: a.slug, recordedURL: a.url, recordedTitle: a.title, bytes: Buffer.byteLength(a.markdown), truncatedFlag: a.truncated, sha256: sha(a.markdown) })) },
    build: { manifestModifiedAt: (await stat(path.join(root, 'dist/public/route-manifest.json'))).mtime.toISOString(), eligibleSitemapCount: 22, aliasesConfigured: Object.keys(manifest.redirects) },
  };
  await writeFile(path.join(output, 'acquisition.json'), JSON.stringify(final, null, 2));
  console.info(`Finished ${records.size}/${inventory.size}; capped=${capped}; requestErrors=${errors.length}; codeCommit=${commit}`);
} finally { service.kill(); await browser.close(); }
