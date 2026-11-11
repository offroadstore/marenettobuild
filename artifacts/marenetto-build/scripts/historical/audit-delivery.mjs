/**
 * Read-only audit against separately acquired public HTTP responses.
 * Never import the page catalogs as the expected body. Generated evidence stays
 * outside Git; the ten documentary deliverables and ledgers are versionable.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { extractDocument } from './extract.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const evidence = path.resolve(process.env.HISTORICAL_AUDIT_DIR || path.join(root, '../../generated-artifacts/migration-2026-11-11'));
const destination = path.join(root, 'docs/migrazione-storica');
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const acquisition = JSON.parse(await readFile(path.join(evidence, 'acquisition.json'), 'utf8'));
const previousRecords = new Map();
for (const file of (await readdir(evidence)).filter(file => /^acquisition-before-resume-.*\.json$/.test(file)).sort()) {
  const previous = JSON.parse(await readFile(path.join(evidence, file), 'utf8'));
  for (const row of previous.records) previousRecords.set(row.url, row);
}
let current;
try { current = JSON.parse(await readFile(path.join(evidence, 'served-current.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const records = acquisition.inventory.map(item => acquisition.records.find(row => row.url === item.url) ??
  (previousRecords.has(item.url) ? { ...previousRecords.get(item.url), retryDeferred: true } : { ...item,
    key: createHash('sha256').update(item.url).digest('hex').slice(0, 16), error: 'Fonte non acquisita; verificare pending e limiti HTTP' }));
const inventory = await read('src/content/historical/index.json');
const amendments = await read('content/historical-corrections.applied.json');
const manifest = await read('dist/public/route-manifest.json');
const locales = await read('src/localization/locales.json');
const mediaMap = await read('src/content/historical-media.json');
let mediaVerification, resourceArchive, browserEvidence;
for (const [file, assign] of [
  ['media-http-verification.json', value => { mediaVerification = value; }],
  ['assets.json', value => { resourceArchive = value; }],
  ['browser.json', value => { browserEvidence = value; }],
]) {
  try { assign(JSON.parse(await readFile(path.join(evidence, file), 'utf8'))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const sha = value => createHash('sha256').update(value).digest('hex');
const normalize = value => (value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
function blockDiff(before, after) {
  const left = before.map(block => `${block.tag}: ${block.text}`);
  const right = after.map(block => `${block.tag}: ${block.text}`);
  if (left.length * right.length > 1_000_000) return ['Allineamento automatico troppo esteso; seguono i blocchi integrali non alterati.', ...left.map(line => `- ${line}`), ...right.map(line => `+ ${line}`)];
  const matrix = Array.from({ length: left.length + 1 }, () => new Uint32Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i--) for (let j = right.length - 1; j >= 0; j--) {
    matrix[i][j] = left[i] === right[j] ? 1 + matrix[i + 1][j + 1] : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
  }
  const lines = [];
  let i = 0, j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) { lines.push(`  ${left[i]}`); i++; j++; }
    else if (j < right.length && (i === left.length || matrix[i][j + 1] >= matrix[i + 1][j])) lines.push(`+ ${right[j++]}`);
    else lines.push(`- ${left[i++]}`);
  }
  return lines;
}
const key = value => value.replace(/\/+$/, '') || '/';
const csv = (columns, rows) => [columns, ...rows.map(row => columns.map(column => {
  const value = row[column];
  return value && typeof value === 'object' ? JSON.stringify(value) : value ?? '';
}))].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n') + '\n';
await mkdir(destination, { recursive: true });
await mkdir(path.join(evidence, 'diffs'), { recursive: true });
const browser = await chromium.launch({ executablePath: '/repl/tools/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const rows = [];
try {
  const parser = await browser.newPage();
  for (const record of records) {
    const fresh = current?.records.find(row => row.url === record.url);
    if (fresh?.response) record.new = { ...fresh.response, document: fresh.response.htmlDocument ? {} : undefined };
    const url = new URL(record.url);
    // Re-extract the saved bytes, not stale extraction fields or generator data.
    for (const side of ['original', 'new']) {
      const response = record[side];
      if (response?.document) response.document = await parser.evaluate(extractDocument, {
        html: await readFile(path.join(evidence, response.hops.at(-1).file), 'utf8'),
        url: response.finalURL, side,
      });
    }
    const original = record.original?.document;
    const served = record.new?.document;
    const page = inventory.find(page => page.key === key(url.pathname));
    const changes = amendments.changes.filter(change => change.path === page?.path);
    let expected = original?.body;
    const amendmentFindings = [];
    for (const change of changes) {
      const htmlText = await parser.evaluate(html => new DOMParser().parseFromString(html, 'text/html').body.textContent, change.beforeHTML);
      const candidates = [...new Set([change.before, normalize(htmlText)])];
      let matched = false;
      for (const before of candidates) {
        const expression = new RegExp(before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*'), 'g');
        if (expected && [...expected.matchAll(expression)].length === 1) {
          expected = expected.replace(expression, () => change.after);
          matched = true;
          break;
        }
      }
      if (!matched) amendmentFindings.push(`Passaggio autorizzato non individuato univocamente: ${change.claim}`);
    }
    expected = normalize(expected);
    for (const side of ['original', 'new']) for (const hop of record[side]?.hops ?? []) {
      if (sha(await readFile(path.join(evidence, hop.file))) !== hop.sha256) throw new Error(`Integrity failure: ${hop.file}`);
    }
    const exact = Boolean(original && served && original.body === served.body);
    const authorized = Boolean(changes.length && !amendmentFindings.length && served && expected === served.body);
    const mainPass = Boolean(record.original?.status === 200 && record.new?.status === 200 && original && served
      && (exact || authorized) && original.title === served.title && original.h1[0] === served.h1[0]);
    const fields = {};
    const comparable = Boolean(original && served && record.original?.status === 200 && record.new?.status === 200);
    for (const field of ['description', 'robots', 'blocks', 'headings', 'lists', 'tables', 'captions', 'images', 'attachments', 'editorial', 'canonical', 'alternates', 'htmlLang']) {
      const same = JSON.stringify(original?.[field]) === JSON.stringify(served?.[field]);
      fields[field] = { result: !comparable ? 'non verificato' : same ? 'superato' : 'differente',
        original: original?.[field] ?? null, served: served?.[field] ?? null,
        disposition: !comparable ? 'non verificata; risposta non confrontabile come edizione pubblica' : same ? 'identico' : 'aperta; consultare il diff, nessuna equivalenza presunta' };
    }
    if (comparable && original.canonical && served.canonical
      && new URL(original.canonical).pathname === new URL(served.canonical).pathname) {
      fields.canonical.disposition = 'giustificata: stesso percorso, origine SEO di anteprima separata dal dominio storico';
    }
    if (comparable && JSON.stringify(original.headings.map(h => h.text)) === JSON.stringify(served.headings.map(h => h.text))
      && original.headings.every((h, i) => h.tag === served.headings[i].tag || (h.tag === 'h1' && served.headings[i].tag === 'h2'))) {
      fields.headings.disposition = 'giustificata: parole e ordine identici; H1 subordinati convertiti in H2 come da baseline';
    }
    if (original && served) {
      fields.images.urlMapping = original.images.map(image => ({ original: image.src, migrated: mediaMap[image.src] ?? null }));
      if (comparable && original.images.length === served.images.length && original.images.every((image, index) => {
        const candidate = served.images[index];
        return mediaMap[image.src] && new URL(candidate.src, record.new.finalURL).pathname === mediaMap[image.src]
          && image.alt === candidate.alt && image.width === candidate.width && image.height === candidate.height;
      })) fields.images.disposition = 'giustificata: stessi file per SHA-256 e attributi; URL trasferiti nel delivery indipendente';
    }
    const contentLinks = doc => (doc?.links ?? []).filter(link => link.context === 'content-link').map(({ href, label, download }) => ({ href, label, download }));
    fields.links = { original: contentLinks(original), served: contentLinks(served),
      result: !comparable ? 'non verificato' : JSON.stringify(contentLinks(original)) === JSON.stringify(contentLinks(served)) ? 'superato' : 'differente',
      disposition: 'aperta; domini e navigazione possono differire, riferimenti integrali conservati nel diff' };
    const http = {
      original: record.original ? { initial: record.original.initialStatus, final: record.original.status, chain: record.original.hops.map(h => ({ url: h.url, status: h.status, location: h.headers.location ?? null })) } : null,
      served: record.new ? { initial: record.new.initialStatus, final: record.new.status, chain: record.new.hops.map(h => ({ url: h.url, status: h.status, location: h.headers.location ?? null })) } : null,
    };
    const row = {
      id: page?.id ?? `url:${sha(record.url).slice(0, 24)}`, url: record.url, path: url.pathname, query: url.search,
      discoveries: record.discoveries, family: page?.family ?? record.family, locale: page?.locale ?? record.declaredLocale ?? 'non determinata',
      actualLanguage: page?.contentLanguage ?? 'non verificata', actualLanguageEvidence: page ? 'classificazione precedente; non equivale a revisione linguistica di questa acquisizione' : 'nessuna inferenza dal percorso',
      kind: page?.kind ?? (record.original?.feed ? 'feed' : original ? 'HTML non classificato' : 'non HTML o non disponibile'),
      acquiredAt: record.original?.hops.at(-1)?.acquiredAt, sourceFile: record.original?.hops.at(-1)?.file,
      sourceSHA256: record.original?.hops.at(-1)?.sha256, sourceBodySHA256: original ? sha(original.body) : null,
      servedFile: record.new?.hops.at(-1)?.file, servedBodySHA256: served ? sha(served.body) : null,
      originalTitle: original?.title, servedTitle: served?.title, originalH1: original?.h1, servedH1: served?.h1,
      bodyExact: exact, bodyWithAuthorizedChanges: authorized, amendmentFindings, pathPreserved: record.new ? new URL(record.new.finalURL).pathname === url.pathname : false,
      bodyResult: !original || record.original?.status !== 200 ? 'non verificato' : mainPass ? 'superato' : 'fallito',
      disposition: exact && mainPass ? 'testo identico' : authorized && mainPass ? 'correzioni italiane autorizzate; altre lingue da revisionare' : 'aperta',
      noindex: Boolean(record.new?.hops.some(hop => /noindex/.test(hop.headers['x-robots-tag'] ?? ''))),
      remoteImages: (served?.images ?? []).filter(img => /^https?:/.test(img.src ?? '') && !img.src.startsWith(new URL(record.new.finalURL).origin)),
      title: original?.title, description: original?.description ?? null, http, fields, error: record.error ?? null,
    };
    rows.push(row);
    const lines = [`# ${record.url}`, '', `Esito corpo: ${row.bodyResult}; ${row.disposition}`, '',
      `SHA-256 fonte: ${row.sourceBodySHA256}`, `SHA-256 servito: ${row.servedBodySHA256}`, '',
      '## Diff leggibile dei blocchi (− fonte, + servito)', '', '```diff',
      ...blockDiff(original?.blocks ?? [], served?.blocks ?? []), '```', '',
      '## Corpo originale integrale', '', original?.body ?? '(non disponibile)', '',
      '## Corpo effettivamente servito', '', served?.body ?? '(non disponibile)', '',
      '## Struttura, risorse, lingua, metadati e HTTP', '', '```json', JSON.stringify({ http, fields, amendmentFindings }, null, 2), '```'];
    await writeFile(path.join(evidence, 'diffs', `${record.key}.md`), lines.join('\n'));
  }
} finally { await browser.close(); }
const htmlRows = rows.filter(row => row.http.original?.final === 200 && row.sourceBodySHA256);
const resultCounts = Object.fromEntries(['superato', 'fallito', 'non verificato'].map(result => [result, rows.filter(row => row.bodyResult === result).length]));
const fieldChecks = rows.flatMap(row => Object.entries(row.fields).map(([field, check]) => ({ url: row.url, field, result: check.result, disposition: check.disposition })));
const fieldCheckCounts = Object.fromEntries(['superato', 'differente', 'non verificato'].map(result => [result, fieldChecks.filter(check => check.result === result).length]));
const summary = {
  acquiredAt: acquisition.acquiredAt, auditCreatedAt: new Date().toISOString(), appCommit: acquisition.commit,
  commitMeaning: 'HEAD at acquisition, not a claim of a clean working tree. Served response hashes, served-current.json and code-inputs.json identify the measured artifact.',
  auditCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), complete: false,
  discovered: acquisition.inventory.length, acquired: records.filter(row => row.original).length, pending: records.filter(row => !row.original).length,
  retryPending: acquisition.inventory.length - acquisition.records.length,
  compared: rows.length, sourceHTTPCounts: Object.fromEntries([...new Set(records.map(row => row.original?.status ?? 'non acquisito'))].map(status => [status, records.filter(row => (row.original?.status ?? 'non acquisito') === status).length])),
  stoppedForRateLimit: acquisition.stoppedForRateLimit ?? false,
  acquisitionErrors: acquisition.records.filter(record => record.error).length, capReached: acquisition.capped,
  sourceHTML200: htmlRows.length, exactBodyAndTitle: htmlRows.filter(row => row.bodyResult === 'superato' && row.bodyExact).length,
  authorizedBodyAndTitle: htmlRows.filter(row => row.bodyResult === 'superato' && !row.bodyExact && row.bodyWithAuthorizedChanges).length,
  italianAuthorizedCorrectionMatches: htmlRows.filter(row => row.locale === 'it' && row.bodyResult === 'superato' && !row.bodyExact && row.bodyWithAuthorizedChanges).length,
  foreignDraftCorrectionMatches: htmlRows.filter(row => row.locale !== 'it' && row.bodyResult === 'superato' && !row.bodyExact && row.bodyWithAuthorizedChanges).length,
  historicalArticleFamilies: new Set(inventory.filter(p => p.kind === 'article').map(p => p.family)).size,
  historicalArticleEditions: inventory.filter(p => p.kind === 'article').length,
  historicalLocales: [...new Set(inventory.map(p => p.locale))].sort(), implementedLocales: locales.map(locale => locale.code),
  sourceRedirects: rows.filter(row => row.http.original && row.http.original.chain.length > 1).length,
  newRedirects: rows.filter(row => row.http.served && row.http.served.chain.length > 1).length,
  remoteImageReferences: rows.reduce((count, row) => count + row.remoteImages.length, 0),
  resourceArchive: resourceArchive?.summary ?? null, mediaDelivery: mediaVerification?.summary ?? null,
  browserCoverage: browserEvidence ? { total: browserEvidence.totalDiscovered, observed: browserEvidence.browserVisitEvidence, categories: browserEvidence.categories, complete: browserEvidence.complete } : null,
  resultCounts, eligibleSitemap: acquisition.build.eligibleSitemapCount,
  fieldChecks: { total: fieldChecks.length, counts: fieldCheckCounts, justifiedDifferences: fieldChecks.filter(check => check.result === 'differente' && check.disposition.startsWith('giustificata')).length,
    openDifferences: fieldChecks.filter(check => check.result === 'differente' && !check.disposition.startsWith('giustificata')).length },
  limitations: ['Nessuna esportazione CMS pubblica o Search Console/analytics fornita', 'Revisioni linguistiche non dedotte dalle chiavi',
    ...(rows.some(row => row.remoteImages.length) ? ['Restano risorse remote nel delivery; vedere le associazioni per pagina'] : []),
    'Il risultato corpo/titolo non certifica metadati, struttura o risorse', 'Secondo controllo browser indipendente parziale; nessuna copertura presunta',
    ...(acquisition.stoppedForRateLimit ? ['Il sito storico ha risposto 429 anche alla ripresa lenta; interrotti i tentativi, conservate le risposte precedenti'] : [])],
};
await writeFile(path.join(evidence, 'audit.json'), JSON.stringify({ summary, rows }, null, 2));
await writeFile(path.join(destination, 'conteggi.json'), JSON.stringify(summary, null, 2) + '\n');
await writeFile(path.join(destination, 'inventario-url.csv'), csv(['id', 'url', 'path', 'query', 'family', 'locale', 'actualLanguage', 'kind', 'acquiredAt', 'sourceFile', 'sourceSHA256', 'bodyResult', 'disposition'], rows));
await writeFile(path.join(destination, 'matrice-url.csv'), csv(['url', 'path', 'pathPreserved', 'http', 'bodyExact', 'bodyWithAuthorizedChanges', 'bodyResult', 'disposition'], rows));
await writeFile(path.join(destination, 'matrice-lingue.csv'), csv(['id', 'family', 'path', 'locale', 'actualLanguage', 'actualLanguageEvidence', 'bodyResult', 'disposition'], rows));
const newEditions = Object.values(manifest.editions).map(edition => {
  const observed = rows.find(row => key(row.path) === key(edition.path));
  return { ...edition, historicalCorrespondence: observed?.url ?? null,
    independentBodyCheck: observed?.bodyResult ?? 'non verificato contro una fonte storica indipendente',
    independentBodyDisposition: observed?.disposition ?? 'nuova composizione o bozza, non originale storico',
    approvalMeaning: 'Stato registrato nel generatore; nessuna approvazione estesa automaticamente da lingua o chiavi' };
});
await writeFile(path.join(destination, 'matrice-nuove-lingue.csv'), csv(['id', 'kind', 'locale', 'path', 'contentLanguage', 'title', 'description', 'state', 'approval', 'sitemap', 'source', 'historicalCorrespondence', 'independentBodyCheck', 'independentBodyDisposition', 'approvalMeaning'], newEditions));
await writeFile(path.join(destination, 'redirect.csv'), csv(['url', 'http', 'pathPreserved', 'bodyResult'], rows.filter(row => row.http.original?.chain.length > 1 || row.http.served?.chain.length > 1)));
await writeFile(path.join(destination, 'differenze.csv'), csv(['url', 'sourceBodySHA256', 'servedBodySHA256', 'bodyExact', 'bodyWithAuthorizedChanges', 'bodyResult', 'disposition', 'amendmentFindings'], rows));
await writeFile(path.join(destination, 'controlli-dimensioni.csv'), csv(['url', 'field', 'result', 'disposition'], fieldChecks));
await writeFile(path.join(destination, 'eccezioni-editoriali.json'), JSON.stringify({ authorization: amendments.authorization, publicationApproved: false, changes: amendments.changes, missingCounterparts: amendments.missingCounterparts }, null, 2) + '\n');
const docs = [
  ['01-inventario-fonti.md', 'Inventario delle fonti', `Acquisizione indipendente: ${acquisition.acquiredAt}. Sorgente ${acquisition.originalOrigin}.\n\n${rows.length} risposte su ${acquisition.inventory.length} URL scoperti; limite raggiunto: ${acquisition.capped}; errori: ${summary.acquisitionErrors}.\n\nRegistro completo: inventario-url.csv. La provenienza di ogni URL include sitemap, selettori, link, feed e copie locali. Sono conservati percorsi, query e catene HTTP. Le ancore si trovano nei link integrali dei diff.\n\nLe copie del 17 ottobre restano intatte: la data dichiarata non prova l'acquisizione né la lingua effettiva. Gli archivi correnti contengono nove lingue storiche. Nessun accesso a dati privati o invio di moduli.\n\nLe fonti grezze, intestazioni selezionate senza cookie, hash e contenuti estratti si trovano nel pacchetto separato. robots, sitemap e indici vengono acquisiti ricorsivamente. Il grafo pubblico non dimostra la completezza del database CMS; esportazione pubblica non disponibile.`],
  ['02-matrice-url.md', 'Matrice degli URL', `Vedere matrice-url.csv, una riga per ogni URL osservato, senza dedurre alias da uno slug straniero.\n\n${summary.sourceRedirects} URL con redirect osservato sulla fonte; ${summary.newRedirects} sul nuovo sito. Le catene riportano status iniziale, ogni passaggio e destinazione.\n\nUn 200, una canonicalizzazione dello slash o il solo mantenimento dell'indirizzo non equivalgono a conservazione del testo. Gli ID di contenuto derivano dall'inventario storico; le voci senza corrispondenza usano un identificatore SHA-256 stabile dell'URL, non un'identità editoriale inventata.`],
  ['03-matrice-lingue.md', 'Lingue storiche e nuove', `Lingue storiche: ${summary.historicalLocales.join(', ')}. Lingue implementate: ${summary.implementedLocales.join(', ')}.\n\nMatrice osservata: matrice-lingue.csv. Nessuna lingua eliminata. La lingua del corpo precedente viene indicata separatamente da quella del percorso: non è una revisione madrelingua della nuova acquisizione.\n\nLe altre lingue restano nuove composizioni/bozze, non originali storici. Le correzioni straniere non ereditano l'autorizzazione italiana. Completezza delle chiavi, equivalenza dei corpi e approvazione linguistica sono controlli distinti. Il rapporto delle chiavi e dei fallback è allegato separatamente quando eseguito; valori popolati non sono prova di traduzione.`],
  ['04-registro-redirect.md', 'Registro dei redirect', 'Vedere redirect.csv. Sono registrate separatamente le catene della fonte e quelle della destinazione. Non sono introdotti redirect generici o accorpamenti durante questo audit.\n\nQuery e ancore sono conservate nelle evidenze; eventuali politiche UTM del nuovo sito non vengono scambiate per comportamento storico. Maiuscole e URL codificati non osservati rimangono non verificati, non equivalenze presunte.'],
  ['05-confronto-contenuti.md', 'Confronto dei contenuti', `Primo confronto sull'intero inventario: ${rows.length} URL, inclusi indisponibili, feed e alias. Vedere differenze.csv e diffs/ nel pacchetto.\n\n${summary.exactBodyAndTitle} corrispondenze integrali corpo/titolo; ${summary.authorizedBodyAndTitle} corrispondenze salvo sostituzioni esplicite. Normalizzazione limitata agli spazi, NBSP e tag di presentazione; numeri, negazioni e punteggiatura non vengono eliminati.\n\nOgni diff contiene corpi integrali e confronto di blocchi, titoli di sezione, elenchi, tabelle, immagini, didascalie, allegati, dati editoriali, metadati, lingua e HTTP. Le differenze non vengono automaticamente giustificate perché corpo e titolo coincidono. L'adattamento H1→H2 dei titoli subordinati è già dichiarato nella baseline. Grafica, hero e logo approvati non sono modificati.`],
  ['06-eccezioni-decisioni.md', 'Eccezioni e decisioni', 'eccezioni-editoriali.json conserva ogni passaggio prima/dopo e l’autorizzazione italiana precedente. Gli originali non sono sovrascritti.\n\nDecisioni aperte: revisione effettiva delle formulazioni straniere; verifiche professionali pertinenti e diritti sulle immagini prima del rilascio. Le immagini storiche non dimostrano lavori o attrezzature aziendali. I feed sospesi non vengono ripubblicati per aggirare la revisione.\n\nServe un’esportazione dei soli contenuti pubblicati del CMS per riconciliare contenuti non collegati: URL, stato pubblico, lingua, titolo, corpo HTML, date, canonical, media e allegati. Non servono account o dati dei clienti. Non è possibile attestare il traffico storico senza esportazioni Search Console/analytics.'],
  ['07-primo-controllo.md', 'Risultati del primo controllo', `Esiti corpo/titolo: ${JSON.stringify(resultCounts)}. Totale riconciliato: ${Object.values(resultCounts).reduce((a, b) => a + b, 0)}.\n\nLa fonte attesa è una risposta pubblica grezza acquisita indipendentemente, non l'oggetto che genera le pagine. La destinazione è l'handler HTTP realmente in ascolto. Tutte le impronte dei file acquisiti sono ricontrollate prima del confronto.\n\nQuesti conteggi non sono un’approvazione complessiva: ogni altra dimensione ha un confronto proprio in audit.json. Le risposte di esclusione o feed senza corpo HTML sono non verificate per il testo, non promosse a superate.`],
  ['08-secondo-controllo.md', 'Risultati del secondo controllo', 'Le precedenti dichiarazioni di verifiche browser non sono nuove prove di questa acquisizione. Un file di generatore o una verifica DOMParser non è una verifica della pagina idratata.\n\nVedere il registro browser separato, quando disponibile, con URL effettivo, viewport, testo renderizzato, risorse e link. Se assente, il secondo controllo dell’intero inventario è NON VERIFICATO. Gli esiti del workflow di regressione sono riportati separatamente senza equipararli alla copertura storica completa.\n\nBaseline visiva corrente: desktop 1440×1000, salvata prima di qualunque modifica al contenuto. Smartphone, tablet, testi lunghi e RTL devono avere evidenze proprie; nessun esito positivo presunto.'],
  ['09-checklist-dominio.md', 'Checklist del dominio definitivo', '- [ ] Riconciliare esportazione dei contenuti pubblicati con il grafo acquisito.\n- [ ] Chiudere differenze di struttura, media e metadati, non soltanto testo.\n- [ ] Trasferire e verificare tutte le risorse indipendentemente dal vecchio hosting.\n- [ ] Confermare diritti e liberatorie senza dedurli dalla vecchia pubblicazione.\n- [ ] Approvare le traduzioni pagina per pagina.\n- [ ] Verificare canonical e alternati dei soli equivalenti reali.\n- [ ] Configurare separatamente l’origine pubblica approvata, mai un URL Replit implicito.\n- [ ] Eseguire i controlli dominio/indicizzabilità in un incarico separato con autorizzazione.\n- [ ] Preparare monitoraggio Search Console, 404, redirect, canonical e traffico dopo il lancio.\n\nAnteprima sempre noindex/nofollow e robots Disallow: /. Nessun deployment o modifica del dominio eseguiti. Sitemap futura limitata alle edizioni ammissibili, non una dichiarazione di copertura completa.'],
  ['10-relazione-finale.md', 'Relazione al titolare — migrazione ancora aperta', `La migrazione NON è dichiarata completa.\n\nQuesta acquisizione contabilizza ${summary.discovered} URL, ${summary.sourceHTML200} risposte HTML 200, ${summary.historicalArticleFamilies} famiglie articolo e ${summary.historicalArticleEditions} percorsi articolo registrati in ${summary.historicalLocales.length} lingue storiche; ${summary.implementedLocales.length} lingue del nuovo progetto sono mantenute.\n\nSono dimostrate ${summary.exactBodyAndTitle} corrispondenze corpo/titolo esatte e ${summary.authorizedBodyAndTitle} con sole modifiche autorizzate. Ci sono ${resultCounts.fallito} fallimenti del confronto corpo/titolo e ${resultCounts['non verificato']} casi non verificabili con quel confronto. Risorse remote ancora referenziate: ${summary.remoteImageReferences} occorrenze, non altrettanti file unici.\n\nLe approvazioni linguistiche, il residuo CMS non collegato, il delivery delle risorse e il secondo controllo indipendente devono restare espliciti. Non sono ricostruiti testi tramite IA; gli originali e le fotografie non sono sostituiti. I documenti numerati sono versionabili; i file grezzi voluminosi, gli estratti completi e i diff sono nel pacchetto separato con hash.\n\nNessuna grafica approvata cambiata, nessuna pubblicazione, nessuna apertura ai motori, nessun modulo reale inviato.`],
];
for (const document of docs) {
  const [file, title] = document;
  let body = document[2];
  if (file.startsWith('01-')) body += `\n\n## Risposte HTTP e limite della fonte\n\nDistribuzione delle ultime risposte disponibili: ${JSON.stringify(summary.sourceHTTPCounts)}. Le ${summary.sourceHTTPCounts[429] ?? 0} risposte 429 non sono pagine inventariate con successo sul piano editoriale: sono limiti della fonte. Il contatore «errori» conta soltanto gli errori di trasporto.\n\nRipresa a una richiesta ogni 1,5 secondi, interrotta al primo nuovo 429; ${summary.retryPending} nuove acquisizioni rinviate. Le precedenti risposte e i checkpoint sono conservati. Nessuna chiusura del grafo viene dichiarata in presenza di queste risposte.`;
  if (file.startsWith('03-')) body += `\n\nInventario nuovo distinto: matrice-nuove-lingue.csv, ${newEditions.length} edizioni registrate nel build con percorso, lingua, metadati, stato, approvazione e corrispondenza storica quando osservata. Questo è un inventario del generatore, non la prova indipendente del testo tradotto.\n\nInventario chiavi: chiavi-lingue.json. Gruppi distinti per cataloghi approvati, bozze e overlay parziali; attributi accessibili, errori, conferme e template dinamici inclusi. Le chiavi non riscontrate staticamente non vengono rimosse o dichiarate certamente inutilizzate.`;
  if (file.startsWith('05-')) body += `\n\n## Altre dimensioni\n\nControlli atomici di struttura, risorse, link e metadati: ${JSON.stringify(summary.fieldChecks)}. Registro: controlli-dimensioni.csv. Una differenza aperta resta tale anche quando è una conseguenza probabile della nuova impaginazione: non viene approvata per deduzione. Una stessa pagina può avere più differenze.\n\n## Risorse\n\n${resourceArchive?.summary.passed ?? 0} risorse archiviate con hash e provenienza; ${mediaVerification?.summary.passed ?? 0} immagini distinte servite dall'API e verificate contro i byte indipendenti. Le associazioni originali e la mappatura sono nel diff e in media-delivery.json. Il backup di CSS e font non implica che quei CSS siano usati dalla grafica approvata. Occorrenze immagine ancora su hosting remoto nel corpo servito: ${summary.remoteImageReferences}.`;
  if (file.startsWith('08-')) body = `Il secondo controllo indipendente è PARZIALE: ${browserEvidence?.browserVisitEvidence ?? 0} URL con osservazioni salvate su ${summary.discovered}.\n\nCategorie registrate: ${JSON.stringify(browserEvidence?.categories ?? {})}. I sette casi autorizzati hanno solo corrispondenza di percorso registrata nel browser: le sostituzioni testuali non sono state dimostrate da quel passaggio. I 133 casi «different-or-foreign-draft» restano da approfondire; non sono automaticamente 133 regressioni confermate.\n\nIl controllo ha incontrato un limite di 45 secondi per esecuzione con perdita dello stato temporaneo. I gruppi ambigui o non raggiunti rimangono non verificati. Non è stata avviata una seconda passata completa per produrre un esito positivo presunto. Le fonti sono le risposte pubbliche indipendenti, non i cataloghi del generatore.\n\nRegistro integrale: browser.json e report.md nel pacchetto. Il passaggio ha preceduto il riallineamento delle due etichette recensioni e il trasferimento delle immagini; queste modifiche sono poi confermate via HTTP e hash, non da un'altra prova browser completa.\n\nIl workflow di regressione preesistente ha terminato con 121 test superati e 5 saltati: verifica anche l'idratazione degli URL esposti, ma confronta in parte i dati del generatore e NON sostituisce il confronto indipendente storico.\n\nEvidenze visive aggiuntive: baseline desktop 1440×1000, home smartphone 390×844 e pagina RTL su tablet 768×1024. La matrice completa di famiglie × viewport, WebKit/iOS e screen reader reali non è certificata. Nessun modulo reale inviato.`;
  if (file.startsWith('09-')) body += `\n\n### Risultato tecnico sulle immagini già consegnate\n\n${mediaVerification?.summary.passed ?? 0} immagini distinte hanno HTTP 200, SHA-256 uguale alla fonte e dimensioni naturali verificate. Il delivery non dipende più dall'hosting storico per gli URL mappati. Questo non chiude diritti, associazioni mancanti o copertura dei materiali non acquisiti.`;
  if (file.startsWith('10-')) {
    body = body.replace('Le approvazioni linguistiche, il residuo CMS non collegato, il delivery delle risorse e il secondo controllo indipendente devono restare espliciti.',
      `Le immagini mappate sono state trasferite e verificate: ${mediaVerification?.summary.passed ?? 0} file distinti. Restano aperti le approvazioni linguistiche, il residuo CMS non collegato e il secondo controllo indipendente.`);
    body += `\n\n## Limiti che impediscono la chiusura\n\n- Risposte della fonte: ${JSON.stringify(summary.sourceHTTPCounts)}; ripresa interrotta per il limite 429.\n- Controllo browser indipendente: ${browserEvidence?.browserVisitEvidence ?? 0}/${summary.discovered} URL osservati, non completo.\n- Le nove differenze corpo/titolo rimaste sono gli URL del modulo incompleto translation-ok, ancora esclusi: scelta da riconciliare esplicitamente, non pagine integralmente trasferite.\n- Differenze aperte nelle altre dimensioni: ${summary.fieldChecks.openDifferences}; differenze giustificate puntualmente: ${summary.fieldChecks.justifiedDifferences}. Sono controlli atomici, non altrettante pagine o errori certi.\n- I titoli nativi delle recensioni spagnole e olandesi sono ora riallineati alle risposte acquisite, attraverso un overlay datato; i cataloghi precedenti non sono sovrascritti.\n\nIl titolare può fornire un'esportazione pubblica del CMS per i candidati limitati o non collegati. Le decisioni su esclusioni, lingue e diritti restano separate dal superamento dei controlli tecnici.`;
    body += `\n\nLe corrispondenze con sostituzioni registrate si dividono in ${summary.italianAuthorizedCorrectionMatches} URL italiani e ${summary.foreignDraftCorrectionMatches} stranieri: questi ultimi restano bozze, senza approvazione linguistica dedotta dall'autorizzazione italiana.`;
  }
  await writeFile(path.join(destination, file), `# ${title}\n\n${body}\n`);
}
console.log(JSON.stringify(summary, null, 2));
