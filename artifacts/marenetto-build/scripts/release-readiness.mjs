import { seriesRelease } from '../src/content/series-release.mjs';
import { publicEditions } from './public-release.mjs';
export function releaseReadiness(manifest, active) {
  const entries = publicEditions(manifest, active);
  const missing = seriesRelease.records.filter(expected => !entries.some(e =>
    e.path === expected.path && e.id === expected.identity && e.locale === expected.locale &&
    e.activeEditorialRevision && e.sitemap !== false));
  return { ready: seriesRelease.records.length === 120 && missing.length === 0,
    expected:120, historical:24, missing:missing.map(e => ({identity:e.identity,locale:e.locale,path:e.path})) };
}
