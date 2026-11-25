import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { test } from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const sha = text => createHash('sha256').update(text).digest('hex');
const manifest = await read('src/content/historical-editorial/manifest.json');
const proposal = await read('content/historical-corrections.proposed.json');
const translations = await read('content/historical-corrections.translations.json');
const inventory = await read('src/content/historical/index.json');
const encode = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

test('the 25 authorized changes preserve originals and never approve publication or foreign-language review', async () => {
  assert.equal(manifest.publicationApproved, false);
  assert.equal(translations.humanReviewed, false);
  assert.equal(Object.keys(manifest.pages).length, 72);
  assert.equal(manifest.missingCounterparts.length, 4);
  let corrected = 0;
  for (const [key, revision] of Object.entries(manifest.pages)) {
    const original = inventory.find(page => page.key === key);
    const source = (await read(`src/content/historical/${revision.locale}.json`))[key];
    const edited = (await read(`src/content/historical-editorial/${revision.locale}.json`))[key];
    assert.equal(sha(source.html), revision.originalHTMLSHA256, key);
    assert.equal(sha(edited.html), revision.correctedHTMLSHA256, key);
    assert.equal(original.sourceSHA256, revision.sourceSHA256, key);
    assert.equal(original.path, revision.path, key);
    assert.equal(revision.publicationApproved, false, key);
    if (revision.locale !== 'it') assert.equal(revision.linguisticReview, 'pending', key);
    for (const field of ['title', 'description', 'publishedOn', 'dateLabel', 'image', 'imageAlt', 'imageCaption']) assert.deepEqual(edited[field], source[field], `${key}:${field}`);
    for (const id of revision.claims) {
      const replacement = revision.locale === 'it' || revision.contentLanguage === 'it' ? proposal.replacements[id - 1].replacement : translations[revision.locale][id - 1];
      // Email is deliberately rendered as a functional mailto, not plain text.
      if (id === 24) assert.match(edited.html, /href="mailto:info@marenetto\.com"/, key);
      else assert.ok(edited.html.includes(encode(replacement)), `${key}: correction ${id}`);
      corrected++;
    }
  }
  assert.equal(corrected, 221);
  assert.equal(corrected + manifest.missingCounterparts.length, 225);
  const italian = Object.values(manifest.pages).filter(page => page.locale === 'it');
  assert.equal(italian.flatMap(page => page.claims).length, 25);
});

test('corrected historical pages are fully served in preview, not silently published as approved equivalents', async () => {
  const routes = await read('dist/public/route-manifest.json');
  const sitemap = await readFile(path.join(root, 'dist/public/sitemap.xml'), 'utf8');
  assert.equal(Object.keys(routes.correctedPages).length, 72);
  for (const [key, revision] of Object.entries(manifest.pages)) {
    assert.ok(routes.pages[revision.path], revision.path);
    assert.equal(routes.heldPages[key], undefined, key);
    const edition = routes.editions[revision.path];
    const html = await readFile(path.join(root, 'dist/public', routes.pages[revision.path]), 'utf8');
    assert.match(html, /data-correction-state="(?:owner-authorized-preview|translation-draft)"/, key);
    if (edition.approval) {
      assert.match(edition.approval, /Owner authorization: index all public pages/);
      assert.equal(edition.sitemap, true);
      assert.equal(edition.state, 'published');
      // Static candidate documents are always noindex. The public-host HTTP
      // release tests verify indexability after the owner's new authorization.
      assert.match(html, /name="robots" content="noindex, nofollow"/);
      assert.ok(sitemap.includes(new URL(revision.path, routes.origin).href));
      continue;
    }
    assert.equal(edition.sitemap, false, key);
    assert.notEqual(edition.state, 'published', key);
    assert.match(html, /name="robots" content="noindex, nofollow"/, key);
    assert.doesNotMatch(html, /hreflang=/, key);
    assert.ok(!sitemap.includes(new URL(revision.path, routes.origin).href), key);
  }
});
