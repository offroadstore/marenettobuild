import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { CallRequestAccess, CallPrivacyFooter } from '../src/components/CallRequestAccess';
import { CALL_LOCALES, getCallCopy } from '../src/content/call-request-copy';

for (const locale of CALL_LOCALES) test(`${locale}: callback entry points and separate privacy notice are localized and safe in initial HTML`, () => {
  const c = getCallCopy(locale);
  for (const page of ['home', 'services', 'articles']) {
    const html = renderToStaticMarkup(<CallRequestAccess lang={locale} page={page} />);
    assert.ok(html.includes(`entry-call-${page}`));
    assert.ok(html.includes(c.open.replaceAll('&', '&amp;').replaceAll("'", '&#x27;')));
    assert.ok(html.includes('button-call-fixed'));
    assert.ok(!html.includes('dialog-call-request'));
    assert.ok(!/<script|<iframe|https:\/\/wa.me/.test(html));
  }
  const notice = renderToStaticMarkup(<CallPrivacyFooter lang={locale} />);
  assert.ok(notice.includes('footer-call-privacy')); assert.ok(notice.includes('info@marenetto.com'));
  assert.ok(notice.includes('24')); assert.ok(notice.includes('utm_source'));
  // National citation formats differ: e.g. "6 Abs. 1", "6.º, n.º 1", "6 nr. 1".
  assert.match(c.privacy[0], /6[^\d]{0,20}1[^b]{0,20}b/);
  assert.match(c.privacy[0], /6[^\d]{0,20}1[^a]{0,20}a/);
  const leaves = (obj: unknown): string[] => typeof obj === 'string' ? [obj] : Object.values(obj as Record<string, unknown>).flatMap(leaves);
  assert.ok(leaves(c).filter(s => s.length > 0).length > 60);
  if (locale !== 'en') {
    assert.notEqual(c.open, getCallCopy('en').open);
    assert.notEqual(c.errGeneric, getCallCopy('en').errGeneric);
    assert.notDeepEqual(c.privacy, getCallCopy('en').privacy);
  }
});
