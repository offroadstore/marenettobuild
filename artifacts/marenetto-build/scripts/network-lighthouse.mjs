/**
 * One declared browser-audit pass, not a certification of all 144 URLs.
 * Run against the managed development preview, never production.
 */
import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const origin = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : undefined;
if (!origin) throw new Error('Development preview domain is required; never fall back to a production host.');
const output = path.resolve(import.meta.dirname, '../../../generated-artifacts/network/lighthouse');
await mkdir(output, { recursive: true });
const italian = ['network', 'design', 'systems', 'comfort', 'roofs', 'ground', 'outdoors', 'glazing', 'craft', 'stone', 'bespoke', 'buying'];
const targets = [
  ...italian.map(id => ({ locale: 'it', id, path: `/__network-review/it/${id}` })),
  ...['it', 'en', 'de', 'nl', 'fr'].map(locale => ({ locale, id: 'services', path: `/__network-services-review/${locale}` })),
  ...['en', 'de', 'nl', 'fr'].flatMap(locale => ['network', 'comfort'].map(id => ({ locale, id, path: `/__network-review/${locale}/${id}` }))),
];
const executablePath = execFileSync('which', ['chromium'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ executablePath, headless: true, args: ['--remote-debugging-port=9224', '--no-sandbox'] });
const results = [];
try {
  for (const target of targets) {
    const url = origin + target.path;
    try {
      const result = await lighthouse(url, {
        port: 9224, onlyCategories: ['seo', 'accessibility'], output: 'json', logLevel: 'error',
        formFactor: 'mobile', screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false },
        throttlingMethod: 'provided', maxWaitForLoad: 45000,
      });
      if (!result?.lhr) throw new Error('Lighthouse returned no audit result.');
      const lhr = result.lhr;
      const failed = Object.values(lhr.audits).filter(a => a.score !== null && a.score < 1).map(a => ({ id: a.id, title: a.title, score: a.score, description: a.description, details: a.details }));
      await writeFile(path.join(output, `${target.locale}-${target.id}.json`), result.report);
      results.push({
        ...target, url, fetchTime: lhr.fetchTime, environment: 'Managed development preview, editorial draft, noindex by design',
        viewport: { width: 390, height: 844, mobile: true }, lighthouseVersion: lhr.lighthouseVersion,
        seo: lhr.categories.seo.score, accessibility: lhr.categories.accessibility.score,
        // noindex is an intentional draft blocker, not silently ignored.
        failed, runtimeError: lhr.runtimeError,
      });
      console.log(`${target.locale}/${target.id}: SEO ${lhr.categories.seo.score}, accessibility ${lhr.categories.accessibility.score}`);
    } catch (error) {
      results.push({ ...target, url, error: error.message });
      console.error(`${target.locale}/${target.id}: audit failed (${error.message})`);
    }
    await writeFile(path.join(output, 'coverage.json'), JSON.stringify({
      auditScope: '12 Italian editorial pages, 5 candidate service pages, and 8 priority-language editorial samples; NOT every language/URL.',
      environment: 'Development preview, mobile 390×844; noindex is intentional.',
      results,
    }, null, 2));
  }
} finally { await browser.close(); }
if (results.some(r => r.error || r.runtimeError)) process.exitCode = 1;
