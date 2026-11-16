import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: 'historical-category.spec.ts',
  outputDir: '/tmp/marenetto-category-results',
  projects: [
    { name: 'vite-development', use: { baseURL: 'http://127.0.0.1:4197' } },
    { name: 'production-preview', use: { baseURL: 'http://127.0.0.1:4198' } },
  ],
  webServer: [
    { command: 'PORT=4197 BASE_PATH=/ pnpm run dev', url: 'http://127.0.0.1:4197', timeout: 30_000 },
    { command: 'PORT=4198 BASE_PATH=/ node tests/serve-preview.mjs', url: 'http://127.0.0.1:4198', timeout: 120_000 },
  ],
});
