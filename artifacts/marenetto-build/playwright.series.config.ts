import base from './playwright.analytics.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:['series-consent.spec.ts'],outputDir:'../../generated-artifacts/costruire-cefalu-madonie/browser-results'});
