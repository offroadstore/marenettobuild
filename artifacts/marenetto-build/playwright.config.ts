import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const chromiumPath = '/repl/tools/bin/chromium';
const vitePort = Number(process.env.MARENETTO_TEST_VITE_PORT ?? 4187);
const productionPort = Number(process.env.MARENETTO_TEST_PRODUCTION_PORT ?? 4188);
const viteUrl = `http://127.0.0.1:${vitePort}`;
const productionUrl = `http://127.0.0.1:${productionPort}`;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: '/tmp/marenetto-playwright-results',
  use: {
    browserName: 'chromium',
    locale: 'it-IT',
    launchOptions: {
      ...(existsSync(chromiumPath) ? { executablePath: chromiumPath } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  projects: [
    {
      name: 'vite-development',
      use: { baseURL: viteUrl },
    },
    {
      name: 'production-preview',
      use: { baseURL: productionUrl },
    },
  ],
  webServer: [
    {
      command: `PORT=${vitePort} BASE_PATH=/ pnpm run dev -- --host 127.0.0.1`,
      url: viteUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command:
        `PORT=${productionPort} BASE_PATH=/ node tests/serve-preview.mjs`,
      url: productionUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
