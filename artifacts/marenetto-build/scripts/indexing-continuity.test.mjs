import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { seriesRelease, seriesEntries } from '../src/content/series-release.mjs';
import { publicEditions, alternateLinks } from './public-release.mjs';
import { releaseReadiness } from './release-readiness.mjs';
import { mergeActiveMetadata } from '../src/localization/public-seo.mjs';
const manifest=JSON.parse(await readFile(new URL('../dist/public/route-manifest.json',import.meta.url),'utf8'));
const catalog=JSON.parse(await readFile(new URL('../../../generated-artifacts/editorial/catalog.json',import.meta.url),'utf8'));
const active=seriesRelease.records.map(r=>({...r,revisionId:'test-active',revisionHash:r.hash,sourceHash:r.sourceHash,kind:'article',
  content:catalog.seriesDrafts.find(d=>d.identity===r.identity&&d.locale===r.locale).content}));
test('all 24 existing family URLs remain indexable without an active override',()=>{
  const entries=publicEditions(manifest,[]);
  for(const expected of seriesRelease.records.filter(r=>[4,7].includes(r.episode))) {
    assert.ok(entries.some(e=>e.path===expected.path),expected.path);
  }
});
test('all 120 exact authorized active editions join sitemap and reciprocal alternate sets',()=>{
  assert.equal(seriesEntries(active).length,120);
  assert.equal(releaseReadiness(manifest,active).ready,false,'Series alone cannot prove the entire commercial release ready');
  const entries=publicEditions(manifest,active);
  for(const r of seriesRelease.records) {
    const e=entries.find(e=>e.path===r.path);
    assert.ok(e);
    for(const a of alternateLinks(e,entries)) {
      const peer=entries.find(p=>p.path===a.path);
      assert.ok(peer);assert.ok(alternateLinks(peer,entries).some(link=>link.path===e.path));
    }
  }
});
test('unknown guide hashes and stale Italian sources cannot inherit series authorization',()=>{
  const changed=structuredClone(active);
  changed[0].revisionHash='unapproved';
  assert.equal(seriesEntries(changed).filter(e=>e.id===changed[0].identity).length,0);
  assert.equal(releaseReadiness(manifest,changed).ready,false);
  const draft=structuredClone(active.find(e=>e.locale==='it'&&e.episode===7));
  draft.revisionHash='unapproved-new-composition';
  const entry=mergeActiveMetadata(Object.values(manifest.editions),[draft]).find(e=>e.path===draft.path);
  assert.equal(entry.indexing,'never');
  assert.equal(entry.sitemap,false);
  const stale=structuredClone(active);
  stale.find(e=>e.locale==='it'&&e.episode===7).revisionHash='new-active-source';
  assert.ok(!publicEditions(manifest,stale).some(e=>stale.some(s=>s.episode===7&&s.locale!=='it'&&s.path===e.path)),
    'stale active translations are excluded without restoring the historical sitemap entry');
});
test('withdrawal, unavailable release and explicit private exclusions remain fail-closed',()=>{
  const withdrawn=structuredClone(active);
  const row=withdrawn.find(e=>e.episode===4&&e.locale==='it');
  row.revisionId='withdrawn';
  assert.ok(!publicEditions(manifest,withdrawn).some(e=>e.path===row.path));
  assert.equal(releaseReadiness(manifest,withdrawn).ready,false);
  assert.equal(releaseReadiness(manifest,[]).ready,false);
  assert.ok(publicEditions(manifest,active).every(e=>!/^\/(?:internal|__|owner-demo|sign-in|sign-up)/.test(e.path)));
});
test('a later owner-approved active revision inherits the historical URL but not stale translations',()=>{
  const current=structuredClone(active);
  const italian=current.find(e=>e.locale==='it'&&e.episode===7);
  italian.revisionHash='later-owner-approved-hash';
  italian.sourceHash=italian.revisionHash;
  italian.indexingAuthorized=true;
  italian.content.summary+=' Revisione successiva approvata nel CMS.';
  const entries=publicEditions(manifest,current);
  assert.ok(entries.some(e=>e.path===italian.path),'exact active ledger approval preserves historical indexing');
  assert.ok(!entries.some(e=>current.some(r=>r.episode===7&&r.locale!=='it'&&r.path===e.path)));
  italian.indexingAuthorized=false;
  assert.ok(!publicEditions(manifest,current).some(e=>e.path===italian.path),'hash alone is not authorization');
});
test('active pre-series historical translations follow the active source, not static-file invalidation',()=>{
  const historical=structuredClone(active.filter(e=>[4,7].includes(e.episode)));
  for(const e of historical) {
    delete e.content.guide;
    e.revisionHash=`legacy-approved-${e.episode}-${e.locale}`;
    e.sourceHash=`legacy-approved-${e.episode}-it`;
    e.indexingAuthorized=true;
  }
  const entries=publicEditions(manifest,historical);
  for(const e of historical)assert.ok(entries.some(p=>p.path===e.path),e.path);
  historical.find(e=>e.locale==='de'&&e.episode===7).sourceHash='genuinely-stale';
  assert.ok(!publicEditions(manifest,historical).some(p=>p.path===historical.find(e=>e.locale==='de'&&e.episode===7).path));
});
