import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const output = path.resolve(import.meta.dirname, '../../../generated-artifacts/seo-audit');
const browser = await chromium.launch({ executablePath: '/repl/tools/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const service = spawn(process.execPath, [path.join(import.meta.dirname, 'serve-seo.mjs')], { env: { ...process.env, PORT: '4194' }, stdio: ['ignore', 'pipe', 'inherit'] });
const results = [];
try {
  await new Promise((resolve, reject) => { service.stdout.once('data', resolve); service.once('error', reject); service.once('exit', code => reject(new Error(`Lab HTTP handler stopped: ${code}`))); });
  for (const route of ['/', '/nl/', '/ar/']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, locale: 'it-IT' });
    await context.addInitScript(() => {
      window.__seoLab = { lcp: null, cls: 0 };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__seoLab.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__seoLab.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(`http://127.0.0.1:4194${route}`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await page.waitForTimeout(1500);
    results.push(await page.evaluate(route => ({
      route, scope: 'Prepared production HTTP handler, cold isolated context, Chromium, 390x844 DPR1, CPU4x, 150ms latency, 1.6Mbps down; laboratory only, no INP/field CWV',
      ...window.__seoLab,
      navigation: performance.getEntriesByType('navigation').map(entry => entry.toJSON()),
      paints: performance.getEntriesByType('paint').map(entry => entry.toJSON()),
      resources: performance.getEntriesByType('resource').map(entry => ({ url: entry.name.replace(/https?:\/\/[^/]+/, ''), transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize, duration: entry.duration })),
    }), route));
    await context.close();
  }
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'throttled-lab-metrics.json'), JSON.stringify({ baseline: 'Timing baseline not captured before edits; no before/after speedup claim is made.', results }, null, 2));
  console.info(results.map(({ route, lcp, cls }) => ({ route, lcp, cls })));
} finally { service.kill(); await browser.close(); }
