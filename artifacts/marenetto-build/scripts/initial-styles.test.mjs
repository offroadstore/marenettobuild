import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('server-rendered media styles block first paint without waiting for JavaScript', async () => {
  const template = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const head = template.slice(0, template.indexOf('</head>'));
  const sheets = [...head.matchAll(/<link rel="stylesheet" href="([^"]+)"\s*\/?>/g)].map(match => match[1]);
  assert.deepEqual(sheets, ['/src/styles/brand.css', '/src/styles/home.css', '/src/index.css']);
  assert.ok(!head.includes('media="print"'), 'Styles must not be deferred until JavaScript switches media');
  for (const sheet of sheets) {
    const css = await readFile(new URL(`..${sheet}`, import.meta.url), 'utf8');
    assert.ok(css.trim().length > 0);
  }
});
