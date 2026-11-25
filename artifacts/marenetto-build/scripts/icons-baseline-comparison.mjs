import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = new URL('../../../generated-artifacts/marenetto-icons/', import.meta.url);
const before = process.argv[2] ? pathToFileURL(`${path.resolve(process.argv[2])}/`) : new URL('baseline/', directory);
const reportName = process.argv[3] ?? 'baseline-comparison.json';
if (!/^[a-z-]+\.json$/.test(reportName)) throw new Error('Supply a plain JSON report filename');
const after = new URL('../dist/public/', import.meta.url);
const files = await readdir(before, { recursive: true });
function withoutIcons(html) {
  return html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, head => head
    .replace(/<link\b[^>]*rel="(?:icon|apple-touch-icon|manifest)"[^>]*>/g, '')
    .replace(/<meta\b[^>]*name="(?:theme-color|apple-mobile-web-app-title)"[^>]*>/g, '')
    .replace(/>\s+</g, '><'));
}
const results = [];
for (const file of files.filter(file => /\.(?:html|xml|txt|json)$/.test(file))) {
  const a = await readFile(new URL(file, before), 'utf8');
  const b = await readFile(new URL(file, after), 'utf8');
  assert.equal(file.endsWith('.html') ? withoutIcons(b) : b, file.endsWith('.html') ? withoutIcons(a) : a, `Unrequested change: ${file}`);
  results.push({ file, beforeSHA256: createHash('sha256').update(a).digest('hex'), afterSHA256: createHash('sha256').update(b).digest('hex'), unchangedExceptIcons: true });
}
await writeFile(new URL(reportName, directory), JSON.stringify({ normalization: 'Only icon links, theme-color, apple-mobile-web-app-title and inter-tag head whitespace. No body, SEO, JSON-LD, sitemap, robots or content exclusions.', results }, null, 2));
console.log(`Baseline comparison passed: ${results.length} documents/maps/feeds; no changes except requested icon head.`);
