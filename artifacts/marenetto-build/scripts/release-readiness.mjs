import { seriesRelease } from '../src/content/series-release.mjs';
import { publicEditions } from './public-release.mjs';
import commercial from '../src/content/commercial-release-index.json' with {type:'json'};
export function releaseReadiness(manifest, active) {
  const entries = publicEditions(manifest, active);
  const expectedRecords=[...seriesRelease.records,...commercial.records.filter(r=>!r.readOnlySeries)];
  const missing = expectedRecords.filter(expected => !entries.some(e =>
    e.path === expected.path && e.id === expected.identity && e.locale === expected.locale &&
    e.activeEditorialRevision && e.sitemap !== false));
  return { ready: expectedRecords.length === 290 && missing.length === 0,
    expected:290, series:120, commercial:182, shared:12, historical:24, missing:missing.map(e => ({identity:e.identity,locale:e.locale,path:e.path})) };
}
