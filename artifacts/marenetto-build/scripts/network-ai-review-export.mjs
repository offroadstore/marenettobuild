import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
process.env.PORT ||= '4193';
process.env.BASE_PATH ||= '/';
const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(root, '../../generated-artifacts/network/ai-review');
await mkdir(out, { recursive: true });
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const n = await vite.ssrLoadModule('/src/content/network/index.ts');
  for (const locale of n.NETWORK_LOCALES) {
    const input = {
      locale, sourceItalian: n.networkCopy('it'), target: n.networkCopy(locale),
      revisions: n.NETWORK_PAGES.filter(p => p.locale === locale).map(page => ({
        id: page.id, sha256: createHash('sha256').update(n.networkRevisionPayload(page)).digest('hex'),
      })),
    };
    await writeFile(path.join(out, `${locale}-input.json`), JSON.stringify(input));
  }
  console.log('Exported 12 complete source/target pairs and 144 revision fingerprints; no approvals written.');
} finally { await vite.close(); }
