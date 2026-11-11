import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '../..');
const evidence = path.resolve(root, '../../generated-artifacts/historical-fidelity');
const comparison = JSON.parse(await readFile(path.join(evidence, 'comparison.json'), 'utf8'));
const acquisition = JSON.parse(await readFile(path.join(evidence, 'acquisition.json'), 'utf8'));
const destination = path.join(root, 'src/content/historical');
const currentPages = JSON.parse(await readFile(path.join(root, 'src/localization/public-pages.json'), 'utf8'));
const normalize = pathname => pathname.replace(/\/+$/, '') || '/';
const sha = value => createHash('sha256').update(value).digest('hex');
const rules = [
  ['garanzia-10-anni', [3, 6, 18, 29], 'Confermare disponibilità della polizza, soggetto assicurato, condizioni, esclusioni e limiti. Le promesse di intervento/pagamento senza esborso non sono provate dal solo testo storico.'],
  ['ristrutturare-senza-demolire', [4, 16], 'Confermare partnership e certificazione Isoplam in corso di validità, con relativo attestato; verificare la promessa di assenza di crepe/distacchi.'],
  ['pavimenti-esterni-isoplam', [3], 'Confermare la qualifica aziendale di applicatore certificato Isoplam con attestato.'],
  ['pavimenti-esterni-isoplam', [11], 'Occorrono scheda e prova di classificazione antiscivolo del sistema specifico per attribuire R11/R12/R13; non basta il nome commerciale della famiglia.'],
  ['ricerca-infiltrazioni', [6, 8, 10, 12, 23], 'Confermare disponibilità effettiva degli strumenti e dei tecnici e, dove dichiarata, la taratura. Il sito storico non è prova di attrezzatura o qualifica attuale.'],
  ['ricerca-infiltrazioni', [18], 'Specificare chi rilascia la relazione tecnica, con quale abilitazione e che cosa significa «certificata»; il rimborso dipende anche dalla polizza del cliente.'],
  ['ricerca-infiltrazioni', [22], 'Confermare condizioni e limiti della promessa temporale «Diagnosi completa in poche ore».'],
  ['chi-siamo', [11], 'Confermare se la consegna nei tempi è una garanzia contrattuale, con condizioni e limiti; non dedurla dalla formula promozionale.'],
  ['ristrutturazioni-chiavi-in-mano', [13, 24], 'Confermare esistenza del team tecnico interno e professionisti abilitati incaricati delle pratiche CILA/SCIA.'],
  ['ristrutturazioni-chiavi-in-mano', [23], 'Confermare servizio di reperibilità/pronto intervento, area coperta, orari e condizioni.'],
  ['comprare-e-ristrutturare', [11], 'Richiede verifica tecnica: una termocamera non dimostra da sola le criticità strutturali di un edificio. Non correggere il passaggio senza decisione.'],
  ['comprare-e-ristrutturare', [13], 'Richiede verifica tecnica della relazione indicata tra salsedine/corrosione dei ferri e carbonatazione; non trattare processi diversi come sinonimi.'],
  ['comprare-e-ristrutturare', [27, 28], 'Confermare contenuto e responsabilità della consulenza: «certezza della fattibilità» e «realtà ... certificata» non identificano verifiche, professionista o certificazione.'],
];
const claims = [];
const heldFamilies = new Set();
for (const [prefix, numbers, reason] of rules) {
  const source = comparison.rows.find(row => row.locale === 'it' && new URL(row.url).pathname.split('/')[1].startsWith(prefix) && row.published);
  if (!source) throw new Error(`Missing source for confirmation rule: ${prefix}`);
  const family = normalize(new URL(source.url).pathname);
  heldFamilies.add(family);
  for (const number of numbers) {
    const block = source.original.document.blocks[number - 1];
    if (!block) throw new Error(`Missing exact block ${number}: ${source.url}`);
    claims.push({ family, article: source.original.document.h1[0], url: source.url, phrase: block.text, reason, block: number, sourceFile: source.original.hops.at(-1).file, sourceSHA256: source.original.hops.at(-1).sha256 });
  }
}
const contact = comparison.rows.find(row => row.url === 'https://www.marenettobuild.com/contatti/');
for (const phrase of ['Email: info@marenettobuild.com', 'Indirizzo: SS 113 Settentrionale Sicula, 73b, 90015 Cefalù PA, Italia']) {
  if (!contact.original.document.body.includes(phrase)) throw new Error('Contact original changed');
  claims.push({ family: '/contatti', article: 'Contatti', url: contact.url, phrase, reason: phrase.startsWith('Email') ? 'Discorda con info@marenetto.com confermato dal titolare: decidere esplicitamente il trattamento del recapito storico, senza sostituirlo in silenzio.' : 'Indirizzo fisico preciso non confermato dal titolare; serve conferma della sede pubblicabile.', sourceFile: contact.original.hops.at(-1).file, sourceSHA256: contact.original.hops.at(-1).sha256 });
}
heldFamilies.add('/contatti');
// Feed aliases without a slash must not overwrite the canonical sitemap family.
const inventory = new Map();
for (const item of acquisition.inventory) {
  const key = normalize(new URL(item.url).pathname);
  if (!inventory.has(key) || item.discoveries.some(discovery => discovery.startsWith('sitemap-'))) inventory.set(key, item);
}
const browser = await chromium.launch({ executablePath: '/repl/tools/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const parser = await browser.newPage();
const index = [];
const documents = {};
const seen = new Set();
await mkdir(destination, { recursive: true });
try {
  for (const row of comparison.rows.filter(row => row.published)) {
    const pathname = normalize(new URL(row.url).pathname);
    if (seen.has(pathname)) continue;
    seen.add(pathname);
    const item = inventory.get(pathname);
    const family = normalize(new URL(item?.family || row.original.document.canonical || row.url).pathname);
    const locale = row.locale;
    const held = heldFamilies.has(family) || heldFamilies.has(pathname);
    const hop = row.original.hops.at(-1);
    const bytes = await readFile(path.join(evidence, hop.file));
    if (sha(bytes) !== hop.sha256) throw new Error(`Source integrity failure: ${hop.file}`);
    const parsed = await parser.evaluate(({ html, url, article, locale, requestPath }) => {
      const d = new DOMParser().parseFromString(html, 'text/html');
      const main = d.querySelector('#main-content') ?? d.body;
      const content = article ? main.querySelector('.ms-block-content.articolo') ?? main : main;
      const clean = text => (text ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      const textCopy = content.cloneNode(true);
      textCopy.querySelectorAll('script,style,noscript,template').forEach(node => node.remove());
      const bodyText = clean(textCopy.textContent);
      const title = clean(main.querySelector('h1')?.textContent);
      const description = d.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
      const publishedOn = d.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ?? d.querySelector('time')?.getAttribute('datetime') ?? null;
      const dateLabel = clean(main.querySelector('time,[class*="post-date"],[class*="publish-date"]')?.textContent) || null;
      const hero = main.querySelector('img');
      const image = hero?.getAttribute('data-src') || hero?.getAttribute('src') || null;
      const imageAlt = hero?.getAttribute('alt') ?? '';
      const imageCaption = clean(hero?.closest('figure')?.querySelector('figcaption')?.textContent) || null;
      const clone = content.cloneNode(true);
      clone.querySelectorAll('script,style,noscript,template,link,meta').forEach(node => node.remove());
      clone.querySelectorAll('iframe,object,embed,svg').forEach(node => node.replaceWith(d.createTextNode(node.textContent ?? '')));
      const allowed = new Set(['DIV','SECTION','ARTICLE','H1','H2','H3','H4','H5','H6','P','SPAN','STRONG','B','I','EM','U','SMALL','A','UL','OL','LI','BLOCKQUOTE','FIGURE','FIGCAPTION','IMG','PICTURE','SOURCE','BR','HR','TABLE','THEAD','TBODY','TR','TD','TH','LABEL','SUP','SUB','DETAILS','SUMMARY']);
      const absolute = value => { try { const u = new URL(value, url); return /^(https?:|mailto:|tel:)$/.test(u.protocol) ? u : null; } catch { return null; } };
      for (const node of [...clone.querySelectorAll('*')].reverse()) {
        if (!allowed.has(node.tagName)) {
          if (node.tagName === 'BUTTON' && node.closest('form')) {
            const link = d.createElement('a'); link.href = requestPath; link.append(...node.childNodes); node.replaceWith(link);
          } else if (['INPUT','TEXTAREA','SELECT'].includes(node.tagName)) node.replaceWith(d.createTextNode(node.textContent ?? ''));
          else node.replaceWith(...node.childNodes);
          continue;
        }
        const href = node.getAttribute('href') || (node.tagName === 'A' && node.closest('form') ? requestPath : null);
        const src = node.getAttribute('data-src') || node.getAttribute('src');
        const srcset = node.getAttribute('data-srcset') || node.getAttribute('srcset');
        const alt = node.getAttribute('alt');
        const oldClass = node.getAttribute('class') ?? '';
        const backgrounds = [...(node.getAttribute('style') ?? '').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map(match => absolute(match[1])).filter(u => u?.protocol.startsWith('http'));
        for (const attr of [...node.attributes]) node.removeAttribute(attr.name);
        if (href) {
          const u = absolute(href);
          if (u) node.setAttribute('href', /^(www\.)?marenettobuild\.com$/.test(u.hostname) ? `${u.pathname}${u.search}${u.hash}` : u.href);
        }
        if (src && ['IMG','SOURCE'].includes(node.tagName)) {
          const u = absolute(src); if (u?.protocol.startsWith('http')) node.setAttribute('src', u.href);
          if (srcset && !/javascript:|data:/i.test(srcset)) node.setAttribute('srcset', srcset.split(',').map(candidate => {
            const [source, ...descriptor] = candidate.trim().split(/\s+/);
            const u = absolute(source);
            return u?.protocol.startsWith('http') ? [u.href, ...descriptor].join(' ') : '';
          }).filter(Boolean).join(', '));
          if (alt !== null) node.setAttribute('alt', alt);
          if (node.tagName === 'IMG') node.setAttribute('loading', 'lazy');
        }
        if (/\b(?:ms-)?row\b/.test(oldClass)) node.setAttribute('class', 'historical-row');
        for (const background of backgrounds) { const image = d.createElement('img'); image.setAttribute('src', background.href); image.setAttribute('alt', ''); image.setAttribute('loading', 'lazy'); node.prepend(image); }
      }
      // No text is rewritten. Old POST handlers, scripts and executable attributes
      // never enter the application. Original form labels remain in the archive.
      const sanitizedText = clean(clone.textContent);
      const headings = [...clone.querySelectorAll('h1')];
      for (const [position, heading] of headings.entries()) {
        if (!article && position === 0) continue;
        const replacement = d.createElement('h2');
        replacement.append(...heading.childNodes);
        heading.replaceWith(replacement);
      }
      return { html: clone.innerHTML, bodyText, sanitizedText, title, description, publishedOn, dateLabel, image: image ? new URL(image, url).href : null, imageAlt, imageCaption, locale };
    }, { html: bytes.toString('utf8'), url: row.url, article: row.type === 'article', locale, requestPath: currentPages[locale]?.request?.path ?? '/richiedi' });
    const contentLanguage = locale !== 'it' && comparison.rows.some(other => other.locale === 'it' && other.published && other.original.document.body === row.original.document.body) ? 'it' : locale;
    const state = !parsed.title ? 'technical-source' : held ? 'awaiting-confirmation' : parsed.bodyText !== parsed.sanitizedText ? 'needs-extraction' : 'restored';
    const metadata = {
      path: pathname === '/' ? '/' : `${pathname}/`, key: pathname, family, locale, contentLanguage,
      id: `historical:${family}`, title: row.original.document.title, h1: parsed.title, description: parsed.description,
      kind: row.type === 'article' ? 'article' : /\/(?:articoli|tag)\b/.test(pathname) ? 'archive' : 'core',
      source: row.url, sourceSHA256: hop.sha256, bodySHA256: sha(row.original.document.body),
      acquiredAt: hop.acquiredAt ?? acquisition.acquiredAt, state,
      blockedBy: state === 'awaiting-confirmation' ? claims.filter(claim => claim.family === family || claim.family === pathname).map(claim => claim.phrase) : [],
      structuralAdjustment: 'One document H1; subordinate original H1 elements become H2 without changing any words. Scripts and old form POST handlers are not executed.',
    };
    index.push(metadata);
    // Keep complete originals in locale corpora, including held pages. Runtime
    // exposes only state=restored; a claim is never deleted from an original.
    (documents[locale] ??= {})[pathname] = { ...parsed, bodyText: undefined, sanitizedText: undefined };
  }
const feeds = {};
const heldFeeds = {};
await mkdir(path.join(root, 'public/historical-feeds'), { recursive: true });
await mkdir(path.join(root, 'content/historical-feeds'), { recursive: true });
for (const row of comparison.rows.filter(row => row.original?.feed)) {
  const hop = row.original.hops.at(-1);
  const bytes = await readFile(path.join(evidence, hop.file));
  if (sha(bytes) !== hop.sha256) throw new Error(`Feed integrity failure: ${row.url}`);
  const file = `historical-feeds/${row.locale}.xml`;
  await writeFile(path.join(root, 'content', file), bytes);
  const containsHeldArticle = row.original.feed.items.some(item => {
    const itemPath = normalize(new URL(item.link, row.url).pathname);
    const family = inventory.get(itemPath)?.family;
    return heldFamilies.has(itemPath) || (family && heldFamilies.has(normalize(new URL(family).pathname)));
  });
  if (containsHeldArticle) heldFeeds[normalize(new URL(row.url).pathname)] = { reason: 'Contains original articles awaiting specific confirmations; no partial rewriting of the feed.', source: row.url, sourceSHA256: hop.sha256 };
  else { await writeFile(path.join(root, 'public', file), bytes); feeds[normalize(new URL(row.url).pathname)] = file; }
}
await writeFile(path.join(destination, 'feeds.json'), JSON.stringify(feeds, null, 2));
await writeFile(path.join(destination, 'held-feeds.json'), JSON.stringify(heldFeeds, null, 2));
} finally { await browser.close(); }
for (const [locale, docs] of Object.entries(documents)) await writeFile(path.join(destination, `${locale}.json`), JSON.stringify(docs));
await writeFile(path.join(destination, 'index.json'), JSON.stringify(index, null, 2));
await writeFile(path.join(root, 'content/historical-confirmations.json'), JSON.stringify(claims, null, 2));
await writeFile(path.join(evidence, 'restoration-inventory.json'), JSON.stringify({ states: Object.fromEntries([...new Set(index.map(row => row.state))].map(state => [state, index.filter(row => row.state === state).length])), rows: index, missingSources: comparison.rows.filter(row => row.original?.status !== 200).map(row => ({ url: row.url, originalStatus: row.original?.status, needed: 'Public original HTML, cached copy or Framework360 published-content export in JSON/XML/CSV with full body and original URL. No inference of nonexistence.' })) }, null, 2));
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const report = `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Affermazioni specifiche da confermare</title><style>body{max-width:960px;margin:40px auto;padding:20px;font:16px/1.6 system-ui;color:#183743}section{border-top:1px solid #ccc;padding:18px 0}blockquote{padding:12px;background:#f5f2eb}code{overflow-wrap:anywhere}</style><h1>Affermazioni specifiche da confermare</h1><p>Gli altri contenuti accessibili vengono migrati. Nessuna frase qui sotto è stata corretta, riassunta o esposta come citazione storica sul sito. Le pagine che la contengono restano in attesa, con originale integrale conservato. Nessuna approvazione automatica.</p>${claims.map(claim => `<section><h2>${escape(claim.article)}</h2><a href="${escape(claim.url)}">${escape(claim.url)}</a><blockquote>${escape(claim.phrase)}</blockquote><p><b>Motivo:</b> ${escape(claim.reason)}</p><small>Fonte: <code>${escape(claim.sourceFile)}</code> · SHA-256 <code>${escape(claim.sourceSHA256)}</code></small></section>`).join('')}</html>`;
await writeFile(path.join(evidence, 'Conferme-specifiche-prima-del-ripristino.html'), report);
console.log(JSON.stringify({ confirmations: claims.length, states: Object.fromEntries([...new Set(index.map(row => row.state))].map(state => [state, index.filter(row => row.state === state).length])) }));
