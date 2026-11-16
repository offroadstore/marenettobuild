// Re-render the pre-task page component without modifying the working tree.
// Images, catalogs and non-category components are shared unchanged; release
// CSS is safe here because every new selector is scoped to the new category DOM.
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.resolve(root, '../../generated-artifacts/category-redesign');
const revision = process.env.CATEGORY_BASELINE_REF || 'HEAD';
const previous = execFileSync('git', ['show', `${revision}:artifacts/marenetto-build/src/pages/historical.tsx`], { cwd: root, encoding: 'utf8' });
if (previous.includes('extractHistoricalCategory')) throw new Error('HEAD already contains category redesign; use the archived baseline output instead.');
// Match build-seo's SSR environment; do not mix development prebundles with
// the production React server renderer used by these release comparisons.
process.env.NODE_ENV = 'production';
const vite = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, entries: [] },
  appType: 'custom',
  plugins: [{
    name: 'category-before-comparison',
    enforce: 'pre',
    transform(_code, id) { return id.endsWith('/src/pages/historical.tsx') ? { code: previous, map: null } : null; },
  }],
});
try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
  const template = await readFile(path.join(root, 'dist/public/index.html'), 'utf8');
  const response = await fetch('http://localhost:80/api/editorial/active');
  if (!response.ok) throw new Error('Cannot verify active editorial state for baseline');
  const active = await response.json();
  await mkdir(output, { recursive: true });
  for (const [name, route] of [['general-contractor', '/general-contractor/'], ['home', '/'], ['article', '/gestione-manutenzione-immobile/']]) {
    const { body } = await render(route, 'it', active);
    const expected = name === 'home' ? 'Impresa Edile a Cefalù' : name === 'article' ? 'Gestione Manutenzione Immobile' : 'General Contractor';
    if (!body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].includes(expected)) throw new Error(`Baseline rendered the wrong route: ${route}`);
    // build-seo has already populated dist/public/index.html with the homepage.
    // Reuse its release head, not an empty-root replacement that could no-op.
    const html = `${template.slice(0, template.indexOf('</head>') + 7)}<body><div id="root">${body}</div></body></html>`;
    if (!html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].includes(expected)) throw new Error(`Saved baseline contains the wrong route: ${route}`);
    await writeFile(path.join(output, `${name}-baseline.html`), html);
  }
  console.log('Saved pre-task SSR baselines for category, homepage and article');
} finally {
  await vite.close();
}
