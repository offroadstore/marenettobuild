// Release 152 related-reading journey, offline and read-only.
// Same routing approach as global-seo-browser.mjs: saved HTTP HTML from the inventory,
// local production assets, public image bytes captured by prepare-audit-resources.mjs,
// synthetic editorial snapshot, enforced CSP, every external request aborted, no mutations.
// Test-only extension: the migrated series alias (not in the inventory) is answered with the
// 301 recorded by the parent HTTP audit in redirects.csv, so the browser follows it like production.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
import { setWebSecurityHeaders } from './security-policy.mjs';
import { PUBLIC_ORIGIN } from './public-release.mjs';

const repo = new URL('../../../', import.meta.url);
const directory = new URL('generated-artifacts/global-seo/after/', repo);
const outDirectory = new URL('generated-artifacts/release-152-tests/', repo);
const shotsDirectory = new URL('screenshots/', outDirectory);
const inventory = JSON.parse(await readFile(new URL('inventory.json', directory), 'utf8'));
const snapshot = JSON.parse(await readFile(new URL('generated-artifacts/indexing-recovery/candidate-active.json', repo), 'utf8'));
const resources = JSON.parse(await readFile(new URL('resources/index.json', directory), 'utf8')).results;
const root = new URL('artifacts/marenetto-build/dist/public/', repo);
const redirectsCsv = await readFile(new URL('generated-artifacts/indexing-recovery/redirects.csv', repo), 'utf8');
const redirects = new Map(redirectsCsv.split('\n').filter(Boolean).map(line => {
  const [from, to, status, location] = [...line.matchAll(/"([^"]*)"/g)].map(m => m[1]);
  return { from, to, status, location };
}).filter(r => r.status === '301').map(r => [r.from, r.location]));

