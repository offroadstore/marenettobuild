import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import path from 'node:path';
import { publicEditions, PUBLIC_ORIGIN } from './public-release.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { escapeHtml } from './seo-document.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const inventory = await read('src/localization/phase2/inventory.json');
const supplemental = await read('src/localization/phase2/supplemental.json');
const allRecords = [...inventory.records, ...supplemental.records];
const baseline = await read('src/localization/phase2/baseline.json');
const sources = await read('../../docs/production-readiness/phase2/sources.json');
const manifest = await read('dist/public/route-manifest.json');
const headers = { 'x-forwarded-host': 'www.marenettobuild.com', 'x-forwarded-proto': 'https' };
const topology = await editorialTopology({ publicIndexing: true });
const report = { scope: 'Candidate HTTP; isolated empty editorial snapshot; no production publishing or writes',
  baseline: 270, originalCandidates: 80, supplementalCandidates: 8, candidates: [], baselineChanges: [],
  links: [], images: [], failures: [], approvalCount: 0 };
const failures = (path, message) => report.failures.push({ path, message });
const documents = new Map();
const hash = value => createHash('sha256').update(value).digest('hex');
const text = value => value.replace(/<[^>]*>/g, ' ').replaceAll('&amp;', '&').replaceAll('&#x27;', "'")
  .replaceAll('&quot;', '"').replaceAll('&nbsp;', ' ').replace(/\s+/g, ' ').trim();
const unchangedNames = new Set(['Microverlay Base', 'Microverlay Finish', 'Skyconcrete Outdoor',
  'Soprintendenza di Palermo', 'Campofelice di Roccella']);
const linkPaths = new Set();
const imagePaths = new Set();
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"');
try {
  const xml = await (await fetch(topology.origin + '/sitemap.xml', { headers })).text();
  const indexable = publicEditions(manifest);
  if (indexable.length !== baseline.length - supplemental.records.length) failures('sitemap', 'Unexpected indexable URL count');
  for (const e of baseline) {
    if (!indexable.some(actual => actual.path === e.path) && !supplemental.records.some(s => s.path === e.path)) failures(e.path, 'Existing indexable URL lost without documented reason');
    const raw = await readFile(path.join(root, 'dist/public', manifest.pages[e.path]), 'utf8');
    if (hash(raw) !== e.sha256) report.baselineChanges.push(e.path);
  }
  for (const e of allRecords) {
    const res = await fetch(topology.origin + e.path, { headers });
    const html = await res.text();
    documents.set(e.path, html);
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
    const actual = manifest.editions[e.path];
    if (res.status !== 200) failures(e.path, `HTTP ${res.status}`);
    if (!main.includes('<h1')) failures(e.path, 'No SSR H1');
    if (actual.contentLanguage !== e.locale || !html.includes(`lang="${e.locale}"`)) failures(e.path, 'Language mismatch');
    if (!html.includes(`href="${PUBLIC_ORIGIN}${e.path}"`)) failures(e.path, 'Missing self canonical');
    if (!html.includes(escapeHtml(e.title)) || !html.includes(escapeHtml(e.description))) failures(e.path, 'Metadata mismatch');
    if (!e.approval) {
      if (!/name="robots" content="noindex, nofollow"/.test(html)) failures(e.path, 'Unapproved translation indexable');
      if (xml.includes(`<loc>${PUBLIC_ORIGIN}${e.path}</loc>`)) failures(e.path, 'Unapproved translation in sitemap');
      if (/<link[^>]+hreflang=/.test(html)) failures(e.path, 'Unapproved translation claims equivalents');
    } else report.approvalCount++;
    if (/Chi siamo|Domande Frequenti|Affida la tua casa|Scegliere Marenetto|Quattordici articoli, riletti|Domande utili da porsi|Il supporto determina la fattibilità/.test(text(main))) failures(e.path, 'Italian source body residue');
    // Compare every substantial source text node, excluding documentary names,
    // historical URL slugs and explicitly labelled original-language passages.
    const source = sources[e.sourceKey];
    const italian = source.html ?? source.body;
    const target = text(main.replace(/<span\b[^>]*lang="(?:it|en)"[^>]*>[\s\S]*?<\/span>/g, '')
      .replace(/<a\b[^>]*lang="it"[^>]*>[\s\S]*?<\/a>/g, ''));
    const strings = [...italian.matchAll(/>([^<]{15,})</g)].map(m => text(m[1]))
      .filter(s => s.length > 15 && !unchangedNames.has(s) && !/^[-+\d\s.,:]+$|^\/|^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(s) &&
        !/Cefalù|Marenetto|marenetto|Isoplam|ANIT|ENEA|Gazzetta|Agenzia|Camera di|Regione Siciliana|D\.M\.|D\.P\.R\.|https:|SS 113|Email:|info@/i.test(s));
    const residues = [...new Set(strings.filter(s => target.includes(s)))];
    if (residues.length) failures(e.path, 'Untranslated source nodes: ' + residues.join(' | '));
    const missingAlts = [...main.matchAll(/<img\b[^>]*>/g)].filter(([tag]) => !/\balt=/.test(tag)).length;
    if (missingAlts) failures(e.path, 'Missing image alt');
    for (const [, href] of main.matchAll(/\bhref="([^"]+)"/g)) {
      const target = new URL(decode(href), PUBLIC_ORIGIN + e.path);
      if (target.origin === PUBLIC_ORIGIN && !/^\/(?:api|internal|owner-demo|sign-in|sign-up)(?:\/|$)/.test(target.pathname)) linkPaths.add(target.pathname);
      if (target.origin === PUBLIC_ORIGIN && target.pathname === e.path && target.hash === '#contatti' && !main.includes('id="contatti"')) failures(e.path, 'Missing historical contact anchor');
    }
    for (const [tag] of main.matchAll(/<img\b[^>]*>/g)) {
      const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
      if (!src) failures(e.path, 'Image without source');
      else if (src.startsWith('/')) imagePaths.add(decode(src));
      const alt = decode(tag.match(/\balt="([^"]*)"/)?.[1] ?? '');
      if (/Immagine di copertina|dell.articolo originale/.test(alt)) failures(e.path, 'Italian image alt');
    }
    report.candidates.push({ path: e.path, locale: e.locale, kind: e.kind, status: res.status,
      contentLanguage: actual.contentLanguage, revisionSHA256: e.revisionSHA256, sourcePath: e.sourcePath,
      sourceRevisionSHA256: e.sourceRevisionSHA256, title: e.title, description: e.description,
      approved: Boolean(e.approval), canonical: PUBLIC_ORIGIN + e.path });
  }
  for (const pathname of linkPaths) {
    let target = pathname;
    let response;
    for (let hop = 0; hop < 5; hop++) {
      response = await fetch(topology.origin + target, { headers, method: 'HEAD', redirect: 'manual' });
      if (![301, 302, 307, 308].includes(response.status)) break;
      const location = new URL(response.headers.get('location'), PUBLIC_ORIGIN);
      if (location.origin !== PUBLIC_ORIGIN) break;
      target = location.pathname + location.search;
    }
    report.links.push({ path: pathname, status: response.status });
    if (response.status !== 200) failures(pathname, `Candidate internal link HTTP ${response.status}`);
  }
  for (const pathname of imagePaths) {
    const url = pathname.startsWith('/api/historical-media/') ? 'http://localhost:80' + pathname : topology.origin + pathname;
    const response = await fetch(url, { headers, method: 'HEAD' });
    report.images.push({ path: pathname, status: response.status });
    if (response.status !== 200) failures(pathname, `Candidate image HTTP ${response.status}`);
  }
} finally { await topology.close(); }

