import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadPhase5 } from '../../../docs/editorial/phase5/package.mjs';
import { PHASE5_LOCALES } from '../../../docs/editorial/phase5/locales.mjs';
import { draftSchemaPreview } from '../../../docs/editorial/phase5/draft-schema.mjs';
import { renderDocument } from './seo-document.mjs';

// The existing, unchanged application renderer receives synthetic active rows
// IN MEMORY ONLY. No fixture is written to the CMS or exposed over HTTP.
const { render } = await import('../dist/server/entry-server.mjs');
const pack = await loadPhase5({ locales: PHASE5_LOCALES });
assert.equal(pack.records.length, 72);
assert.deepEqual(pack.pendingLocales, []);
assert.equal(pack.readyForOwnerPublication, true, 'Every exact candidate needs a current AI-assisted review receipt');
const output = new URL('../../../generated-artifacts/editorial/phase5/ssr-candidates/', import.meta.url);
await mkdir(output, { recursive: true });
const origin = 'https://www.marenettobuild.com';
const template = '<!doctype html><html lang="it"><head><meta charset="utf-8"><title></title></head><body><div id="root"></div></body></html>';
const results = [];
for (const [index, record] of pack.records.entries()) {
  const active = {
    id: `private-fixture-${index}`, identity: record.identity, locale: record.locale,
    path: record.path, kind: 'article', revisionId: `private-candidate-${index}`, content: record.content,
  };
  const rendered = await render(record.path, record.locale, [active]);
  const schema = draftSchemaPreview(record, origin);
  const html = renderDocument(template, {
    edition: { path: record.path, locale: record.locale, kind: 'article', state: 'reviewed', title: record.content.seoTitle, description: record.content.seoDescription, activeSeoTitle: true, activeSeoDescription: true },
    body: rendered.body, structuredData: schema['@graph'],
  });
  assert.ok(rendered.body.includes(record.content.body), `Incomplete SSR body: ${record.path}`);
  assert.equal((rendered.body.match(/<h1\b/g) ?? []).length, 1, record.path);
  assert.ok(rendered.body.includes(`lang="${record.locale}"`));
  assert.doesNotMatch(rendered.body, /\[(?:DA CONFERMARE|COLLEGAMENTO IN ATTESA)/);
  assert.ok(html.includes(`href="${origin}${record.path}"`));
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.ok(html.includes(record.warning.title), record.path);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(graph['@graph'][0].author['@type'], 'Organization');
  assert.equal(graph['@graph'][0].inLanguage, record.locale);
  assert.equal(graph['@graph'][1].mainEntity.length, 3);
  assert.ok(!('datePublished' in graph['@graph'][0]));
  const file = `${record.locale}-${String(index % 6 + 1).padStart(2, '0')}.html`;
  await writeFile(new URL(file, output), html);
  results.push({
    identity: record.identity, locale: record.locale, proposedPath: record.path,
    candidateContentSHA256: record.candidateContentSHA256, ssrSHA256: createHash('sha256').update(html).digest('hex'),
    review: record.review, schemaPreview: schema, privatePlaceholders: record.privatePlaceholders, proofFile: file,
  });
}
await writeFile(new URL('../ready-for-owner-republish.json', output), JSON.stringify({
  status: 'PRONTO PER REPUBLISH — PACCHETTO PRIVATO, NON ATTIVATO',
  verifiedAt: new Date().toISOString(), editions: results.length,
  ownerDecisionDate: '2026-11-25', reviewMethod: 'AI-assisted documentary and language review plus owner internal direction',
  professionalOpinion: false, caseSpecificProfessionalChecksOpen: true,
  publicationHeld: true, activeCMSRevisionsChanged: false,
  instructions: 'After merge, import the private drafts explicitly; owner via Claude must authorize exact revisions and languages and perform the CMS/release/publication steps. Republish alone does not activate these drafts. No production publication performed here.',
  records: results,
}, null, 2));
process.stdout.write(`PRONTO PER REPUBLISH (private handoff): ${results.length} SSR candidates, 12 locales, complete bodies, headings, localized notices and matching Article/FAQPage proposals. No public activation.\n`);
