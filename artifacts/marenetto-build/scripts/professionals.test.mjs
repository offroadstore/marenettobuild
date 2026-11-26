import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { proItEn } from '../src/content/professionals/copy-it-en.ts';
import { proFrDe } from '../src/content/professionals/copy-fr-de.ts';
import { proNlEs } from '../src/content/professionals/copy-nl-es.ts';
import { proPtPl } from '../src/content/professionals/copy-pt-pl.ts';
import { proRuSv } from '../src/content/professionals/copy-ru-sv.ts';
import { proNoDa } from '../src/content/professionals/copy-no-da.ts';
import { proAr } from '../src/content/professionals/copy-ar.ts';

const copy = { ...proItEn, ...proFrDe, ...proNlEs, ...proPtPl, ...proRuSv, ...proNoDa, ...proAr };
const locales = ['it', 'en', 'fr', 'de', 'nl', 'es', 'pt', 'pl', 'ru', 'sv', 'no', 'da', 'ar'];
const len = s => [...s].length;
const path = l => `${l === 'it' ? '' : `/${l}`}/${copy[l].slug}`;

test('thirteen editions, SEO lengths, unique metadata and paths', () => {
  assert.deepEqual(Object.keys(copy).sort(), [...locales].sort());
  assert.equal(path('it'), '/professionisti');
  const seen = new Set();
  for (const l of locales) {
    const c = copy[l];
    assert.ok(len(c.title) >= 50 && len(c.title) <= 60, `${l} title ${len(c.title)}`);
    assert.ok(len(c.description) >= 140 && len(c.description) <= 160, `${l} description ${len(c.description)}`);
    assert.ok(c.title.endsWith('| Marenetto Build')); assert.ok(c.dlTitle.endsWith('| Marenetto Build'));
    for (const v of [c.title, c.description, path(l), c.dlTitle]) { assert.ok(!seen.has(v), `${l} duplicate ${v}`); seen.add(v); }
    assert.match(c.slug, /^[a-z0-9-]+$/); assert.match(c.dlSlug, /^[a-z0-9-]+$/);
  }
});

test('mandatory structure: five steps, four materials, six download categories, four FAQ', () => {
  for (const l of locales) {
    const c = copy[l];
    assert.equal(c.steps.length, 5, l); assert.equal(c.materials.length, 4, l); assert.equal(c.dl.length, 6, l); assert.equal(c.faq.length, 4, l);
    assert.equal(c.fields.length, 5, l); assert.equal(c.traceFields.length, 3, l); assert.equal(c.program.length, 4, l);
    for (const n of ['EN 13755', 'EN 14231', 'EN 12372', 'EN 14157', 'EN 12371']) assert.ok(c.dl[0][1].includes(n), `${l} ${n}`);
    assert.ok(['DWG', 'Revit', 'SketchUp'].every(x => c.dl[1][0].includes(x)), l);
    // majolica limited to vertical/sheltered outdoor; missing data never invented
    assert.ok(c.materials[2].values[0]); assert.ok(c.materials.every(m => m.values.slice(1).every(v => v === null)), l);
    assert.match(c.scopeNote, /60/); assert.match(c.response, /24/); assert.match(c.form.receiptNote, /24/);
    assert.ok(c.contactPending.length > 3);
  }
});

test('Italian owner sentences preserved verbatim', () => {
  const it = copy.it;
  assert.equal(it.codeSentence, 'Nessun compenso nascosto: i vantaggi sono in fattura allo studio, in linea con i codici professionali.');
  assert.equal(it.programFormula, 'Condizioni dedicate agli studi professionali, comunicate su richiesta.');
  assert.equal(it.standSentence, 'Invece di uno stand, vi portiamo in cava: visite su appuntamento a Cefalù o selezione del blocco in video, ovunque voi siate.');
  assert.equal(it.contactPending, 'nome da confermare'); assert.equal(it.comingSoon, 'File in arrivo'); assert.equal(it.pending, 'Dati in verifica');
  assert.equal(it.ctaSamples, 'Richiedi campioni'); assert.equal(it.ctaBlock, 'Prenota una selezione del blocco');
});

test('no prices, percentages, invented payers, fairs, emojis or fake files', () => {
  for (const l of locales) {
    const s = JSON.stringify(copy[l]);
    assert.doesNotMatch(s, /[€$£]|\d+\s?%/, l);
    assert.doesNotMatch(s, /\p{Extended_Pictographic}/u, l);
    assert.doesNotMatch(s, /\.(pdf|dwg|rvt|skp)\b|href|https?:/i, l);
    assert.doesNotMatch(s, /Salone|Cersaie|Milan Design|Fuorisalone|Marmomac/i, l);
    assert.doesNotMatch(s, /Vesuvi|Ranieri/i, l);
    assert.ok(copy[l].codeCaveat.length > 120, `${l} caveat`);
  }
});

test('wiring: routes, inventory, sitemap exclusion, structured data, llms', async () => {
  const [app, inv, sd, llms, cra] = await Promise.all(['src/App.tsx', 'src/localization/edition-inventory.ts', 'src/lib/structured-data.ts', 'scripts/llms-document.mjs', 'src/components/CallRequestAccess.tsx'].map(f => readFile(new URL(`../${f}`, import.meta.url), 'utf8')));
  assert.match(app, /professionalPageByPath/); assert.match(app, /link-footer-professionals/);
  // The strategic menu intentionally contains only four areas and About.
  // The thirteen home entries and withdrawal fallback are exercised by four-areas.test.
  assert.doesNotMatch(app, /data-testid="(?:mobile-)?nav-professionals"/);
  assert.match(inv, /PROFESSIONAL_DOWNLOAD_PAGES[\s\S]*state: 'draft', approval: null[\s\S]*sitemap: false/);
  assert.match(inv, /edition\.id === 'professional-downloads'\) continue/);
  assert.match(inv, /indexing: 'never'/);
  const page = await readFile(new URL('../src/pages/professionals.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /aria-label="Breadcrumb"/, 'Accessible breadcrumb names must use the localized copy');
  assert.match(sd, /'FAQPage'/); assert.match(sd, /BusinessAudience/);
  assert.match(llms, /'professionals'/); assert.match(llms, /professional-downloads/);
  assert.match(cra, /professional_studio/); assert.match(cra, /intents/);
});

test('dialog controls remain pointer-accessible and contained in RTL; floating controls avoid definition text', async () => {
  const [css, cra, app, whatsapp] = await Promise.all(['src/styles/call-request.css', 'src/components/CallRequestAccess.tsx', 'src/App.tsx', 'src/components/WhatsAppAccess.tsx'].map(f => readFile(new URL(`../${f}`, import.meta.url), 'utf8')));
  assert.match(css, /\.cr-form \.radio-choice input \{[^}]*position:static;[^}]*pointer-events:auto/);
  assert.match(css, /\.cr-honeypot \{[^}]*clip-path:inset\(50%\)/);
  assert.doesNotMatch(css, /left:-9999px/);
  assert.match(cra, /main dt, main dd, main figcaption, main summary/);
  assert.match(whatsapp, /\.footer-bottom,/, 'The floating WhatsApp control also avoids the copyright line');
  assert.match(app, /MobileContactBar hidden=\{[^}]*editionId === 'professionals'[^}]*editionId === 'professional-downloads'/);
});
