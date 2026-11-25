/** Compare existing editions with a caller-supplied main-branch baseline, without checking it out. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { build } from 'esbuild';

const baseline = process.argv[2];
assert.ok(baseline && /^[a-zA-Z0-9_./-]+$/.test(baseline), 'Supply the integrated main baseline');
const workspace = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const root = path.resolve(import.meta.dirname, '..');
const relative = file => path.relative(workspace, file).split(path.sep).join('/');
const original = file => execFileSync('git', ['show', `${baseline}:${relative(file)}`], { maxBuffer: 32 * 1024 * 1024 });
const sha = value => createHash('sha256').update(value).digest('hex');
const locales = new Set(['it', 'en', 'fr', 'de', 'nl', 'es', 'pt', 'ru', 'pl', 'sv', 'no', 'da']);
async function snapshot(useBaseline) {
  const bundled = await build({
    stdin: { contents: `
      import { editions } from './src/localization/edition-inventory';
      import { propertyCopy } from './src/content/property-management';
      import { editionStructuredData } from './src/lib/structured-data';
      import { imageDescription, heroDescription } from './src/content/image-descriptions';
      export { propertyCopy };
      export const imageAlts = (paths, locales) => locales.map(locale => ({
        locale, hero: heroDescription(locale), images: paths.map(src => imageDescription(src, locale, 'Unchanged fallback'))
      }));
      export const rows = editions.map(e => ({
        id:e.id, locale:e.locale, path:e.path, state:e.state, source:e.source,
        title:e.title, description:e.description, contentLanguage:e.contentLanguage,
        schema: e.kind === 'article' ? null : editionStructuredData(e, 'https://www.marenettobuild.com')
      }));
    `, resolveDir: root },
    alias: { '@': path.join(root, 'src') }, bundle: true, platform: 'node', format: 'esm', write: false,
    define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/', DEV: false, PROD: true, MODE: 'production' }) },
    plugins: [{ name: 'baseline-source', setup(builder) {
      builder.onLoad({ filter: /\.(?:tsx?|m?[jt]s|json)$/ }, async ({ path: file }) => {
        if (!file.startsWith(root + path.sep) || file.includes('/node_modules/')) return;
        let contents = (useBaseline ? original(file) : await readFile(file)).toString();
        // Both snapshots compare metadata/schema, not asynchronously loaded historical HTML.
        contents = contents.replace(/^const (catalogs|correctedCatalogs|translationCatalogs) = import\.meta\.glob.*$/gm, 'const $1 = {};');
        const extension = path.extname(file).slice(1);
        return { contents, loader: ['ts', 'tsx', 'json'].includes(extension) ? extension : 'js' };
      });
    } }],
  });
  try {
    return await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
  } catch (error) {
    throw new Error(`Source snapshot failed: ${error.message}`);
  }
}
const before = await snapshot(true);
const after = await snapshot(false);
const existing = before.rows.filter(e => locales.has(e.locale));
for (const row of existing) {
  const current = after.rows.find(e => e.locale === row.locale && e.path === row.path);
  assert.deepEqual(current, row, `Existing metadata/schema changed: ${row.path}`);
}
for (const locale of locales) assert.deepEqual(after.propertyCopy[locale], before.propertyCopy[locale], `Affitti brevi: ${locale}`);
const imageKeys = [...original(path.join(root, 'src/content/image-descriptions.ts')).toString()
  .matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([a-f0-9]{64})['"]\s*\]/g)]
  .flatMap(([, slug, hash]) => [`/media/articles/${slug}.jpg`, `/api/historical-media/${hash}.jpg`]);
assert.ok(imageKeys.length > 10, 'Compare the actual baseline image-description keys');
assert.deepEqual(after.imageAlts(imageKeys, [...locales]), before.imageAlts(imageKeys, [...locales]), 'Existing image and hero alternatives changed');

const files = execFileSync('git', ['ls-tree', '-r', '--name-only', baseline, '--', relative(root)], { encoding: 'utf8' }).trim().split('\n');
const protectedFiles = files.filter(file =>
  /\/src\/content\/(?:historical(?:-editorial)?\/.*\.json|property-management\/(?:copy-[a-d]|extra)\.ts|phase3\/locales\/(?:it|en|fr|de|nl|es|pt|ru|pl|sv|no|da)\.ts)$/.test(file) ||
  /\/src\/localization\/catalogs\/(?:it|en|fr|de|nl|es|pt|ru|pl|sv|no|da)\.json$/.test(file));
for (const file of protectedFiles) assert.equal(sha(await readFile(path.join(workspace, file))), sha(original(path.join(workspace, file))), file);
const report = {
  baseline, checkedAt: new Date().toISOString(), unchangedEditionMetadata: existing.length,
  unchangedNonArticleSchemas: existing.filter(e => e.schema !== null).length,
  unchangedHeroAltLocales: locales.size, unchangedImageAltCombinations: imageKeys.length * locales.size,
  unchangedPropertyManagementLocales: [...locales], unchangedSourceFiles: protectedFiles,
  note: 'Source-level regression comparison, not a production HTTP claim. Historical async body loaders and Article schemas depending on them are excluded identically in both snapshots; their JSON source bytes are checked separately. Other schemas, including all 12 property-management editions, are compared.',
};
const output = path.join(workspace, 'generated-artifacts/atelier/preservation.json');
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(`Preserved ${existing.length} existing metadata editions, ${report.unchangedNonArticleSchemas} non-Article schemas, 12 property-management copies and ${protectedFiles.length} original source files.`);
