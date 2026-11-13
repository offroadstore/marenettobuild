import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'analytics.spec.ts', timeout: 30000, workers: 1,
  outputDir: '../../generated-artifacts/monitoring/browser-results',
  reporter: 'list',
  use: { browserName: 'chromium', launchOptions: {
    ...(existsSync('/repl/tools/bin/chromium') ? { executablePath: '/repl/tools/bin/chromium' } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  } },
});
