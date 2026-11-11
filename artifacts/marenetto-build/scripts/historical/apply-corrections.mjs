import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '../..');
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const sha = text => createHash('sha256').update(text).digest('hex');
const proposal = await read('content/historical-corrections.proposed.json');
const claimBytes = await readFile(path.join(root, 'content/historical-confirmations.json'), 'utf8');
if (sha(claimBytes) !== proposal.sourceClaimsSHA256) throw new Error('The approved source passages have changed; do not apply by position.');
const claims = JSON.parse(claimBytes);
const translations = await read('content/historical-corrections.translations.json');
const inventory = await read('src/content/historical/index.json');
const locales = ['it', 'en', 'nl', 'pt', 'fr', 'de', 'es', 'pl', 'ru'];
if (claims.length !== 25 || proposal.replacements.length !== 25 || translations.humanReviewed !== false) throw new Error('Unexpected approval scope.');
for (const locale of locales.filter(code => code !== 'it')) {
  if (translations[locale]?.length !== 25 || translations[locale].some(text => typeof text !== 'string' || !text.trim())) throw new Error(`Incomplete draft corrections: ${locale}`);
}
const originals = Object.fromEntries(await Promise.all(locales.map(async locale => [locale, await read(`src/content/historical/${locale}.json`)])));
const browser = await chromium.launch({ executablePath: '/repl/tools/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
let result;
try {
  const page = await browser.newPage();
  result = await page.evaluate(({ inventory, originals, claims, replacements, translations, locales }) => {
    const clean = text => (text ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    const parse = html => new DOMParser().parseFromString(html, 'text/html');
    const blocks = d => [...d.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption')]
      .filter(node => !node.parentElement?.closest('li,blockquote') || node.tagName === 'LI')
      .filter(node => clean(node.textContent));
    const families = [...new Set(claims.map(claim => claim.family))];
    const catalogs = {}, changes = [], pages = {}, missingCounterparts = [];
    // The recovered buying guide is not structurally parallel across locales.
    // Null means the specific passage is absent from the recovered body, not
    // permission to replace a footer or invent a missing original paragraph.
    const buyingAnchors = {
      en: { 22: 27, 23: null }, nl: { 22: null, 23: [26, 27] },
      pt: { 22: 26, 23: 26 }, fr: { 22: 27, 23: null },
      de: { 22: 26, 23: 26 }, es: { 22: null, 23: null },
      pl: { 22: null, 23: 27 }, ru: { 22: null, 23: 26 },
    };
    for (const locale of locales) {
      catalogs[locale] = {};
      for (const family of families) {
        const source = inventory.find(row => row.locale === locale && row.family === family);
        const italian = inventory.find(row => row.locale === 'it' && row.family === family);
        if (!source || !italian || !originals[locale][source.key]) throw new Error(`Missing original ${locale}:${family}`);
        const original = originals[locale][source.key];
        const d = parse(original.html);
        const nodes = blocks(d), referenceNodes = blocks(parse(originals.it[italian.key].html));
        const italianTexts = new Set(referenceNodes.map(node => clean(node.textContent)));
        const textLength = nodes.reduce((sum, node) => sum + clean(node.textContent).length, 0);
        const italianLength = nodes.filter(node => italianTexts.has(clean(node.textContent))).reduce((sum, node) => sum + clean(node.textContent).length, 0);
        const contentLanguage = source.kind !== 'article' && italianLength / Math.max(1, textLength) > 0.6 ? 'it' : source.contentLanguage;
        const pageChanges = [];
        const textRange = (claimNumber, startMarker, endMarker) => {
          const full = d.body.textContent;
          const pattern = value => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'g');
          const starts = [...full.matchAll(pattern(startMarker))];
          if (starts.length !== 1) throw new Error(`Ambiguous plain-text anchor ${source.path} #${claimNumber}`);
          const start = starts[0].index;
          const tail = pattern(endMarker).exec(full.slice(start));
          if (!tail) throw new Error(`Missing plain-text end ${source.path} #${claimNumber}`);
          const end = start + tail.index + tail[0].length;
          const walker = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
          const textNodes = [];
          while (walker.nextNode()) textNodes.push(walker.currentNode);
          const position = (offset, ending) => {
            let consumed = 0;
            for (const node of textNodes) {
              if (offset < consumed + node.textContent.length || ending && offset === consumed + node.textContent.length) return [node, offset - consumed];
              consumed += node.textContent.length;
            }
            throw new Error('Invalid source text range');
          };
          const range = d.createRange();
          range.setStart(...position(start, false));
          range.setEnd(...position(end, true));
          const fragment = d.createElement('div');
          fragment.append(range.cloneContents());
          const beforeHTML = fragment.innerHTML, before = clean(range.toString());
          const replacement = translations[locale][claimNumber - 1];
          range.deleteContents();
          const text = d.createTextNode(replacement);
          range.insertNode(text);
          const escaped = d.createElement('div');
          escaped.append(text.cloneNode());
          changes.push({ claim: claimNumber, path: source.path, locale, before, after: replacement, beforeHTML, afterHTML: escaped.innerHTML, scope: 'Exact text range in malformed original HTML; surrounding source content retained.' });
          pageChanges.push(claimNumber);
        };
        for (let index = 0; index < claims.length; index++) {
          const claim = claims[index];
          if (claim.family !== family) continue;
          if (locale === 'de' && index === 3) {
            textRange(4, 'Kontaktieren Sie noch heute', 'absichern können.');
            continue;
          }
          if (locale !== 'it' && claim.family.startsWith('/comprare-e-ristrutturare')) {
            const ranges = {
              'en:23': ['Are you about to make an offer?', 'Contact Marenetto Build’s team'],
              'nl:22': ['Zekerheid over de uitvoerbaarheid', 'ontwerpplan.'],
              'nl:23': ['Sta je op het punt een bod uit te brengen?', 'gecertificeerde realiteit.'],
              'fr:23': ['Bientôt prêt à faire une offre', 'réalité solide et certifiée.'],
              'pl:23': ['per un sopralluogo tecnico con strumentazione avanzata.', 'realtà solida e certificata.'],
              'ru:23': ['Свяжитесь с командой Marenetto Build', 'оборудования.'],
            };
            const markers = ranges[`${locale}:${index + 1}`];
            if (markers) { textRange(index + 1, ...markers); continue; }
          }
          if (locale !== 'it' && [22, 23].includes(index + 1) && claim.family.startsWith('/comprare-e-ristrutturare')) {
            const anchor = buyingAnchors[locale][index + 1];
            if (anchor === null) {
              missingCounterparts.push({ locale, path: source.path, claim: index + 1, reason: 'The specific passage is absent from the recovered source body; no unrelated text replaced or missing original invented.' });
              continue;
            }
            if (['pt', 'de'].includes(locale)) {
              if (index === 22) continue; // Both passages are merged in the same malformed source LI.
              const node = nodes[anchor - 1];
              const before = clean(node?.textContent);
              const marker = locale === 'pt' ? 'A certeza' : 'Sicherheit';
              const offset = before.indexOf(marker);
              if (node?.tagName !== 'LI' || offset < 0) throw new Error(`Merged source anchor changed: ${source.path}`);
              const beforeHTML = node.outerHTML;
              const leading = node.textContent.match(/^\s*/)[0], trailing = node.textContent.match(/\s*$/)[0];
              node.textContent = `${leading}${before.slice(0, offset)}${translations[locale][21]} ${translations[locale][22]}${trailing}`;
              changes.push({ claim: 22, alsoClaims: [23], path: source.path, locale, before, after: clean(node.textContent), beforeHTML, afterHTML: node.outerHTML, scope: 'Two claims merged in one malformed original list item; preceding technical-risk text retained.' });
              pageChanges.push(22, 23);
              continue;
            }
          }
          const replacement = locale === 'it' || contentLanguage === 'it' ? replacements[index].replacement : translations[locale][index];
          let node;
          if (claim.block) {
            const override = locale !== 'it' && [22, 23].includes(index + 1) && claim.family.startsWith('/comprare-e-ristrutturare') ? buyingAnchors[locale][index + 1] : claim.block;
            node = nodes[(Array.isArray(override) ? override[0] : override) - 1];
            if (!node || (!Array.isArray(override) && index !== 22 && node.tagName !== referenceNodes[claim.block - 1]?.tagName)) throw new Error(`Block structure changed: ${source.path} #${index + 1}`);
            if (clean(referenceNodes[claim.block - 1].textContent) !== clean(claim.phrase)) throw new Error(`Italian source anchor changed: ${source.path} #${index + 1}`);
          } else {
            const matches = [...d.body.querySelectorAll('p,li,span,div,a')].filter(element => {
              const text = clean(element.textContent);
              return index === 23 ? text.includes('info@marenettobuild.com') : /SS\s*113/i.test(text) && /73\s*b/i.test(text);
            });
            const exact = matches.filter(element => clean(element.textContent) === clean(claim.phrase));
            node = (exact.length ? exact : matches.filter(element => element.tagName === 'P').length ? matches.filter(element => element.tagName === 'P') : matches)
              .sort((a, b) => clean(a.textContent).length - clean(b.textContent).length)[0];
            if (!node) throw new Error(`Missing contact anchor ${source.path} #${index + 1}`);
          }
          const before = clean(node.textContent);
          if (locale === 'it' && before !== clean(claim.phrase)) throw new Error(`Exact approved passage changed: ${source.path} #${index + 1}`);
          let beforeHTML = node.outerHTML;
          const leading = node.textContent.match(/^\s*/)[0], trailing = node.textContent.match(/\s*$/)[0];
          node.textContent = `${leading}${replacement}${trailing}`;
          if (index === 23) {
            if (node.tagName === 'A') node.setAttribute('href', 'mailto:info@marenetto.com');
            else {
              node.textContent = leading + replacement.slice(0, replacement.indexOf('info@marenetto.com'));
              const link = d.createElement('a');
              link.href = 'mailto:info@marenetto.com';
              link.textContent = 'info@marenetto.com';
              node.append(link);
              node.append(d.createTextNode(trailing));
            }
          }
          const change = { claim: index + 1, path: source.path, locale, before, after: clean(node.textContent), beforeHTML, afterHTML: node.outerHTML };
          changes.push(change);
          pageChanges.push(index + 1);
        }
        const contactLinks = [];
        for (const anchor of d.body.querySelectorAll('a[href]')) {
          if (/^mailto:info@marenettobuild\.com(?:\?|$)/i.test(anchor.getAttribute('href'))) {
            contactLinks.push(anchor.getAttribute('href'));
            anchor.setAttribute('href', anchor.getAttribute('href').replace('info@marenettobuild.com', 'info@marenetto.com'));
          }
        }
        catalogs[locale][source.key] = { ...original, html: d.body.innerHTML };
        pages[source.key] = {
          path: source.path, locale, contentLanguage, sourceSHA256: source.sourceSHA256, claims: pageChanges,
          authorization: locale === 'it' ? 'Owner authorized the 25 proposed Italian substitutions for preview' : 'Draft equivalent of owner-authorized Italian substitutions; linguistic review pending',
          linguisticReview: locale === 'it' ? 'owner-authorized wording; not professional sign-off' : 'pending',
          publicationApproved: false, contactLinksUpdated: contactLinks.length,
        };
      }
    }
    return { catalogs, changes, pages, missingCounterparts };
  }, { inventory, originals, claims, replacements: proposal.replacements, translations, locales });
} finally { await browser.close(); }
const covered = result.changes.reduce((sum, change) => sum + 1 + (change.alsoClaims?.length ?? 0), 0);
if (covered + result.missingCounterparts.length !== 225 || Object.keys(result.pages).length !== 72) throw new Error('Incomplete correction accounting.');
const destination = path.join(root, 'src/content/historical-editorial');
await mkdir(destination, { recursive: true });
for (const [locale, documents] of Object.entries(result.catalogs)) {
  for (const [key, document] of Object.entries(documents)) {
    result.pages[key].originalHTMLSHA256 = sha(originals[locale][key].html);
    result.pages[key].correctedHTMLSHA256 = sha(document.html);
  }
  await writeFile(path.join(destination, `${locale}.json`), JSON.stringify(documents));
}
const manifest = {
  sourceClaimsSHA256: proposal.sourceClaimsSHA256,
  authorization: 'Owner selected “Applica le correzioni proposte”. Preview only; originals and historical URLs retained.',
  publicationApproved: false, pages: result.pages, missingCounterparts: result.missingCounterparts,
};
await writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2));
const evidence = path.resolve(root, '../../generated-artifacts/editorial-corrections');
await mkdir(evidence, { recursive: true });
await writeFile(path.join(evidence, 'applied-changes.json'), JSON.stringify({ ...manifest, changes: result.changes }, null, 2));
await writeFile(path.join(root, 'content/historical-corrections.applied.json'), JSON.stringify({ ...manifest, changes: result.changes }, null, 2));
console.log(JSON.stringify({ substitutions: result.changes.length, claimEditionsCorrected: covered, missingCounterparts: result.missingCounterparts.length, pages: Object.keys(result.pages).length, locales, publicationApproved: false, originalsModified: false }));
