import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Check actual deployable bytes. Authentication vendor code is kept intact in
// a separate chunk; only its own implementation strings may be exempted.
const forbidden = [
  ['remote Google Fonts reference', /fonts\.(?:googleapis|gstatic)\.com/i],
  ['platform fingerprint', /replit|repl\.co|cartographer/i],
  ['platform tracker URL', /\bi\.replit\.com\b/i],
  ['platform analytics access', /(?:window|globalThis)\s*(?:\??\.\s*umami\b|(?:\?\.)?\[\s*['"]umami['"]\s*\])/],
  ['development tooling', /@replit\/vite-plugin-|data-replit-metadata|\/@vite\/client|\/@react-refresh/],
  ['source map directive', /\/[/*][#@]\s*sourceMappingURL\s*=/],
  ['internal filesystem path', /\/(?:home\/runner|Users\/[^/]+|workspace\/artifacts)\//],
  ['generator metadata', /<meta\b[^>]*name\s*=\s*["']generator["']/i],
];

export async function checkProductionAssets(directory) {
  directory = directory instanceof URL ? fileURLToPath(directory) : directory;
  const files = await readdir(directory, { recursive: true });
  const problems = [];
  let checked = 0;
  for (const file of files) {
    if (/\.map$/i.test(file)) problems.push(`${file}: source map file`);
    if (!/\.(?:html|js|mjs|css|json|txt|xml|svg)$/.test(file)) continue;
    const content = await readFile(path.join(directory, file), 'utf8');
    checked++;
    const clerkVendor = /(?:^|\/)assets\/clerk-vendor-[\w-]+\.js$/.test(file);
    // A factual processor disclosure is not platform branding. Exempt only the
    // exact provider-name contexts used in the 12 privacy notices, never URLs,
    // tracker code, metadata or arbitrary references elsewhere.
    const fingerprintContent = content.replace(
      /(?:hosting|hébergement|alojamiento|alojamento|hostingu|хостинг) Replit\b|\bReplit(?: hosting|-Hosting|-hosting|-värdtjänst|-drift)\b/g,
      'hosting provider',
    );
    for (const [label, pattern] of forbidden) {
      if (clerkVendor && label === 'platform fingerprint') continue;
      if (pattern.test(label === 'platform fingerprint' ? fingerprintContent : content)) problems.push(`${file}: ${label}`);
    }
    const server = /(?:^|\/)server\//.test(file);
    if (!server && !clerkVendor && /\b(?:VITE_|REPLIT_|MARENETTO_|CLERK_|PUBLIC_OBJECT_|PRIVATE_OBJECT_)[A-Z_]+/.test(content)) {
      problems.push(`${file}: client environment variable name`);
    }
  }
  if (problems.length) throw new Error(`Unsafe production assets:\n${problems.join('\n')}`);
  return checked;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const count = await checkProductionAssets(new URL('../dist/', import.meta.url));
  console.log(`Production guard passed: ${count} text assets; no app fingerprints, tracker, internal paths or source maps (auth vendor preserved).`);
}
