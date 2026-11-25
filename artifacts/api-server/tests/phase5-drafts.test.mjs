import assert from 'node:assert/strict';
import { normalizeDevelopmentSSR } from '../../marenetto-build/scripts/test-support/ssr-fingerprint.mjs';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { revision, event, cleanBody } from '../src/lib/editorial-content.ts';
import { loadPhase5, markdownBody } from '../../../docs/editorial/phase5/package.mjs';
import { sources } from '../../../docs/editorial/phase5/sources.mjs';
import { PHASE5_LOCALES, historicalPurchasePaths } from '../../../docs/editorial/phase5/locales.mjs';
import { draftFAQ, draftSchemaPreview } from '../../../docs/editorial/phase5/draft-schema.mjs';

// The normal permissions suite runs native strip-types without an extensionless
// TS resolver. Keep that entry compatible and use the package's bundled runner
// for this helper, as the existing editorial HTTP tests already do.
if (process.env.PHASE5_BUNDLED_TEST !== 'true') {
  test('private Phase 5 draft suite', () => {
    const result = spawnSync(process.execPath, [new URL('../scripts/test-phase5.mjs', import.meta.url).pathname], { stdio: 'inherit' });
    assert.equal(result.status, 0);
  });
} else {
const { CreateEditorialBody } = await import('@workspace/api-zod');
const { planDraftImport, DRAFT_ACTOR } = await import('../src/lib/editorial-draft-import.ts');
const pack = await loadPhase5();
const [purchase, permits] = pack.records;
function historicalRow() {
  const active = revision({ ...purchase.content, title: 'Versione pubblica preesistente', body: '<p>Testo da conservare.</p>' }, 'original-source', 'owner');
  const data = {
    state: 'active', activeRevisionId: active.id, historical: true, correction: false,
    aliases: ['/alias-storico'], revisions: [active], events: [],
    originals: [{ label: 'Originale', url: '/origine', hash: 'original', body: 'Immutabile' }],
  };
  event(data, 'approve', active, 'owner');
  event(data, 'activate', active, 'owner');
  return { id: 'existing-family', identity: purchase.identity, path: purchase.path, kind: 'article', locale: 'it', version: 7, data };
}

test('six real Italian manuscripts use the CMS contract, full FAQ answers and dated source records', () => {
  assert.equal(pack.records.length, 6);
  assert.equal(new Set(pack.records.map(r => r.identity)).size, 6);
  assert.deepEqual(pack.pendingLocales, ['en','de','nl','fr','es','pt','pl','ru','sv','no','da']);
  for (const record of pack.records) {
    CreateEditorialBody.parse(record);
    assert.equal(record.review.publicationApproval, null);
    assert.equal(record.content.contentLanguage, 'it');
    assert.equal(record.content.image, '');
    assert.match(record.content.body, /id="sommario"/);
    assert.match(record.content.body, /href="#domande-frequenti"/);
    assert.ok((record.content.body.match(/<h3/g) ?? []).length >= 3);
    assert.ok(record.content.body.replace(/<[^>]*>/g, '').split(/\s+/).length > 500, record.identity);
    assert.doesNotMatch(record.content.body, /<script|datePublished|application\/ld\+json/);
    const ids = new Set([...record.content.body.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
    for (const match of record.content.body.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(match[1]), `${record.identity}: ${match[1]}`);
    for (const id of record.sourceIds) {
      const source = sources.find(s => s.id === id);
      assert.equal(source.consultedOn, '2026-11-25');
      assert.ok(source.scope && source.limit && source.status);
    }
    // The same sanitizer as ordinary CMS saves retains all text and internal
    // contents links. Minor whitespace/self-closing differences are irrelevant.
    const text = html => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    assert.equal(text(cleanBody(record.content.body)), text(record.content.body));
  }
});

test('purchase is appended to its original family without changing public revision, aliases or originals', () => {
  const existing = historicalRow();
  const before = structuredClone(existing);
  const change = planDraftImport(purchase, [existing], ['it']);
  assert.equal(change.operation, 'append');
  assert.deepEqual(existing, before, 'Planner must not mutate the caller snapshot');
  const result = change.row;
  assert.equal(result.id, existing.id);
  assert.equal(result.path, existing.path);
  assert.equal(result.version, 8);
  assert.equal(result.data.activeRevisionId, existing.data.activeRevisionId);
  assert.equal(result.data.state, 'draft');
  assert.deepEqual(result.data.originals, existing.data.originals);
  assert.deepEqual(result.data.aliases, existing.data.aliases);
  assert.deepEqual(result.data.revisions.slice(0, -1), existing.data.revisions);
  assert.deepEqual(result.data.events.slice(0, -1), existing.data.events);
  assert.equal(result.data.events.at(-1).action, 'save');
  assert.equal(result.data.events.at(-1).actor, DRAFT_ACTOR);
  assert.equal(result.data.revisions.at(-1).sourceHash, result.data.revisions.at(-1).hash);
});

test('five new families are drafts with no imported fallback or public pointer', () => {
  for (const record of pack.records.slice(1)) {
    const result = planDraftImport(record, [], ['it']);
    assert.equal(result.operation, 'insert');
    assert.equal(result.row.data.activeRevisionId, null);
    assert.equal(result.row.data.state, 'draft');
    assert.equal(result.row.data.historical, false);
    assert.deepEqual(result.row.data.events.map(e => e.action), ['create']);
    assert.deepEqual(result.row.data.originals, []);
  }
});

test('rerunning never rolls a later human edit back to the imported draft', () => {
  const first = planDraftImport(purchase, [historicalRow()], ['it']).row;
  const human = revision({ ...first.data.revisions.at(-1).content, title: 'Correzione umana successiva' }, 'human-source', 'owner');
  first.data.revisions.push(human);
  first.version++;
  const before = structuredClone(first);
  const rerun = planDraftImport(purchase, [first], ['it']);
  assert.equal(rerun.operation, 'unchanged');
  assert.deepEqual(rerun.row, before);
  const newFamily = planDraftImport(permits, [], ['it']).row;
  assert.equal(planDraftImport(permits, [newFamily], ['it']).operation, 'unchanged');
  const conflict = { ...permits, content: { ...permits.content, title: 'Altra proposta' } };
  assert.throws(() => planDraftImport(conflict, [newFamily], ['it']), /confrontare nel CMS/);
});

test('missing history, path collisions, wrong locale and foreign content fail explicitly', () => {
  assert.throws(() => planDraftImport(purchase, [], ['it']), /Famiglia storica mancante/);
  assert.throws(() => planDraftImport({ ...purchase, path: '/altro' }, [historicalRow()], ['it']), /Percorso o tipo diverso/);
  const collision = { ...historicalRow(), path: permits.path };
  assert.throws(() => planDraftImport(permits, [collision], ['it']), /Percorso già occupato/);
  assert.throws(() => planDraftImport({ ...permits, locale: 'ar' }, [], ['it','ar']), /non autorizzato/);
  assert.throws(() => planDraftImport({ ...permits, content: { ...permits.content, contentLanguage: 'de' } }, [], ['it','de']), /Lingua effettiva/);
});

test('a draft cannot undo a previous withdrawal', () => {
  const existing = historicalRow();
  existing.data.activeRevisionId = null;
  existing.data.withdrawn = true;
  const change = planDraftImport(purchase, [existing], ['it']);
  assert.equal(change.row.data.withdrawn, true);
  assert.equal(change.row.data.activeRevisionId, null);
});

test('confirmed SAL process and published management link replace resolved placeholders', () => {
  for (const index of [3, 5]) {
    const guide = pack.records[index];
    assert.equal(guide.managementLink, true);
    assert.match(guide.content.body, /href="https:\/\/www\.marenettobuild\.com\/gestione-affitti-brevi-cefalu"/);
    assert.match(guide.content.body, /SAL/);
    assert.match(guide.content.body, /WhatsApp/);
    assert.doesNotMatch(guide.content.body, /COLLEGAMENTO IN ATTESA|\[DA CONFERMARE/);
  }
  assert.equal(pack.records[4].privatePlaceholders.length, 2);
  assert.doesNotMatch(pack.records[4].content.body, /\[DA CONFERMARE/);
  assert.match(pack.records[3].content.body, /italiano, inglese, francese, olandese e spagnolo/);
  assert.match(pack.records[4].content.body, /href="\/arredi-su-misura"/);
  assert.throws(() => markdownBody('# Test\n\n<script>alert(1)</script>'), /Raw HTML/);
  assert.throws(() => markdownBody('# Test\n\n[Unsafe](javascript:alert)'), /Unsupported draft link/);
});

test('72 private editions preserve every block, source, FAQ, placeholder and real-language route', async () => {
  const all = await loadPhase5({ locales: PHASE5_LOCALES });
  assert.equal(all.records.length, 72);
  assert.deepEqual(all.pendingLocales, []);
  assert.equal(all.professionalOpinion, false);
  assert.equal(all.publicationHeld, true);
  assert.equal(all.readyForOwnerPublication, true, 'Review receipts must match all final candidates');
  assert.equal(new Set(all.records.map(r => r.path)).size, 72);
  for (const record of all.records) {
    CreateEditorialBody.parse(record);
    assert.equal(record.review.publicationApproval, null);
    assert.match(record.review.technical, /professional checks remain open/);
    assert.ok(['pending','AI-assisted-reviewed-informative'].includes(record.review.linguistic));
    assert.equal(record.review.professionalOpinion, false);
    assert.equal(record.review.ownerInternalApproval.scope, 'review-method-and-business-facts');
    assert.ok(record.content.body.includes(`<strong>${record.warning.title}</strong>`));
    assert.match(record.content.body, /^<blockquote id="phase5-technical-notice">/);
    assert.doesNotMatch(record.content.body, /\[(?:DA CONFERMARE|COLLEGAMENTO IN ATTESA)/);
    assert.equal(record.content.contentLanguage, record.locale);
    assert.equal(record.content.image, '');
    const source = pack.records.find(r => r.identity === record.identity);
    assert.equal(record.sourceManuscriptSHA256, source.manuscriptSHA256);
    if (record.locale !== 'it') {
      assert.notEqual(record.content.title, source.content.title);
      assert.notEqual(record.content.body, source.content.body);
      assert.ok(record.glossary.length >= 3);
      assert.ok(record.content.seoTitle.length <= 200);
      assert.ok(record.content.seoDescription.length <= 500);
    }
    if (record.mode === 'revise-existing') assert.equal(record.path, historicalPurchasePaths[record.locale]);
    const ids = [...record.content.body.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `Duplicate heading id: ${record.path}`);
    for (const match of record.content.body.matchAll(/href="#([^"]+)"/g)) {
      assert.match(match[1], /^[a-zA-Z0-9_-]+$/);
      assert.ok(ids.includes(match[1]));
      assert.ok(cleanBody(record.content.body).includes(`href="#${match[1]}"`));
    }
    for (const match of record.content.body.matchAll(/href="(\/[^"]+)"/g)) {
      assert.ok([record.locale === 'it' ? '/servizi' : `/${record.locale}/services`,
        record.locale === 'it' ? '/arredi-su-misura' : `/${record.locale}/bespoke-furniture`].includes(match[1]), `${record.path}: ${match[1]}`);
    }
    assert.match(record.content.body, /href="mailto:info@marenetto.com"/);
    assert.doesNotMatch(record.content.body, /<script|verifiedLinks\./);
    assert.equal(draftFAQ(record).length, 3);
    const schema = draftSchemaPreview(record, 'https://www.marenettobuild.com');
    const article = schema['@graph'][0];
    assert.equal(article.author['@type'], 'Organization');
    assert.equal(article.author.name, 'Marenetto Build');
    assert.equal(article.inLanguage, record.locale);
    assert.equal(article.mainEntityOfPage, `https://www.marenettobuild.com${record.path}`);
    assert.ok(!('datePublished' in article));
    assert.deepEqual(schema['@graph'][1].mainEntity.map(q => q.acceptedAnswer.text), draftFAQ(record).map(f => f.answer));
  }
  await assert.rejects(loadPhase5({ locales: ['ar'] }), /Unsupported/);
});

test('SSR fingerprints ignore only Vite module timestamps, not article or SEO changes', () => {
  const original = '<script type="module" src="/src/main.tsx"></script><link rel="canonical" href="/guida?t=123"><main>Prima fase</main>';
  const hot = original.replace('/src/main.tsx', '/src/main.tsx?t=123456789');
  assert.equal(normalizeDevelopmentSSR(hot), original);
  assert.notEqual(normalizeDevelopmentSSR(hot.replace('Prima fase','Seconda fase')), original);
  assert.notEqual(normalizeDevelopmentSSR(hot.replace('/guida?t=123','/guida?t=456')), original);
});

test('explicit updates append only our unapproved drafts and never replace human edits', () => {
  const row = planDraftImport(permits, [], ['it']).row;
  const original = structuredClone(row);
  const update = { ...permits, updateOwnDraft: true, content: { ...permits.content, title: 'Titolo aggiornato' } };
  const appended = planDraftImport(update, [row], ['it']);
  assert.equal(appended.operation, 'append');
  assert.deepEqual(row, original);
  assert.deepEqual(appended.row.data.revisions.slice(0, -1), row.data.revisions);
  assert.equal(appended.row.data.activeRevisionId, null);
  row.data.revisions.push(revision({ ...permits.content, title: 'Modifica del titolare' }, '', 'owner'));
  assert.throws(() => planDraftImport(update, [row], ['it']), /confrontare nel CMS/);
  const approved = structuredClone(original);
  approved.data.state = 'approved';
  assert.throws(() => planDraftImport(update, [approved], ['it']), /confrontare nel CMS/);
});

test('foreign drafts bind to the exact current Italian revision without creating approvals', async () => {
  const all = await loadPhase5({ locales: ['it','en'] });
  const translation = all.records.find(r => r.locale === 'en' && r.identity === permits.identity);
  const italian = planDraftImport(permits, [], ['it','en']).row;
  const sourceHash = italian.data.revisions.at(-1).hash;
  const proposed = { ...translation, sourceHash };
  const result = planDraftImport(proposed, [italian], ['it','en']);
  assert.equal(result.row.locale, 'en');
  assert.equal(result.row.data.revisions.at(-1).sourceHash, sourceHash);
  assert.equal(result.row.data.activeRevisionId, null);
  assert.equal(result.row.data.state, 'draft');
  assert.deepEqual(result.row.data.events.map(e => e.action), ['create']);
  assert.throws(() => planDraftImport({ ...proposed, sourceHash: undefined }, [italian], ['it','en']), /Sorgente italiana/);
  italian.data.revisions.push(revision({ ...permits.content, title: 'Fonte italiana modificata' }, '', 'owner'));
  assert.throws(() => planDraftImport(proposed, [italian], ['it','en']), /Sorgente italiana/);
});
}