// Verify the translated full-text blocks in the actual SSR, not merely catalog keys.
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'),
  optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
  const { historicalDocument, historicalInventory, loadHistorical } = await vite.ssrLoadModule('/src/content/historical.ts');
  const { articles } = await vite.ssrLoadModule('/src/content/articles.ts');
  const { translateText, loadLocaleCatalog } = await vite.ssrLoadModule('/src/localization/runtime.ts');
  for (const e of allRecords) {
    await loadLocaleCatalog(e.locale);
    const result = await render(e.path, e.locale);
    if (e.kind === 'article' && !e.historical && (!result.fullTextProof || result.fullTextProof.missingBlocks)) failures(e.path, 'Incomplete full text proof');
    if (e.kind === 'article' && !e.historical) {
      const a = articles.find(a => a.slug === e.id);
      const translated = translateText(e.locale, a.approvedFullText);
      const sourceBlocks = a.approvedFullText.trim().split(/\n\s*\n/);
      const targetBlocks = translated.trim().split(/\n\s*\n/);
      if (sourceBlocks.length !== targetBlocks.length) failures(e.path, 'Paragraph count mismatch');
      const numeric = s => (s.match(/\d+(?:[.,]\d+)*/g) ?? []).join('|');
      if (numeric(a.approvedFullText) !== numeric(translated)) failures(e.path, 'Numeric/legal reference mismatch');
    }
    if (e.historical) {
      await loadHistorical(e.locale);
      const page = historicalInventory.find(p => p.path === e.path);
      const doc = historicalDocument(page);
      if (!result.body.includes(doc.html)) failures(e.path, 'Historical translated document not served completely');
    }
    // No stale translation may hide an active or withdrawn Italian source.
    const changed = await render(e.path, e.locale, [{ path: e.sourcePath, locale: 'it', identity: e.id,
      revisionId: 'withdrawn', kind: 'page', content: {} }]);
    if (!changed.body.includes('role="alert"')) failures(e.path, 'Changed source did not suppress stale translation');
  }
} finally { await vite.close(); }

