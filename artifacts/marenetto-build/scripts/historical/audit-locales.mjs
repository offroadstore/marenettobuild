import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '../..');
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const locales = await read('src/localization/locales.json');
const sources = await read('src/localization/catalogs/sources.json');
const preview = await read('src/localization/preview-sources.json');
const normalized = text => text.normalize('NFKC').replace(/\s+/g, ' ').trim();
const literals = new Map();
const dynamicTemplates = [];
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await scan(file); continue; }
    if (!/\.tsx?$/.test(entry.name) || /\.d\.ts$/.test(entry.name)) continue;
    const code = await readFile(file, 'utf8');
    const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, entry.name.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) {
        const value = normalized(node.text);
        const found = literals.get(value) ?? [];
        found.push(path.relative(root, file));
        literals.set(value, found);
      }
      if (ts.isTemplateExpression(node)) dynamicTemplates.push({ file: path.relative(root, file), expression: node.getText(source).slice(0, 180) });
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
await scan(path.join(root, 'src'));
const groups = [];
for (const [directory, source] of [['catalogs', sources.entries], ['preview', preview.entries], ['draft-corrections', preview.entries]]) {
  const entries = Object.entries(source);
  const usage = Object.fromEntries(entries.map(([id, phrase]) => [id, [...new Set(literals.get(normalized(phrase)) ?? [])]]));
  const catalogs = [];
  for (const locale of locales.filter(locale => locale.code !== 'it')) {
    let data;
    try { data = await read(`src/localization/${directory}/${locale.code}.json`); }
    catch (error) { if (error.code === 'ENOENT') { catalogs.push({ locale: locale.code, available: false, reason: locale.code === 'en' && directory === 'catalogs' ? 'English uses source strings explicitly; not a missing catalog' : 'catalogo non presente; nessuna completezza presunta' }); continue; } throw error; }
    const translations = data.translations;
    const missing = entries.filter(([id]) => !(id in translations)).map(([id]) => id);
    const empty = Object.entries(translations).filter(([, value]) => typeof value !== 'string' || !value.trim()).map(([id]) => id);
    const unknown = Object.keys(translations).filter(id => !(id in source));
    const unchanged = entries.filter(([id, phrase]) => translations[id] && normalized(translations[id]) === normalized(phrase)).map(([id]) => id);
    catalogs.push({ locale: locale.code, available: true, recordedReviewStatus: data.reviewStatus, keys: Object.keys(translations).length,
      missing, empty, unknown, unchangedSourceForReview: unchanged,
      interpretation: directory === 'draft-corrections' ? 'Overlay parziale: le chiavi assenti ereditano la bozza, non il testo approvato' : 'Le chiavi piene non dimostrano revisione madrelingua o completezza di pagina' });
  }
  groups.push({ directory, sourceKeys: entries.length, usage,
    notStaticallyMatched: entries.filter(([id]) => !usage[id].length).map(([id]) => id),
    usageLimit: 'Corrispondenze AST esatte in tutti i file TS/TSX, inclusi attributi accessibili, errori e conferme. Una chiave non riscontrata non è dichiarata inutilizzata: oggetti JSON, contenuti dinamici e composizione runtime richiedono il controllo renderizzato.',
    catalogs });
}
const output = { createdAt: new Date().toISOString(), locales: locales.map(locale => locale.code), groups, dynamicTemplates,
  fallbackPolicyObserved: 'runtime.ts restituisce la sorgente in caso di chiave assente e registra il testo nel set missing per locale non italiano/inglese. La presenza di quel ramo non certifica assenza di fallback sulle pagine. I corpi storici con lingua esplicita sono separati.',
  unusedKeys: { state: 'non verificato definitivamente', reason: 'Assenza di riferimento statico non dimostra inutilizzo runtime; elenco dei candidati per gruppo' },
  approvals: 'Non vengono inventate o estese approvazioni. Il risultato test:i18n è un controllo tecnico distinto.' };
await mkdir(path.join(root, 'docs/migrazione-storica'), { recursive: true });
await writeFile(path.join(root, 'docs/migrazione-storica/chiavi-lingue.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(groups.map(group => ({ group: group.directory, sourceKeys: group.sourceKeys, notStaticallyMatched: group.notStaticallyMatched.length,
  missing: group.catalogs.reduce((sum, catalog) => sum + (catalog.missing?.length ?? 0), 0), empty: group.catalogs.reduce((sum, catalog) => sum + (catalog.empty?.length ?? 0), 0) })), null, 2));