const row = path => inventory.rows.find(r => r.path === path);
const key = path => path.replace(/\/+$/, '') || '/';
const mime = { html: 'text/html', js: 'text/javascript', mjs: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', woff2: 'font/woff2' };

const journeyResult = { at: new Date().toISOString(), method: 'Offline saved HTTP HTML + local production assets; external requests aborted; synthetic editorial API; enforced CSP; no mutations', externalRequests: [], cspViolations: [], pageErrors: [], consoleErrors: [], liveResponses: [], simulatedRedirects: [], viewports: {} };

const browser = await chromium.launch({ ...(existsSync('/repl/tools/bin/chromium') ? { executablePath: '/repl/tools/bin/chromium' } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function route(context, journey) {
  await context.route('**/*', async r => {
    const request = r.request(), url = new URL(request.url());
    if (url.origin !== PUBLIC_ORIGIN) {
      journey.externalRequests.push({ url: url.origin + url.pathname, resourceType: request.resourceType() });
      return r.abort();
    }
    if (!['GET', 'HEAD'].includes(request.method())) return r.fulfill({ status: 405, body: 'No mutations in audit' });
    const image = resources.find(x => x.path === url.pathname);
    if (image) return r.fulfill({ body: await readFile(new URL('resources/' + image.file, directory)), contentType: image.type });
    if (/^\/api\/(?:network-media|historical-media)\//.test(url.pathname))
      return r.fulfill({status:503,body:'Missing captured public image'});
    if (url.pathname === '/api/editorial/active') return r.fulfill({ json: snapshot });
    if (url.pathname === '/api/monitoring/public') return r.fulfill({ json: { enabled: false } });
    if (url.pathname.startsWith('/api/')) return r.fulfill({ json: { enabled: false, status: 'unavailable', reviews: [] } });
    if (!row(url.pathname) && redirects.has(url.pathname)) {
      // Chromium follows a route-fulfilled HTTP 3xx to the live origin (observed serverAddr set), so the
      // parent-recorded 301 target is reached through a local client redirect that stays inside the router.
      const location = redirects.get(url.pathname);
      journey.simulatedRedirects.push({ from: url.pathname, recordedStatus: 301, location, reproduction: 'local client redirect to the recorded target (HTTP 301 is covered by the parent HTTP audit)' });
      return r.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><meta http-equiv="refresh" content="0;url=${location.replace(/"/g, '')}"><script>location.replace(${JSON.stringify(location)})</script>` });
    }
    try {
      const entry = row(url.pathname);
      const file = entry ? new URL('html/' + createHash('sha256').update(entry.path).digest('hex') + '.html', directory) : new URL('.' + url.pathname, root);
      const ext = file.pathname.split('.').pop();
      const headers = {};
      setWebSecurityHeaders({ setHeader: (name, value) => headers[name] = value });
      headers['Content-Security-Policy'] = headers['Content-Security-Policy-Report-Only'] ?? headers['Content-Security-Policy'];
      delete headers['Content-Security-Policy-Report-Only'];
      await r.fulfill({ body: await readFile(file), contentType: mime[ext] ?? 'application/octet-stream', headers });
    } catch { await r.fulfill({ status: 404, body: 'No fixture asset' }); }
  });
}

// Read-only in-page inspection of what a reader sees on this step.
async function inspect(page, expectedPath) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll('body *')].filter(el => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && (b.right > vw + 1 || b.left < -1) && getComputedStyle(el).position !== 'fixed';
    }).slice(0, 5).map(el => (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName) + ' ' + Math.round(el.getBoundingClientRect().right));
    const visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
    const faqRe = /FAQ|domande frequenti|domande|frequently asked|häufig|fragen|preguntas|perguntas|vanlige|vanliga|ofte|często|pytania|часто|вопрос|الأسئلة|أسئلة/i;
    const aiRe = /intelligenza artificiale|\bAI\b|\bKI\b|\bIA\b|künstliche|kunstig|inteligencia|intelligence artificielle|sztuczn|искусств|الذكاء/i;
    const main = document.querySelector('main');
    const faqSections = [...document.querySelectorAll('main section, main details')].filter(s => faqRe.test(s.getAttribute('aria-label') ?? '') || faqRe.test(s.querySelector('h2,summary')?.textContent ?? ''));
    const notice = document.querySelector('#release-technical-notice') ?? document.querySelector('[data-testid="technical-notice"]');
    const footerAi = document.querySelector('.footer-ai-notice');
    const aiLinks = [...document.querySelectorAll('a[href]')].filter(a => /intelligen|artificial|ai-use|use-of-ai|uso-ai/i.test(a.getAttribute('href'))).map(a => ({ href: a.getAttribute('href'), visible: visible(a) }));
    return {
      path: location.pathname, search: location.search,
      title: document.title, h1: main?.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
      h1Count: document.querySelectorAll('main h1').length,
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
      htmlLang: document.documentElement.lang, htmlDir: document.documentElement.dir,
      alternates: [...document.querySelectorAll('link[hreflang]')].map(l => ({ hreflang: l.hreflang, href: l.href })),
      scrollWidth: document.documentElement.scrollWidth, clientWidth: vw, overflow: document.documentElement.scrollWidth > vw,
      offenders,
      faq: { sections: faqSections.length, visible: faqSections.some(visible), headings: faqSections.map(s => (s.querySelector('h2,summary')?.textContent ?? '').trim()).slice(0, 3) },
      technicalNotice: { present: !!notice, visible: visible(notice), text: (notice?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160), mentionsAI: aiRe.test(notice?.textContent ?? '') },
      aiDisclosure: { noticeMentionsAI: aiRe.test(notice?.textContent ?? ''), mainMentionsAI: aiRe.test(main?.textContent ?? ''), aiUseLinks: aiLinks.filter(l => l.visible).length, footerAiVisible: visible(footerAi) },
    };
  });
}

