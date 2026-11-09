import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('src/components/home/IllustrationNote.tsx', root), 'utf8');
const ast = ts.createSourceFile('IllustrationNote.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const translations = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'illustrationNotes') {
    for (const property of node.initializer.properties) {
      assert.ok(ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer));
      translations[property.name.getText(ast)] = property.initializer.text;
    }
  }
  ts.forEachChild(node, visit);
}
visit(ast);

test('the disclosure has explicit text for every supported page language', async () => {
  const locales = JSON.parse(await readFile(new URL('src/localization/locales.json', root), 'utf8'));
  assert.deepEqual(Object.keys(translations).sort(), locales.map(locale => locale.code).sort());
  assert.equal(translations.it, 'Immagini illustrative generate con IA; non rappresentano lavori eseguiti.');
  assert.ok(Object.values(translations).every(text => text.length > 30));
});

test('image components contain no overlaid disclosures', async () => {
  const media = await readFile(new URL('src/components/home/Media.tsx', root), 'utf8');
  assert.doesNotMatch(media, /figcaption|mb-media__tag|mbh-hero__tag|label-illustrative/);
  const css = await readFile(new URL('src/styles/home.css', root), 'utf8');
  assert.doesNotMatch(css, /\.mb-media__tag|\.mbh-hero__tag/);
  const noteRule = css.match(/\.mbh p\.mbh-image-note\s*\{([^}]+)\}/)?.[1];
  assert.ok(noteRule);
  assert.match(noteRule, /font-size:13px/);
  assert.match(noteRule, /position:static/);
  assert.match(noteRule, /color:var\(--mb-ink-2\)/);
  assert.match(noteRule, /opacity:1/);
  assert.match(noteRule, /border:0/);
});
