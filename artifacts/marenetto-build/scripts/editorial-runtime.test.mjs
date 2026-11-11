import test from 'node:test';
import assert from 'node:assert/strict';
import { render, editions } from '../dist/server/entry-server.mjs';

const content = (title, language, body = '<p>Testo attivo.</p>') => ({
  title, summary:'Sommario attivo', body, category:'Test', tags:[], image:'', imageAlt:'',
  sources:[], seoTitle:title, seoDescription:'Descrizione attiva', contentLanguage:language,
});
const article = (locale) => ({
  identity:'synthetic-runtime', locale, path:`${locale==='it'?'':`/${locale}`}/synthetic-runtime`,
  kind:'article', revisionId:`active-${locale}`, content:content(locale==='it'?'Articolo italiano sintetico':'مقال عربي اصطناعي',locale,'<h1>Titolo interno</h1><p>Corpo attivo.</p>'),
});

test('initial HTML renders the selected exact active revision, including Unicode aliases and one H1', async () => {
  const live={...article('ar'),aliases:['/ar/اختبار']};
  const result=await render('/ar/%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1','ar',[live]);
  assert.match(result.body,/data-active-revision="active-ar"/);
  assert.ok(result.body.includes(live.content.title));
  assert.equal((result.body.match(/<h1(?:\s|>)/g)??[]).length,1);
  assert.match(result.body,/dir="rtl"/);
});

test('an edited archive page lists the Arabic active article rather than the Italian revision', async () => {
  const archive={identity:'articles',locale:'ar',path:'/ar/articles',kind:'page',revisionId:'archive-active',content:content('الأرشيف','ar')};
  const result=await render('/ar/articles','ar',[article('it'),article('ar'),archive]);
  assert.match(result.body,/data-active-revision="archive-active"/);
  assert.match(result.body,/data-testid="active-article-listing"/);
  assert.ok(result.body.includes(article('ar').content.title));
  assert.ok(!result.body.includes(article('it').content.title));
  assert.ok(result.body.includes('/ar/synthetic-runtime'));
});

test('a withdrawn existing article never falls back to its static public body', async () => {
  const existing=editions.find(e=>e.kind==='article'&&e.locale==='it');
  assert.ok(existing);
  const withdrawn={...article('it'),identity:existing.id,path:existing.path,revisionId:'withdrawn',content:content('Contenuto ritirato','it','')};
  const result=await render(existing.path,'it',[withdrawn]);
  assert.ok(!result.body.includes('data-active-revision='));
  assert.match(result.body,/404/);
});