function judge(state, entry, expected) {
  const issues = [];
  if (!state.canonical?.startsWith(PUBLIC_ORIGIN + '/')) issues.push('canonical-not-local');
  if (entry) {
    if (state.canonical !== entry.canonical) issues.push(`canonical: ${state.canonical} != inventory ${entry.canonical}`);
    const got = state.alternates.map(a => a.hreflang + ' ' + a.href).sort().join('|');
    const want = entry.alternates.map(a => a.hreflang + ' ' + a.href).sort().join('|');
    if (got !== want) issues.push('hreflang differs from inventory');
    const h1 = entry.headings.find(h => h.level === 1)?.text;
    if (state.h1 !== h1) issues.push(`h1: ${state.h1} != ${h1}`);
  }
  if (state.path !== expected.path) issues.push(`path ${state.path} != ${expected.path}`);
  if (state.htmlLang.split('-')[0] !== expected.lang) issues.push(`html lang ${state.htmlLang} != ${expected.lang}`);
  if (state.htmlDir !== expected.dir) issues.push(`html dir ${state.htmlDir} != ${expected.dir}`);
  if (state.overflow) issues.push(`horizontal overflow ${state.scrollWidth}>${state.clientWidth}`);
  if (state.h1Count !== 1) issues.push(`h1 count ${state.h1Count}`);
  if (expected.notice && !(state.technicalNotice.present && state.technicalNotice.visible)) issues.push('technical notice not visible');
  if (expected.ai && !((state.aiDisclosure.noticeMentionsAI && state.technicalNotice.visible) || state.aiDisclosure.aiUseLinks > 0)) issues.push('AI disclosure not visible');
  if (expected.faq && !state.faq.visible) issues.push('FAQ not visible');
  return issues;
}

async function settle(page, expected) {
  try {
    await page.waitForFunction(({ heading, lang, path }) => {
      const main = document.querySelector('main');
      const text = main?.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim();
      return document.documentElement.dataset.hydrated === 'true' && !main?.querySelector('[aria-busy="true"]') && text === heading && document.documentElement.lang.split('-')[0] === lang && location.pathname === path;
    }, { heading: expected.h1, lang: expected.lang, path: expected.path }, { timeout: 8000 });
    await page.waitForTimeout(30);
    return true;
  } catch { return false; }
}

