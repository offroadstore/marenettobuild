import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { extractDocument } from './extract.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const evidence = path.resolve(process.env.HISTORICAL_AUDIT_DIR || path.join(root, '../../generated-artifacts/migration-2026-11-11'));
const acquisition = JSON.parse(await readFile(path.join(evidence, 'acquisition.json'), 'utf8'));
const queue = new Map();
const rows = [];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const allowedHosts = new Set(['www.marenettobuild.com', 'marenettobuild.com', 'uploads3.fw360.it', 'assets.framework360.com', 'cdn.framework360.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'images.pexels.com']);
const MAX_ASSETS = 300;
const MAX_BYTES = 25 * 1024 * 1024;
function add(source, page, kind) {
  if (!source) return;
  let url;
  try { url = new URL(source); } catch { return; }
  if (url.protocol !== 'https:') return;
  url.hash = '';
  const value = queue.get(url.href) ?? { url: url.href, pages: [], kinds: [] };
  if (!value.pages.includes(page)) value.pages.push(page);
  if (!value.kinds.includes(kind)) value.kinds.push(kind);
  queue.set(url.href, value);
}
const parserBrowser = await chromium.launch({ executablePath: '/repl/tools/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
const parser = await parserBrowser.newPage();
for (const row of acquisition.records) {
  if (row.original?.status !== 200) continue;
  if (!row.original.document) continue;
  const document = await parser.evaluate(extractDocument, { html: await readFile(path.join(evidence, row.original.hops.at(-1).file), 'utf8'), url: row.original.finalURL, side: 'original' });
  for (const img of document.resources) {
    add(img.src, row.url, img.kind);
    for (const part of (img.srcset ?? '').split(',')) {
      const source = part.trim().split(/\s+/)[0];
      if (source) add(new URL(source, row.original.finalURL).href, row.url, 'srcset');
    }
  }
  for (const doc of document.attachments) add(doc.href, row.url, 'attachment');
  for (const css of document.stylesheets) add(css, row.url, 'stylesheet');
}
} finally { await parserBrowser.close(); }
await mkdir(path.join(evidence, 'assets'), { recursive: true });
for (const asset of queue.values()) {
  const result = { ...asset, acquiredAt: new Date().toISOString(), status: null, state: 'non verificato', hops: [] };
  rows.push(result);
  if (rows.length > MAX_ASSETS) { result.reason = 'Limite esplicito di risorse raggiunto'; continue; }
  if (!allowedHosts.has(new URL(asset.url).hostname)) { result.reason = 'Host esterno non autorizzato dal downloader; nessuna richiesta eseguita'; continue; }
  try {
    let current = asset.url;
    let response;
    for (let i = 0; i < 8; i++) {
      if (!allowedHosts.has(new URL(current).hostname)) throw new Error('Redirect verso host non autorizzato');
      response = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(25000) });
      result.hops.push({ url: current, status: response.status, location: response.headers.get('location') });
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        current = new URL(response.headers.get('location'), current).href;
        await response.body?.cancel();
        continue;
      }
      break;
    }
    result.status = response.status;
    result.finalURL = current;
    result.contentType = response.headers.get('content-type');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const chunks = [];
    let length = 0;
    for await (const chunk of response.body) {
      length += chunk.length;
      if (length > MAX_BYTES) throw new Error('Risorsa oltre 25 MiB; acquisizione non certificata');
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    const hash = sha(bytes);
    const ext = path.extname(new URL(current).pathname).match(/^\.[a-z0-9]{1,6}$/i)?.[0] || '.bin';
    const file = `assets/${hash}${ext}`;
    const exists = await stat(path.join(evidence, file)).then(() => true, () => false);
    if (!exists) await writeFile(path.join(evidence, file), bytes);
    if (sha(await readFile(path.join(evidence, file))) !== hash) throw new Error('Integrità dei byte salvati fallita');
    Object.assign(result, { file, bytes: bytes.length, sha256: hash, state: 'superato', deliveryMigrated: false });
    if (result.contentType?.includes('text/css')) {
      const css = bytes.toString('utf8');
      for (const match of css.matchAll(/(?:url\(\s*['"]?([^'")\s]+)['"]?\s*\)|@import\s+['"]([^'"]+)['"])/gi)) {
        const ref = match[1] || match[2];
        if (!/^(?:data:|#)/.test(ref)) add(new URL(ref, current).href, asset.url, 'css-dependency');
      }
    }
  } catch (error) {
    result.state = 'fallito';
    result.reason = String(error);
  }
}
const summary = {
  createdAt: new Date().toISOString(), discovered: queue.size, processed: rows.length,
  passed: rows.filter(row => row.state === 'superato').length, failed: rows.filter(row => row.state === 'fallito').length,
  unverified: rows.filter(row => row.state === 'non verificato').length,
  bytes: rows.reduce((sum, row) => sum + (row.bytes || 0), 0), deliveryMigrated: false,
  limits: { MAX_ASSETS, MAX_BYTES }, note: 'Backup indipendente; non prova il delivery locale, i diritti o la risoluzione sufficiente. Nessuna risorsa del sito pubblico modificata.',
};
await writeFile(path.join(evidence, 'assets.json'), JSON.stringify({ summary, rows }, null, 2));
await mkdir(path.join(root, 'docs/migrazione-storica'), { recursive: true });
await writeFile(path.join(root, 'docs/migrazione-storica/risorse.json'), JSON.stringify({ summary, rows }, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
