import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const chromiumPath = '/repl/tools/bin/chromium';

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
    launchOptions: {
      ...(existsSync(chromiumPath) ? { executablePath: chromiumPath } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  projects: [
    {
      name: 'vite-development',
      use: { baseURL: 'http://127.0.0.1:4187' },
    },
    {
      name: 'production-preview',
      use: { baseURL: 'http://127.0.0.1:4188' },
    },
  ],
  webServer: [
    {
      command: 'PORT=4187 BASE_PATH=/ pnpm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:4187',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command:
        'PORT=4188 BASE_PATH=/ pnpm run build && PORT=4188 BASE_PATH=/ pnpm exec vite preview --config vite.config.ts --host 127.0.0.1',
      url: 'http://127.0.0.1:4188',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