async function step(page, journey, vp, name, expected, options = {}) {
  const entry = row(expected.path);
  const settled = await settle(page, { ...expected, h1: entry?.headings.find(h => h.level === 1)?.text });
  const state = await inspect(page, expected.path);
  const issues = [];
  if (!entry) issues.push('no inventory row for ' + expected.path);
  if (!settled) issues.push('not settled');
  issues.push(...judge(state, entry, expected));
  const index = journey.viewports[vp].steps.length + 1;
  const file = `${vp}-${String(index).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: new URL(file, shotsDirectory).pathname, fullPage: true });
  journey.viewports[vp].steps.push({ index, name, file, issues, state: { url: state.path + state.search, title: state.title, h1: state.h1, canonical: state.canonical, htmlLang: state.htmlLang, htmlDir: state.htmlDir, scrollWidth: state.scrollWidth, clientWidth: state.clientWidth, faq: state.faq, technicalNotice: state.technicalNotice, aiDisclosure: state.aiDisclosure, offenders: state.offenders } });
  console.log(vp, index, name, issues.length ? 'ISSUES ' + issues.join('; ') : 'ok');
  return issues;
}

async function openLanguage(page, code) {
  const button = page.locator('.language-picker button.lang-switch');
  await button.click();
  await page.locator(`[role="menuitem"][lang="${code}"]`).click();
}

await mkdir(shotsDirectory, { recursive: true });

const viewports = {
  desktop: { viewport: { width: 1365, height: 900 } },
  mobile390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};

try {
  for (const [vp, options] of Object.entries(viewports)) {
    const journey = journeyResult.viewports[vp] = { steps: [], errors: [] };
    const context = await browser.newContext({ locale: 'it-IT', timezoneId: 'UTC', ...options });
    await route(context, journeyResult);
    await context.exposeFunction('auditCsp', violation => journeyResult.cspViolations.push({ viewport: vp, ...violation }));
    await context.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', event => window.auditCsp({ path: location.pathname, directive: event.effectiveDirective, blocked: event.blockedURI, disposition: event.disposition }));
    });
    const page = await context.newPage();
    page.on('response', async res => { if (await res.serverAddr().catch(() => null)) journeyResult.liveResponses.push({ viewport: vp, url: res.url() }); });
    page.on('pageerror', e => journeyResult.pageErrors.push({ viewport: vp, path: new URL(page.url()).pathname, message: e.message }));
    page.on('console', m => { if (m.type() === 'error') journeyResult.consoleErrors.push({ viewport: vp, path: new URL(page.url()).pathname, text: m.text().slice(0, 300) }); });

    // 1. IT Guide archive.
    await page.goto(PUBLIC_ORIGIN + '/guide', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await step(page, journeyResult, vp, 'guide-archive', { path: '/guide', lang: 'it', dir: 'ltr' });

    // 2. Casale article, reached by a link on the archive.
    const casaleLink = page.locator('main a[href="/recuperare-casale-masseria-sicilia"]').first();
    await casaleLink.scrollIntoViewIfNeeded();
    await casaleLink.click();
    await page.waitForURL(url => url.pathname === '/recuperare-casale-masseria-sicilia');
    await step(page, journeyResult, vp, 'casale-article', { path: '/recuperare-casale-masseria-sicilia', lang: 'it', dir: 'ltr', notice: true, ai: true, faq: true });

    // 3. Local pillar, reached by a link inside the article.
    const pillarLink = page.locator('main a[href="/ville-e-casali-sicilia"]').first();
    await pillarLink.scrollIntoViewIfNeeded();
    await pillarLink.click();
    await page.waitForURL(url => url.pathname === '/ville-e-casali-sicilia');
    await step(page, journeyResult, vp, 'local-pillar-it', { path: '/ville-e-casali-sicilia', lang: 'it', dir: 'ltr', ai: true, faq: true });

    // Pillars are core pages; the release technical notice belongs to editorial article bodies (commercial-release-matrix), so pillars are checked for FAQ and AI disclosure only.
    // 4. Language loop EN -> DE -> AR -> EN from the pillar, via the language picker.
    const loop = [['en', '/en/villas-and-farmhouses-sicily', 'ltr'], ['de', '/de/villen-und-landhaeuser-sizilien', 'ltr'], ['ar', '/ar/villas-and-farmhouses-sicily', 'rtl'], ['en', '/en/villas-and-farmhouses-sicily', 'ltr']];
    for (const [code, path, dir] of loop) {
      await openLanguage(page, code);
      await page.waitForURL(url => url.pathname === path);
      await step(page, journeyResult, vp, `pillar-${code}`, { path, lang: code, dir, ai: true, faq: true });
    }

    // 5. Migrated series episode via its old alias (301 recorded by the parent HTTP audit), then new canonical.
    const alias = '/costruire-cefalu-madonie/puntata-1/';
    const canonicalSeries = '/costruire-cefalu-madonie/edilizia-libera-o-permesso/';
    await page.goto(PUBLIC_ORIGIN + alias, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true', null, { timeout: 15000 }).catch(() => {});
    await step(page, journeyResult, vp, 'series-old-alias-landing', { path: canonicalSeries, lang: 'it', dir: 'ltr', notice: true, ai: true, faq: true });
    const finalSearch = new URL(page.url()).search;
    journeyResult.viewports[vp].aliasLandingSearch = finalSearch;
    await page.goto(PUBLIC_ORIGIN + canonicalSeries, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await step(page, journeyResult, vp, 'series-new-canonical', { path: canonicalSeries, lang: 'it', dir: 'ltr', notice: true, ai: true, faq: true });

    await context.close();
  }
} finally {
  await browser.close();
}

const allIssues = Object.entries(journeyResult.viewports).flatMap(([vp, j]) => j.steps.filter(s => s.issues.length).map(s => ({ viewport: vp, step: s.name, file: s.file, issues: s.issues })));
const summary = {
  steps: Object.values(journeyResult.viewports).reduce((n, j) => n + j.steps.length, 0),
  mismatches: allIssues,
  externalRequests: journeyResult.externalRequests.length,
  liveResponses: journeyResult.liveResponses.length,
  cspViolations: journeyResult.cspViolations.length,
  pageErrors: journeyResult.pageErrors.length,
  consoleErrors: journeyResult.consoleErrors.length,
  simulatedRedirects: journeyResult.simulatedRedirects,
};
journeyResult.summary = summary;
await writeFile(new URL('journey.json', outDirectory), JSON.stringify(journeyResult, null, 2));
console.log(JSON.stringify(summary, null, 2));
