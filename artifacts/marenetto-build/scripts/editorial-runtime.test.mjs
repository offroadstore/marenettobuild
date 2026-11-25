import test from 'node:test';
import assert from 'node:assert/strict';
import { render, editions } from '../dist/server/entry-server.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';

const content = (title, language, body = '<p>Testo attivo.</p>') => ({
  title, summary:'Sommario attivo', body, category:'Test', tags:[], image:'', imageAlt:'',
  sources:[], seoTitle:title, seoDescription:'Descrizione attiva', contentLanguage:language,
});
const article = (locale) => ({
  identity:'synthetic-runtime', locale, path:`${locale==='it'?'':`/${locale}`}/synthetic-runtime`,
  kind:'article', revisionId:`active-${locale}`, content:content(({it:'Articolo italiano sintetico', ar:'مقال عربي اصطناعي', ru:'Тестовая статья'})[locale],locale,'<h1>Titolo interno</h1><p>Corpo attivo.</p>'),
});

test('initial HTML renders the selected exact active revision, including Unicode aliases and one H1', async () => {
  const live={...article('ru'),aliases:['/ru/проверка']};
  const result=await render(encodeURI(live.aliases[0]),'ru',[live]);
  assert.match(result.body,/data-active-revision="active-ru"/);
  assert.ok(result.body.includes(live.content.title));
  assert.equal((result.body.match(/<h1(?:\s|>)/g)??[]).length,1);
  assert.match(result.body,/lang="ru"/);
});

test('an edited archive page lists the Russian active article rather than the Italian revision', async () => {
  const archive={identity:'articles',locale:'ru',path:'/ru/articles',kind:'page',revisionId:'archive-active',content:content('Архив','ru')};
  const result=await render('/ru/articles','ru',[article('it'),article('ru'),archive]);
  assert.match(result.body,/data-active-revision="archive-active"/);
  assert.match(result.body,/data-testid="active-article-listing"/);
  assert.ok(result.body.includes(article('ru').content.title));
  assert.ok(!result.body.includes(article('it').content.title));
  assert.ok(result.body.includes('/ru/synthetic-runtime'));
});

test('an active revision cannot publish a blocked-language URL', async () => {
  // Arabic is now public. Exercise an actually blocked locale, not an old release list.
  const live={...article('ru'),locale:'he',path:'/he/synthetic-runtime',content:content('Articolo sintetico bloccato','he')};
  const result=await render(live.path,live.locale,[live]);
  assert.ok(!result.body.includes(live.content.title));
  assert.doesNotMatch(result.body,/data-active-revision=/);
  // The HTTP boundary serves the generated 404; a blocked renderer can stay pending.
  const topology=await editorialTopology({snapshot:[live]});
  try {
    const response=await fetch(topology.origin+live.path);
    assert.equal(response.status,404);
    assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
    assert.doesNotMatch(await response.text(),/data-active-revision=/);
  } finally {await topology.close();}
});

test('a withdrawn existing article never falls back to its static public body', async () => {
  const existing=editions.find(e=>e.kind==='article'&&e.locale==='it');
  assert.ok(existing);
  const withdrawn={...article('it'),identity:existing.id,path:existing.path,revisionId:'withdrawn',content:content('Contenuto ritirato','it','')};
  const result=await render(existing.path,'it',[withdrawn]);
  assert.ok(!result.body.includes('data-active-revision='));
  assert.match(result.body,/404/);
});
