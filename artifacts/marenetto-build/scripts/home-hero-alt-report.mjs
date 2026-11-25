import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

const directory = new URL('../../../generated-artifacts/home-hero-alt/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(path, directory), 'utf8'));
const before = await load('global-seo/before/inventory.json');
const after = await load('global-seo/after/inventory.json');
const browser = await load('browser-regression.json');
const globalBrowserBefore = await load('global-seo/before/browser.json');
const globalBrowserAfter = await load('global-seo/after/browser.json');
const bundle = await build({
  entryPoints: [new URL('../src/content/image-descriptions.ts', import.meta.url).pathname],
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { heroDescription, imageDescription } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const digest = value => createHash('sha256').update(value).digest('hex');
const hero = row => row.images.find(img => img.src.endsWith('/cefalu-hero-left-1672.jpg'));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const entryScript = /<script type="module" crossorigin src="(\/assets\/index-[\w-]+\.js)"><\/script>/g;
const entryScripts = new Map();
const rows = [];
const preexistingOtherAlt = [];
assert.equal(before.auditorSHA256, after.auditorSHA256, 'The global HTTP auditor must be unchanged');
assert.deepEqual(before.rows.map(row => row.path), after.rows.map(row => row.path));
assert.deepEqual(before.summary, after.summary);
assert.equal(browser.passed, true);
assert.equal(browser.homes.length, 12);
for (const result of [globalBrowserBefore, globalBrowserAfter]) {
  assert.equal(result.pages.length, after.pages);
  assert.deepEqual(result.pages.filter(page => page.issues.length), []);
  for (const key of ['errors', 'cspViolations', 'externalRequests']) assert.deepEqual(result[key], []);
}
for (const old of before.rows) {
  const current = after.rows.find(row => row.path === old.path);
  const filename = digest(old.path) + '.html';
  const oldHTML = await readFile(new URL('global-seo/before/html/' + filename, directory), 'utf8');
  const newHTML = await readFile(new URL('global-seo/after/html/' + filename, directory), 'utf8');
  assert.equal(digest(oldHTML), old.htmlSHA256, old.path + ' original snapshot integrity');
  assert.equal(digest(newHTML), current.htmlSHA256, old.path + ' candidate snapshot integrity');
  const oldScript = [...oldHTML.matchAll(entryScript)];
  const newScript = [...newHTML.matchAll(entryScript)];
  assert.equal(oldScript.length, 1, old.path);
  assert.equal(newScript.length, 1, old.path);
  entryScripts.set(oldScript[0][1], newScript[0][1]);
  let expectedHTML = oldHTML.replace(oldScript[0][0], newScript[0][0]);
  const oldRow = structuredClone(old), newRow = structuredClone(current);
  delete oldRow.htmlSHA256; delete newRow.htmlSHA256;
  if (old.id === 'home') {
    assert.equal(hero(old).alt, heroDescription('it'), old.path + ' baseline defect');
    assert.equal(hero(current).alt, heroDescription(old.locale), old.path + ' catalog translation');
    const tag = oldHTML.match(/<img\b[^>]*src="\/media\/home\/cefalu-hero-left-1672\.jpg"[^>]*>/g);
    assert.equal(tag?.length, 1, old.path);
    expectedHTML = expectedHTML.replace(tag[0], tag[0].replace(`alt="${esc(hero(old).alt)}"`, `alt="${esc(hero(current).alt)}"`));
    hero(oldRow).alt = hero(newRow).alt;
    const client = browser.homes.find(row => row.locale === old.locale);
    for (const key of ['initial', 'hydrated', 'clientReturn', 'languageChange']) assert.equal(client[key], heroDescription(old.locale), old.path + ' ' + key);
    rows.push({ url: 'https://www.marenettobuild.com' + old.path, locale: old.locale, before: hero(old).alt, after: hero(current).alt, status: current.status, initial: 'OK', hydration: 'OK', clientReturn: 'OK', languageChange: 'OK' });
    for (const image of old.images.filter(image => !image.src.endsWith('/cefalu-hero-left-1672.jpg'))) {
      const expected = imageDescription(image.src, old.locale);
      if (old.locale !== 'it' && expected && image.alt !== expected && image.alt === imageDescription(image.src, 'it')) {
        preexistingOtherAlt.push({ path: old.path, locale: old.locale, src: image.src, before: image.alt, expected, action: 'Documented only; intentionally unchanged' });
      }
    }
  }
  assert.deepEqual(newRow, oldRow, old.path + ' all SEO fields and image properties outside the target alt');
  assert.equal(newHTML, expectedHTML, old.path + ' raw HTML: only the exact hero alt and entry bundle fingerprint may change');
}
assert.equal(rows.length, 12);
assert.equal(rows.filter(row => row.before !== row.after).length, 11);
assert.equal(entryScripts.size, 1, 'One exact entry-script fingerprint mapping');
const assetPaths = execFileSync('git', ['ls-files', 'artifacts/marenetto-build/public/media/home/cefalu-hero-left-*'], { encoding: 'utf8' }).trim().split('\n');
assert.equal(assetPaths.length, 11);
const assets = [];
for (const path of assetPaths) {
  const baselineBlob = execFileSync('git', ['rev-parse', before.revision + ':' + path], { encoding: 'utf8' }).trim();
  const currentBlob = execFileSync('git', ['hash-object', path], { encoding: 'utf8' }).trim();
  assert.equal(currentBlob, baselineBlob, path + ' immutable image bytes');
  assets.push({ path, baselineBlob, currentBlob, sha256: digest(await readFile(path)) });
}
const comparison = {
  at: new Date().toISOString(), revision: before.revision, auditorSHA256: after.auditorSHA256,
  pagesCompared: after.pages, changedAlt: 11, unchangedItalian: true, rows, assets, preexistingOtherAlt,
  entryScriptFingerprint: Object.fromEntries(entryScripts),
  normalization: 'No development token or content normalization in production snapshots. Exact replacement of the recorded entry-script tag only; expected hero alt replacement only on home routes.',
  summaryBefore: before.summary, summaryAfter: after.summary, passed: true,
};
await writeFile(new URL('comparison.json', directory), JSON.stringify(comparison, null, 2));
const columns = Object.keys(rows[0]);
await writeFile(new URL('home-prima-dopo.csv', directory), '\uFEFF' + [columns.join(','), ...rows.map(row => columns.map(key => '"' + String(row[key]).replaceAll('"', '""') + '"').join(','))].join('\r\n'));
const details = rows.map(row => `<tr><td>${esc(row.url)}</td><td>${esc(row.locale.toUpperCase())}</td><td>${esc(row.before)}</td><td>${esc(row.after)}</td><td>200 · OK / OK / OK / OK</td></tr>`).join('');
await writeFile(new URL('rapporto.html', directory), `<!doctype html><html lang="it"><meta charset="utf-8"><title>Alt della home — verifica prima/dopo</title>
<style>body{font:16px/1.6 system-ui;max-width:1400px;margin:40px auto;padding:0 24px;color:#172b32}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #bcc9cb;padding:10px;text-align:left;overflow-wrap:anywhere}h1,h2{line-height:1.2}code{overflow-wrap:anywhere}</style>
<h1>Alt della home nelle dodici lingue</h1><p>Rapporto del ${esc(comparison.at)}. Revisione iniziale: <code>${esc(before.revision)}</code>.</p>
<p><strong>PRONTO PER REPUBLISH — nessuna pubblicazione eseguita.</strong></p>
<h2>Risultati effettivi</h2><p>Confrontati ${after.pages} URL con lo stesso auditor SEO globale, SHA-256 <code>${after.auditorSHA256}</code>. Undici alt corretti; italiano invariato. Tutti i controlli SEO aggregati sono identici e senza segnalazioni, sia prima sia dopo. L’auditor generico considerava adeguato anche l’alt italiano: la regressione aggiunta confronta invece il testo esatto del catalogo per lingua e fallisce sulla build originale a /en/.</p>
<p>Chromium: ${after.pages} percorsi verificati prima e dopo, senza differenze fra metadati iniziali e client, errori non gestiti, violazioni CSP o richieste esterne. Controllo specifico aggiuntivo: dodici risposte HTTP, dodici idratazioni, dodici ritorni alla home tramite navigazione client e dodici cambi dal menu lingua reale; nessun errore di idratazione. Tutti gli attributi dell’immagine restano identici dopo idratazione e ritorno client.</p>
<table><thead><tr><th>URL di riferimento</th><th>Lingua</th><th>Alt prima</th><th>Alt dopo</th><th>HTTP · HTML / idratazione / ritorno / cambio lingua</th></tr></thead><tbody>${details}</tbody></table>
<h2>Isolamento della modifica</h2><p>Gli HTML grezzi di tutti i ${after.pages} URL sono uguali byte per byte dopo la sola sostituzione attesa dell’alt del hero nelle home e del riferimento esatto al bundle applicativo ricompilato: <code>${esc(JSON.stringify(comparison.entryScriptFingerprint))}</code>. Il fingerprint del bundle non è un token di cache di sviluppo e non è presentato come tale. Nessuna normalizzazione di testo, title, description, canonical, hreflang, JSON-LD, avvisi IA, didascalie, sorgenti responsive o stile. Le undici immagini originali e derivate corrispondono ai blob della revisione iniziale.</p>
<p>Sono conservati anche gli HTML grezzi dell’anteprima di sviluppo prima/dopo. Le loro differenze includono metadati diagnostici di Vite e coordinate del codice sorgente: non vengono usati come prova di uguaglianza dei documenti di produzione. Il confronto certificante usa esclusivamente gli snapshot HTTP della build candidata e non elimina token di sviluppo.</p>
<h2>Problemi preesistenti fuori perimetro</h2><p>Il confronto con il catalogo individua inoltre ${preexistingOtherAlt.length} alt non corrispondenti alla lingua nelle altre immagini delle home ${esc([...new Set(preexistingOtherAlt.map(row => row.locale.toUpperCase()))].join(', '))}. Sono documentati singolarmente in comparison.json e lasciati invariati. Non riguardano il hero e non risultano dall’indicatore generico di alt non vuoto dell’auditor globale. Nessuna correzione estranea è stata eseguita.</p>
<h2>Metodo e limiti</h2><p>Verifica locale del candidato con host WWW simulato e sorgente editoriale isolata vuota, come nell’audit precedente. Gli URL indicati identificano le edizioni ma non attestano risposte della produzione pubblicata. Nessun accesso a Search Console; nessun invio email, chiamata AI o modifica a consensi, Secrets, API, impostazioni di indicizzazione o avvisi IA. Le home storiche e quelle native ricevono esplicitamente solo la lingua per l’alt; nessun provider ampliato. Le prove e i comandi dettagliati sono nel documento di consegna e nei log allegati. Gli eventuali tentativi intermedi sono separati dal candidato finale.</p></html>`);
console.log(JSON.stringify({ pagesCompared: after.pages, homes: rows.length, changedAlt: 11, assets: assets.length, passed: true }));
