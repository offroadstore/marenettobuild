import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {publicEditions} from './public-release.mjs';
process.env.NODE_ENV='production';
const vite=await createServer({configFile:new URL('../vite.config.ts',import.meta.url).pathname,optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom'});
after(()=>vite.close());
const escaped=text=>text.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('all 39 owner-authorized notices render in their own language with accurate contact and retention',async()=>{
  const {noticeCopy,legalPath,HUMAN_REVIEW_APPROVED}=await vite.ssrLoadModule('/src/content/legal-notices.ts');
  const {COMPANY_CONTACT}=await vite.ssrLoadModule('/src/config/contact.ts');
  const {callCopy}=await vite.ssrLoadModule('/src/content/call-request-copy.ts');
  assert.equal(COMPANY_CONTACT.verification.legalIdentity,'owner-confirmed-2026-11-23');
  assert.equal(COMPANY_CONTACT.verification.vatId,'owner-confirmed-2026-11-23');
  assert.equal(COMPANY_CONTACT.verification.address,'owner-confirmed-2026-11-23');
  const {render,editions}=await vite.ssrLoadModule('/src/entry-server.tsx');
  assert.equal(HUMAN_REVIEW_APPROVED,false);
  for(const [locale,c] of Object.entries(noticeCopy)) for(const kind of ['privacy','cookies','ai']) {
    const path=legalPath(locale,kind);
    const {body}=await render(path,locale);
    assert.equal((body.match(/<h1\b/g)||[]).length,1,path);
    assert.ok(body.includes(escaped(c[kind])),path);
    assert.ok(body.includes('info@marenetto.com'),path);
    assert.ok(body.includes('legal-candidate-status'),path);
    for(const p of c[kind==='privacy'?'privacyText':kind==='cookies'?'cookieText':'aiText']) assert.ok(body.includes(escaped(p)),`${path}: full text`);
    if(kind==='privacy') {
      assert.ok(c.privacyText[0].includes('2026-11-23'),locale);
      for(const paragraph of callCopy[locale].privacy) assert.ok(body.includes(escaped(paragraph)),`${path}: callback processing`);
      assert.ok(body.includes(COMPANY_CONTACT.vatId),path);
    }
    assert.ok(!body.includes('info@marenettobuild.com'),path);
    const edition=editions.find(e=>e.path===path);
    assert.match(edition.approval,locale==='ar'?/Owner instruction to publish Arabic/:/Owner authorization: index all public pages/);
    assert.equal(edition.sitemap,true);
    if(kind==='privacy') assert.ok(c.privacyText.some(p=>p.includes('12')),locale);
  }
  const manifest={editions:Object.fromEntries(editions.map(e=>[e.path,e])),pages:Object.fromEntries(editions.map(e=>[e.path,'test.html']))};
  assert.equal(publicEditions(manifest).filter(e=>e.source.startsWith('phase4:')).length,39,'owner-authorized notices are public');
});
test('per-image labels are removed; the footer AI note and AI page link remain',async()=>{
  const {render}=await vite.ssrLoadModule('/src/entry-server.tsx');
  const {noticeCopy,legalPath}=await vite.ssrLoadModule('/src/content/legal-notices.ts');
  const {imageClassification,discloseHTMLImages}=await vite.ssrLoadModule('/src/config/image-provenance.ts');
  assert.equal(imageClassification('/media/home/cefalu-hero-left-1672.jpg'),'ai-edited');
  assert.equal(imageClassification('/media/home/construction-960.webp'),'uncertain');
  const plain='<img src="/media/example.webp">';
  assert.equal(discloseHTMLImages(plain,'fr'),plain,'no per-image label');
  for(const locale of Object.keys(noticeCopy)) {
    const {body}=await render(locale==='it'?'/':`/${locale}/`,locale);
    assert.ok(!body.includes('data-image-disclosure'),locale);
    assert.ok(body.includes('footer-legal-links'),locale);
    const note=body.match(/<p\b[^>]*data-testid="illustration-note"[\s\S]*?<\/p>/)?.[0];
    assert.ok(note?.includes(`href="${legalPath(locale,'ai')}"`),`${locale}: AI link belongs to the disclosure note`);
  }
});
test('form uses an unchecked read acknowledgement, full policy link and no marketing consent',async()=>{
  const {render}=await vite.ssrLoadModule('/src/entry-server.tsx');
  const {noticeCopy,legalPath}=await vite.ssrLoadModule('/src/content/legal-notices.ts');
  const {requestPath}=await vite.ssrLoadModule('/src/content/service-offers.ts');
  for(const locale of Object.keys(noticeCopy)) {
    const {body}=await render(requestPath(locale),locale);
    assert.ok(body.includes(escaped(noticeCopy[locale].read)),locale);
    assert.ok(body.includes(legalPath(locale,'privacy')),locale);
    const input=body.match(/<input\b[^>]*data-testid="check-privacy"[^>]*>/)?.[0];
    assert.ok(input,locale); assert.ok(!input.includes('checked=""'),locale);
    assert.ok(body.includes('bespoke-furniture'),locale);
  }
  const app = await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
  assert.match(app, /<a href=\{legalPath\(lang, 'privacy'\)\} target="_blank"/, 'Use a native anchor: wouter Link intercepts plain clicks even with target=_blank');
  assert.ok(!app.includes('open-cookie-preferences'), 'Footer must use the current shared preference event, not the retired controller');
  assert.match(app, /<CookiePreferencesLink lang=\{lang\}/);
  const panel = await readFile(new URL('../src/components/AnalyticsPreferences.tsx',import.meta.url),'utf8');
  assert.ok(panel.includes('data-testid="cookie-close"'), 'Inactive preview preferences can also be closed without a keyboard');
});
test('preferences eligibility is independent of measurement across all public service and legal editions',async()=>{
  const {editions}=await vite.ssrLoadModule('/src/entry-server.tsx');
  const preferenceEditions=editions.filter(e=>e.state==='published'||e.state==='reviewed');
  for(const locale of ['it','en','de','fr','es','nl','pt','pl','ru','sv','no','da']) {
    assert.ok(preferenceEditions.some(e=>e.locale===locale&&e.source.startsWith('phase4:')),locale);
    assert.ok(preferenceEditions.some(e=>e.locale===locale&&e.source.startsWith('phase3:')),locale);
  }
  const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
  assert.match(app,/preferenceEditions=\{cookiePreferenceEditions\}/);
  assert.match(app,/analyticsPublicEditions = cookiePreferenceEditions\.filter/);
  const controls=await readFile(new URL('../src/components/AnalyticsPreferences.tsx',import.meta.url),'utf8');
  assert.match(controls,/!excludedPath\(path\).*safePath\(path, preferencePaths\)/);
  assert.match(controls,/if \(!allowed \|\| !text \|\| isPreviewOrigin/,'unmeasured routes must not fetch or enable monitoring');
});
test('owner can export only the selected callback without persisting or mutating it',async()=>{
  const {callRequestExport}=await vite.ssrLoadModule('/src/lib/call-request-export.ts');
  const record=Object.freeze({id:7,code:'EXAMPLE/7',data:Object.freeze({firstName:'Synthetic',email:'export@example.invalid',marketingAccepted:false}),notes:'Synthetic "notes"\nwith Unicode: Cefalù',privacyVersion:'call-2026-11-25'});
  const file=callRequestExport(record), parsed=JSON.parse(file.text);
  assert.equal(file.filename,'call-request-EXAMPLE_7.json');
  assert.deepEqual(parsed.request,record);
  assert.ok(Number.isFinite(Date.parse(parsed.exportedAt)));
  assert.equal(parsed.request.data.marketingAccepted,false);
  assert.equal(parsed.request.notes,record.notes);
  assert.equal(Object.keys(parsed).sort().join(','),'exportedAt,request');
  const panel=await readFile(new URL('../src/pages/call-requests-panel.tsx',import.meta.url),'utf8');
  assert.match(panel,/onClick=\{exportOne\} data-testid=\{`button-call-export-/);
  assert.ok(!panel.includes('after 24 months'));
});
test('public font styles have no third-party calls and provenance labels remain legible',async()=>{
  for(const file of ['src/index.css','src/styles/brand.css','src/styles/fonts.css']) {
    const text=await readFile(new URL('../'+file,import.meta.url),'utf8');
    assert.ok(!text.includes('fonts.googleapis.com'),file);assert.ok(!text.includes('fonts.gstatic.com'),file);
  }
  const css=await readFile(new URL('../src/index.css',import.meta.url),'utf8');
  assert.ok(css.includes('.image-disclosure--hero'));
});
