import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const norm = value => value.normalize('NFKC').replace(/\s+/g, ' ').trim();
const baseline = JSON.parse(await readFile(path.join(root, 'src/localization/catalogs/sources.json'), 'utf8')).entries;
const known = new Set(Object.values(baseline).map(norm));
const entries = new Map();
function add(value) {
  value = value.trim();
  if (!value || value.length < 2 || !/\p{L}/u.test(value) || known.has(norm(value))) return;
  if (/^(https?:|\/|#[^#]|\.|@)/.test(value) || /\.(png|jpe?g|webp|json|css|tsx?|mjs)$/.test(value)) return;
  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(value) || /^\d{4}-\d\d-\d\d/.test(value)) return;
  const id = 'p_' + createHash('sha256').update(norm(value)).digest('hex').slice(0, 16);
  entries.set(id, value);
}
function collect(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    if (ts.isPropertyAssignment(node.parent) && node.parent.name === node) return;
    if (ts.isJsxAttribute(node.parent) && !['title', 'alt', 'placeholder', 'aria-label'].includes(node.parent.name.getText())) return;
    add(node.text);
  } else if (ts.isJsxText(node)) add(norm(node.text));
  ts.forEachChild(node, collect);
}
async function parse(relative) {
  return ts.createSourceFile(relative, await readFile(path.join(root, relative), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}
const app = await parse('src/App.tsx');
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(app) === 'copyBase') {
    for (const p of node.initializer.properties) if (p.name?.getText(app) === 'en') collect(p.initializer);
  }
  if (ts.isConditionalExpression(node) && (/^it$/.test(node.condition.getText(app)) || node.condition.getText(app).includes("lang === 'it'"))) collect(node.whenFalse);
  if (ts.isCallExpression(node)) {
    const name = node.expression.getText(app);
    if (name === 'localizeChoice' && node.arguments[2]) collect(node.arguments[2]);
    if (name === 'text' && node.arguments[1]) collect(node.arguments[1]);
  }
  ts.forEachChild(node, visit);
}
visit(app);
const home = await parse('src/content/home-copy.ts');
function visitHome(node) {
  if (ts.isPropertyAssignment(node) && node.name.getText(home) === 'en') collect(node.initializer);
  else ts.forEachChild(node, visitHome);
}
visitHome(home);
collect(await parse('src/pages/library.tsx'));
collect(await parse('src/content/articles.ts'));
collect(await parse('src/pages/not-found.tsx'));
for (const value of [
  'Traduzione in anteprima, in attesa di revisione.',
  'Translation preview, awaiting review.',
  'Il testo originale italiano resta disponibile.',
  'Original Italian text remains available.',
  'Articoli', 'Guide pratiche', 'Ricerca', 'Progetti', 'articolo', 'articoli',
  'risultato', 'risultati', 'per', 'articoli disponibili', 'guide', 'su', 'immagini locali',
  'Nessun articolo trovato.', 'Trova un articolo', 'Cerca negli articoli',
  'Caricamento dei contenuti…', 'Impossibile caricare questa lingua. Riprova.',
  'Pagina non trovata', 'Torna alla homepage', 'Cerca', 'Tutti',
  'Original Italian title', 'Historical path', 'Testo originale italiano',
  'campo obbligatorio', 'Inserisci un indirizzo email valido.', 'Controlla questo campo.',
  'Please fill in this field.', 'Please enter a valid email address.', 'Please check this field.',
]) add(value);
const manifest = { version: 1, reviewStatus: 'awaiting-owner-review', entries: Object.fromEntries([...entries].sort()) };
const destination = path.join(root, 'src/localization/preview-sources.json');
await writeFile(destination, JSON.stringify(manifest, null, 2) + '\n');
const chunks = [];
let current = {}, size = 0;
for (const [id, text] of entries) {
  if (size + text.length > 14500 && size) { chunks.push(current); current = {}; size = 0; }
  current[id] = text; size += text.length;
}
if (size) chunks.push(current);
const temp = path.resolve(root, '../../generated-artifacts/translation-input');
await mkdir(temp, { recursive: true });
for (let i = 0; i < chunks.length; i++) await writeFile(path.join(temp, `chunk-${i}.json`), JSON.stringify(chunks[i]));
console.log(JSON.stringify({ entries: entries.size, characters: [...entries.values()].reduce((n, text) => n + text.length, 0), chunks: chunks.length, temp }));
