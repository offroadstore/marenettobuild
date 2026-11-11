import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/localization/edition-status.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { editionStatusLabel } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const base = { locale: 'it', contentLanguage: 'it', state: 'draft' };

test('historical recovery is not presented as a pending translation or an approval', () => {
  assert.equal(editionStatusLabel(base, { state: 'restored', editorialCorrection: null }), 'Originale storico recuperato');
  assert.equal(editionStatusLabel(base, { state: 'awaiting-confirmation', editorialCorrection: null }), 'Originale recuperato · verifica da completare');
});
test('corrections and translations stay distinct and unapproved', () => {
  const original = { state: 'awaiting-confirmation', editorialCorrection: {} };
  assert.equal(editionStatusLabel(base, original), 'Modifiche da approvare');
  assert.equal(editionStatusLabel({ ...base, locale: 'en', contentLanguage: 'en' }, original), 'Traduzione da approvare');
  assert.equal(editionStatusLabel({ ...base, locale: 'en', contentLanguage: 'en', state: 'translated' }), 'Traduzione da approvare');
});
test('an Italian body under a foreign route is not labelled as translated', () => {
  const foreign = { ...base, locale: 'en' };
  assert.equal(editionStatusLabel(foreign), 'Testo originale IT · non tradotto');
  assert.equal(editionStatusLabel(foreign, { state: 'restored', editorialCorrection: null }), 'Originale storico recuperato · testo IT');
});
test('labels do not mutate approval state or hide incomplete checks', () => {
  const edition = Object.freeze({ ...base, state: 'reviewed' });
  assert.equal(editionStatusLabel(edition), 'Verificata · non attivata');
  assert.equal(edition.state, 'reviewed');
  assert.equal(editionStatusLabel({ ...base, state: 'published' }), '');
});
