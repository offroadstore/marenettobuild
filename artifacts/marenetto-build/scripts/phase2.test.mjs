import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { publicEditions, alternateLinks } from './public-release.mjs';
import { hasTranslationApproval, mergeActiveMetadata } from '../src/localization/public-seo.mjs';

const read = async file => JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'));
const { records } = await read('../src/localization/phase2/inventory.json');
const supplemental = (await read('../src/localization/phase2/supplemental.json')).records;
const allRecords = [...records, ...supplemental];
const baseline = await read('../src/localization/phase2/baseline.json');
const manifest = await read('../dist/public/route-manifest.json');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
test('80 candidates reconcile by locale and type, without extending historical approval', () => {
  assert.equal(records.length, 80);
  assert.equal(new Set(records.map(e => e.path)).size, 80);
  for (const [kind, count] of [['core',24], ['archive',14], ['article',42]]) assert.equal(records.filter(e => e.kind === kind).length, count);
  for (const locale of ['en','fr','de','nl','es','pt','ru','pl','sv','no','da']) {
    assert.equal(records.filter(e => e.locale === locale).length, ['sv','no','da'].includes(locale) ? 16 : 4);
  }
  for (const e of allRecords) {
    const actual = manifest.editions[e.path];
    assert.equal(actual.contentLanguage, e.locale);
    assert.equal(actual.translationRevision, e.revisionSHA256);
    assert.equal(actual.approval, null);
    assert.equal(actual.sitemap, false);
    assert.equal(e.approval, null);
    assert.equal(hasTranslationApproval(actual), false);
  }
  assert.equal(supplemental.length, 8);
  assert.deepEqual(new Set(publicEditions(manifest).map(e => e.path)),
    new Set(baseline.filter(e => !supplemental.some(s => s.path === e.path)).map(e => e.path)));
});
test('new text has its own content digest; all translation keys exist', async () => {
  const sources = await read('../src/localization/preview-sources.json');
  for (const e of allRecords) {
    const catalog = await read(`../src/localization/phase2/${e.locale}.json`);
    const revision = { sourceRevisionSHA256: e.sourceRevisionSHA256, title: e.title, description: e.description,
      document: catalog.historical[e.path.replace(/\/+$/, '')] ?? null, translations: catalog.translations };
    assert.equal(hash(revision), e.revisionSHA256, e.path);
    for (const [id, value] of Object.entries(catalog.translations)) {
      assert.ok(sources.entries[id], id);
      assert.ok(value.trim(), `${e.locale}:${id}`);
      assert.ok(!value.includes('\\n'), `Literal escaped line break: ${e.locale}:${id}`);
    }
    for (const doc of Object.values(catalog.historical)) assert.ok(!doc.html.includes('\\n'), `Escaped line break in ${e.locale} HTML`);
  }
});
test('revision-specific approval, changed sources and withdrawal fail closed', () => {
  const e = { ...manifest.editions[records[0].path], approval: 'Actual test fixture, not a recorded owner decision' };
  assert.equal(hasTranslationApproval(e), false);
  assert.equal(hasTranslationApproval({ ...e, translationApprovalRevision: e.translationRevision }), true);
  const active = [{ path: '/other', aliases: [e.translationSourcePath], revisionId: 'withdrawn' }];
  const [stale] = mergeActiveMetadata([{ ...e, translationApprovalRevision: e.translationRevision }], active);
  assert.equal(hasTranslationApproval(stale), false);
  assert.equal(publicEditions(manifest, [{ path: records[0].path, revisionId: 'withdrawn' }]).some(c => c.path === records[0].path), false);
});
test('only exact hypothetical approval revisions yield 350 reciprocal editions', () => {
  const approvedFixture = structuredClone(manifest);
  for (const e of allRecords) Object.assign(approvedFixture.editions[e.path], {
    approval: 'Synthetic test approval only; never persisted in the real ledger',
    translationApprovalRevision: e.revisionSHA256,
  });
  const eligible = publicEditions(approvedFixture);
  assert.equal(eligible.length, 350);
  assert.equal(new Set(eligible.map(e => e.locale)).size, 12);
  for (const e of eligible) {
    const links = alternateLinks(e, eligible);
    assert.equal(new Set(links.map(l => l.lang)).size, links.length, e.path);
    assert.ok(links.some(l => l.lang === 'x-default'), e.path);
    for (const link of links) {
      const equivalent = eligible.find(other => other.path === link.path);
      assert.ok(equivalent);
      assert.ok(alternateLinks(equivalent, eligible).some(other => other.path === e.path));
    }
  }
});
test('historical originals remain unchanged except explicit partner wording in translated drafts', async () => {
  const originals = await read('../../../docs/production-readiness/phase2/sources.json');
  for (const e of records.filter(e => e.historical)) {
    const catalog = await read(`../src/localization/phase2/${e.locale}.json`);
    const source = originals[e.sourceKey];
    const doc = catalog.historical[e.path.replace(/\/+$/, '')];
    assert.deepEqual(doc.html.match(/<[^>]*>/g), source.html.match(/<[^>]*>/g));
    assert.deepEqual(doc.html.match(/\d+(?:[.,]\d+)*/g), source.html.match(/\d+(?:[.,]\d+)*/g));
    assert.doesNotMatch(doc.html, /(?:agenzi[ae] immobili|real estate agenc|partenaire|parceiro|\bpartner\b|\bsocio\b)/i);
    assert.doesNotMatch(doc.html, /Chi siamo|Contatti|Domande Frequenti|Scegliere Marenetto|Affida la tua/);
  }
});
test('eight supplemental repairs preserve all text outside exact recorded substitutions', async () => {
  const originals = await read('../../../docs/production-readiness/phase2/sources.json');
  const changes = await read('../src/localization/phase2/supplemental-comparison.json');
  for (const e of supplemental) {
    const before = originals[e.sourceKey].documentBefore.html;
    const catalog = await read(`../src/localization/phase2/${e.locale}.json`);
    const after = catalog.historical[e.path.replace(/\/+$/, '')].html;
    let expected = before;
    for (const c of changes.find(c => c.path === e.path).changes) {
      assert.ok(expected.includes(c.before), e.path + ':' + c.id);
      expected = expected.replace(c.before, c.after.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;'));
    }
    assert.equal(after, expected);
    assert.deepEqual(before.match(/<[^>]*>/g), after.match(/<[^>]*>/g));
  }
});