const out = path.resolve(root, '../../generated-artifacts/phase2');
await mkdir(out, { recursive: true });
await writeFile(path.join(out, 'audit.json'), JSON.stringify(report, null, 2));
const simplify = html => html.replace(/<script\b[\s\S]*?<\/script>|<svg\b[\s\S]*?<\/svg>/gi, '')
  .replace(/<img\b[^>]*>/gi, tag => `<p class="alt">Alt: ${escapeHtml(tag.match(/\balt="([^"]*)"/)?.[1] ?? '')}</p>`)
  .replace(/\bhref="\/[^"]*"/g, 'data-original-link=""');
const glossary = await read('src/localization/phase2/glossary.json');
const exceptions = await read('src/localization/phase2/editorial-exceptions.json');
const summary = `80 URL riconciliate: 24 pagine principali, 14 archivi, 42 articoli. Inoltre corretti i residui italiani di 8 edizioni già classificate native. ${report.approvalCount} nuove approvazioni del titolare registrate. ${report.failures.length} errori nell’audit HTTP delle candidate.`;
const cards = allRecords.map(e => {
  const source = sources[e.sourceKey];
  const sourceBody = source.html ?? source.body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? source.body;
  const target = documents.get(e.path)?.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
  return `<details><summary>${escapeHtml(e.locale.toUpperCase() + ' · ' + e.title)}</summary>
    <p>URL: ${escapeHtml(e.path)} · sorgente: ${escapeHtml(e.sourcePath)}</p>
    <p>Revisione: <code>${e.revisionSHA256}</code><br>Sorgente: <code>${e.sourceRevisionSHA256}</code></p>
    <p><b>Da approvare sul testo effettivo.</b> Nessuna certificazione umana. Canonical proprio; noindex e nessun hreflang finché non approvata.</p>
    <h3 lang="${e.locale}">${escapeHtml(e.title)}</h3><p lang="${e.locale}">${escapeHtml(e.description)}</p>
    <div class="pair"><section lang="it"><h3>Sorgente italiana</h3>${simplify(sourceBody)}</section>
    <section lang="${e.locale}"><h3>Destinazione · ${e.locale.toUpperCase()}</h3>${simplify(target)}</section></div></details>`;
}).join('\n');
const glossaryHtml = Object.entries(glossary).map(([locale, entries]) => `<h3>${locale.toUpperCase()}</h3><dl>${entries.map(g =>
  `<dt>${escapeHtml(g.italian)} → ${escapeHtml(g.translation)}</dt><dd>${escapeHtml(g.note)}</dd>`).join('')}</dl>`).join('');
await writeFile(path.join(out, 'traduzioni-revisionabili.html'), `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Fase 2 — 80 traduzioni revisionabili</title><style>body{font:16px/1.6 system-ui;max-width:1450px;margin:3rem auto;padding:0 1.5rem;color:#152e38;background:#f8f7f3}h1,h2,h3{line-height:1.25}details{border-top:1px solid #bbc6ca;padding:1rem 0}summary{cursor:pointer;font-weight:650}.pair{display:grid;grid-template-columns:1fr 1fr;gap:2rem}.pair section{min-width:0;background:white;padding:1.25rem}code{overflow-wrap:anywhere}.alt{font-style:italic}svg{display:none}a{color:#07698b}button,input,select{max-width:100%}@media(max-width:800px){.pair{grid-template-columns:1fr}}</style>
<h1>Fase 2 — traduzioni revisionabili</h1><p>${summary}</p><p>Fascicolo per la revisione dei testi, non attestazione di rilascio. Consultare GO_LIVE.md per l’esito complessivo dei controlli. L’indicizzazione delle 80 nuove edizioni e delle 8 correzioni aggiuntive resta subordinata all’approvazione dei rispettivi testi. Nessuna pubblicazione eseguita.</p>
<p>Traduzioni IA e confronto bilingue automatizzato. Dei 270 URL precedenti, 262 restano nell’insieme indicizzabile e 8 sono corretti ma in attesa di nuova approvazione. Totale riconciliato: 350 URL, non 358. Nessun alias o ricerca è stato aggiunto all’insieme pubblico. Fonti storiche e modifiche editoriali autorizzate conservate separatamente. Le immagini sono rappresentate con gli alt, senza attribuire loro valore documentale.</p>
<h2>Eccezioni editoriali esplicite</h2><p>${escapeHtml(exceptions.authorization)}</p><ul>${exceptions.changes.map(c => `<li>${escapeHtml(c.source)}: «${escapeHtml(c.before)}» → «${escapeHtml(c.after)}» nelle destinazioni tradotte; originali intatti.</li>`).join('')}</ul>
<h2>Testi completi e revisioni</h2>${cards}<h2>Glossario edilizio</h2>${glossaryHtml}</html>`);
console.log(JSON.stringify({ candidates: report.candidates.length, baseline: baseline.length,
  changedBuildFiles: report.baselineChanges.length, links: report.links.length, images: report.images.length, failures: report.failures }, null, 2));
if (report.failures.length) process.exitCode = 1;
