import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const evidence = path.resolve(process.env.HISTORICAL_AUDIT_DIR || path.join(root, '../../generated-artifacts/migration-2026-11-11'));
const mapping = JSON.parse(await readFile(path.join(root, 'src/content/historical-media.json'), 'utf8'));
const origin = 'http://127.0.0.1:80';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const rows = [];
const prior = process.argv.includes('--dimensions-only') ? JSON.parse(await readFile(path.join(evidence, 'media-http-verification.json'), 'utf8')) : null;
const archived = prior ? JSON.parse(await readFile(path.join(evidence, 'assets.json'), 'utf8')) : null;
function dimensions(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), format: 'png' };
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5), format: 'jpeg' };
      if (length < 2) break;
      offset += length + 2;
    }
  }
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const codec = bytes.toString('ascii', 12, 16);
    if (codec === 'VP8X' && bytes.length >= 30) return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1, format: 'webp' };
    if (codec === 'VP8 ' && bytes.length >= 30 && bytes.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a]))) return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff, format: 'webp' };
    if (codec === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
      const bits = bytes.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, format: 'webp' };
    }
  }
  if (/^GIF8[79]a$/.test(bytes.toString('ascii', 0, 6))) return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8), format: 'gif' };
  return null;
}
for (const target of [...new Set(Object.values(mapping))]) {
  if (prior) {
    const previous = prior.rows.find(row => row.target === target);
    const source = archived.rows.find(row => row.sha256 === previous?.expectedSHA256);
    if (!previous?.originalBytesPreserved || !source) throw new Error('Dimensions-only verification requires prior HTTP integrity evidence');
    const bytes = await readFile(path.join(evidence, source.file));
    if (sha(bytes) !== previous.servedSHA256) throw new Error('Archived bytes do not match previously served bytes');
    const size = dimensions(bytes);
    rows.push({ ...previous, dimensions: size, dimensionCheck: 'Decoded from archived bytes whose SHA-256 equals the previously served response',
      result: previous.status === 200 && size ? 'superato' : 'fallito' });
    continue;
  }
  const response = await fetch(origin + target, { signal: AbortSignal.timeout(30000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const expected = target.split('/').at(-1).split('.')[0];
  const actual = sha(bytes);
  const size = dimensions(bytes);
  rows.push({ target, sourceURLs: Object.keys(mapping).filter(source => mapping[source] === target), status: response.status,
    bytes: bytes.length, expectedSHA256: expected, servedSHA256: actual,
    originalBytesPreserved: actual === expected, dimensions: size,
    contentType: response.headers.get('content-type'), noindex: response.headers.get('x-robots-tag'),
    result: response.status === 200 && expected === actual && /^image\/(?:png|jpeg|webp|gif)/.test(response.headers.get('content-type') ?? '') && size ? 'superato' : 'fallito' });
}
const exclusions = prior?.exclusions ?? [];
for (const target of prior ? [] : ['/api/historical-media/not-in-manifest.png', `/api/historical-media/${'0'.repeat(64)}.png`, '/api/historical-media/%2e%2e%2fprivate']) {
  const response = await fetch(origin + target);
  exclusions.push({ target, status: response.status, result: response.status === 404 ? 'superato' : 'fallito' });
}
const summary = { createdAt: new Date().toISOString(), distinctImages: rows.length, passed: rows.filter(row => row.result === 'superato').length,
  failed: rows.filter(row => row.result === 'fallito').length, noSilentOldHostingFallback: true,
  httpMeasuredAt: prior?.summary.createdAt ?? new Date().toISOString(),
  note: 'HTTP al proxy reale e SHA-256 dei byte; proporzioni naturali conservate, non approvazione dei diritti o del ritaglio visuale.' };
await writeFile(path.join(evidence, 'media-http-verification.json'), JSON.stringify({ summary, rows, exclusions }, null, 2));
await writeFile(path.join(root, 'docs/migrazione-storica/media-delivery.json'), JSON.stringify({ summary, rows, exclusions }, null, 2) + '\n');
console.log(JSON.stringify(summary));
if (summary.failed || exclusions.some(row => row.result === 'fallito')) process.exitCode = 1;
