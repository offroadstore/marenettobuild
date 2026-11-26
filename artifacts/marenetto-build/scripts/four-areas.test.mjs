import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FOUR_AREA_PAGES, PROJECT_PAGES, areaCopy, articleArea, editions, redirects, render, editionStructuredData, professionalEntryPath } from '../dist/server/entry-server.mjs';
import { inspect, plain, attributes } from './global-seo-audit.mjs';
import { publicEditions, alternateLinks, PUBLIC_ORIGIN } from './public-release.mjs';
import { indexExclusion } from '../src/localization/index-exclusions.mjs';
import { mergeActiveMetadata } from '../src/localization/public-seo.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';

const root = new URL('../dist/public/',import.meta.url);
const manifest = JSON.parse(await readFile(new URL('route-manifest.json',root)));
const eligible = publicEditions(manifest);
const readPage = async path => readFile(new URL(manifest.pages[path],root),'utf8');
const links = html => [...html.matchAll(/<a\b[^>]*>/g)].map(m=>attributes(m[0]).href);
const normalize = path => path.replace(/\/+$/,'')||'/';

test('integrated professional editions replace Atelier only where public, with a safe withdrawal fallback',async()=>{
  for(const locale of new Set(FOUR_AREA_PAGES.map(p=>p.locale))) {
    const pro=eligible.find(e=>e.id==='professionals'&&e.locale===locale);
    const home=eligible.find(e=>e.id==='home'&&e.locale===locale);
    const atelier=eligible.find(e=>e.id==='atelier'&&e.locale===locale);
    assert.ok(pro&&home&&atelier,locale);
    assert.equal(professionalEntryPath(locale),pro.path);
    const destination=html=>[...html.matchAll(/<a\b[^>]*>/g)].map(m=>attributes(m[0])).find(a=>a['data-testid']==='link-need-1')?.href;
    assert.equal(destination(await readPage(home.path)),pro.path,locale);
    const withdrawn={identity:'professionals',locale,path:pro.path,revisionId:'withdrawn',aliases:[]};
    assert.equal(destination((await render(home.path,locale,[withdrawn])).body),atelier.path,locale+' withdrawn');
    assert.ok(!eligible.some(e=>e.id==='professional-downloads'&&e.locale===locale));
  }
});

test('exactly four complete, unique editions in each of thirteen locales',async()=>{
  assert.equal(FOUR_AREA_PAGES.length,52);
  assert.equal(new Set(FOUR_AREA_PAGES.map(p=>p.path)).size,52);
  for (const locale of new Set(FOUR_AREA_PAGES.map(p=>p.locale))) {
    assert.equal(FOUR_AREA_PAGES.filter(p=>p.locale===locale).length,4);
    const copy = areaCopy(locale);
    assert.ok(copy.ui.request && copy.ui.about);
    for (const page of FOUR_AREA_PAGES.filter(p=>p.locale===locale)) {
      const bar=[...(await readPage(page.path)).matchAll(/<div\b[^>]*>/g)].map(m=>attributes(m[0])).find(a=>a['data-testid']==='mobile-contact-bar');
      assert.equal(bar?.['data-hidden'],'true',page.path+' must not promote phone/email instead of the assessment');
      assert.equal(bar?.['aria-hidden'],'true');
      const edition = editions.find(e=>e.path===page.path);
      assert.ok(eligible.some(e=>e.path===page.path),page.path);
      const html = await readPage(page.path);
      const row = inspect(html,edition);
      assert.equal(row.h1,1,page.path);
      assert.ok(!row.titleOutOfRange,page.path+' title: '+row.title);
      assert.ok(!row.descriptionOutOfRange,page.path+' description');
      assert.deepEqual(row.hierarchy,[],page.path);
      assert.deepEqual(row.inadequateAlt,[],page.path);
      assert.deepEqual(row.jsonldIssues,[],page.path);
      assert.ok(row.schemaTypes.includes('Service'),page.path);
      assert.equal(row.schemaTypes.filter(t=>t==='BreadcrumbList').length,1,page.path);
      assert.ok(row.og,page.path);
      const text = copy.areas[page.area];
      assert.ok(text.offer.length>=3 && text.process.length>=3 && text.faq.length>=3,page.path);
      for (const [heading,body] of [...text.offer,...text.process,...text.faq]) {
        assert.ok(plain(html).includes(heading),page.path+' missing '+heading);
        assert.ok(plain(html).includes(body),page.path+' missing body');
      }
      const alts = alternateLinks(edition,eligible);
      assert.equal(alts.length,14,page.path);
      assert.equal(alts.filter(a=>a.lang==='x-default').length,1,page.path);
      for(const alternate of alts.filter(a=>a.lang!=='x-default')) {
        const peer=eligible.find(e=>e.path===alternate.path);
        assert.ok(alternateLinks(peer,eligible).some(a=>a.path===page.path),page.path+' reciprocity');
      }
    }
  }
});

test('public historical, reviewed and Arabic article identities have exactly one local pillar',()=>{
  const requiredLocales = new Set(FOUR_AREA_PAGES.map(p=>p.locale));
  const articles=editions.filter(e=>e.kind==='article'&&requiredLocales.has(e.locale));
  assert.ok(articles.length>=140);
  for(const article of articles) {
    const area=articleArea(article.id);
    assert.ok(area,article.id);
    const pillar=FOUR_AREA_PAGES.find(p=>p.locale===article.locale&&p.area===area);
    assert.ok(pillar,article.path);
    const graph=editionStructuredData(article,PUBLIC_ORIGIN);
    const crumbs=graph.filter(n=>n['@type']==='BreadcrumbList');
    assert.equal(crumbs.length,1,article.path);
    assert.equal(crumbs[0].itemListElement[1].item,PUBLIC_ORIGIN+pillar.path,article.path);
  }
});

test('projects stay hidden and noindex; tag archives do not become general archive exclusions',async()=>{
  assert.equal(PROJECT_PAGES.length,13);
  for(const page of PROJECT_PAGES) {
    assert.equal(redirects[page.path],undefined,page.path);
    assert.ok(!eligible.some(e=>e.path===page.path),page.path);
    const html=await readPage(page.path);
    assert.match(html,/name="robots" content="noindex, nofollow"/,page.path);
    assert.equal(inspect(html,page).images.length,0,page.path);
    const home=editions.find(e=>e.locale===page.locale&&e.id==='home');
    assert.ok(!links(await readPage(home.path)).some(p=>normalize(p.split(/[?#]/)[0])===page.path),page.path);
  }
  const tags=editions.filter(e=>indexExclusion(e)?.startsWith('Archivio tag'));
  assert.equal(tags.length,28);
  for(const tag of tags) assert.ok(!eligible.some(e=>e.path===tag.path),tag.path);
  assert.ok(eligible.some(e=>e.id==='articles'&&e.locale==='it'));
});

test('nonindex public search and preparatory pages also respect blocking metadata bounds',async()=>{
  for(const entry of editions.filter(e=>['search','projects','professional-downloads'].includes(e.id)&&FOUR_AREA_PAGES.some(p=>p.locale===e.locale))) {
    const row=inspect(await readPage(entry.path),entry);
    assert.equal(row.titleOutOfRange,false,entry.path+' title');
    assert.equal(row.descriptionOutOfRange,false,entry.path+' description');
  }
});

test('production HTTP agrees with the index policy, with noindex preview and fail-closed editorial state',async()=>{
  const topology=await editorialTopology({publicIndexing:true});
  const headers={'x-forwarded-host':'www.marenettobuild.com','x-forwarded-proto':'https'};
  try {
    const sitemap=await(await fetch(topology.origin+'/sitemap.xml',{headers})).text();
    for(const page of FOUR_AREA_PAGES) {
      const response=await fetch(topology.origin+page.path,{headers});
      assert.equal(response.status,200,page.path);
      const html=await response.text();
      assert.match(html,/name="robots" content="index, follow"/,page.path);
      assert.ok(sitemap.includes(PUBLIC_ORIGIN+page.path),page.path);
      const alternates=[...html.matchAll(/<link\b[^>]*hreflang[^>]*>/g)];
      assert.equal(alternates.length,14,page.path);
      const preview=await fetch(topology.origin+page.path);
      assert.match(await preview.text(),/name="robots" content="noindex, nofollow"/,page.path);
    }
    for(const page of editions.filter(indexExclusion)) {
      const response=await fetch(topology.origin+page.path,{headers});
      assert.equal(response.status,200,page.path);
      const html=await response.text();
      assert.match(html,/name="robots" content="noindex, nofollow"/,page.path);
      assert.ok(!html.includes('hreflang='),page.path);
      assert.ok(!sitemap.includes('<loc>'+PUBLIC_ORIGIN+page.path+'</loc>'),page.path);
      const slash=page.path.endsWith('/')?page.path.slice(0,-1):page.path+'/';
      const alias=await fetch(topology.origin+slash,{headers,redirect:'manual'});
      assert.ok([200,308].includes(alias.status),slash);
    }
    topology.setMode('http_status');
    await topology.restart();
    const response=await fetch(topology.origin+FOUR_AREA_PAGES[0].path,{headers});
    assert.equal(response.status,503);
    assert.match(await response.text(),/noindex/);
  } finally {await topology.close();}
});

test('known active revisions keep their article body and strategic breadcrumb',async()=>{
  const article=editions.find(e=>e.kind==='article'&&e.locale==='it');
  const active={identity:article.id,locale:'it',path:article.path,kind:'article',revisionId:'four-area-synthetic',
    content:{title:'Titolo di verifica',summary:'Sintesi',body:'<p data-original-body="">Testo della revisione attiva.</p>',category:'Test',
      tags:[],image:'',imageAlt:'',sources:[],seoTitle:'Titolo di verifica',seoDescription:'Sintesi',contentLanguage:'it'}};
  const result=await render(active.path,'it',[active]);
  assert.ok(result.body.includes('Testo della revisione attiva.'));
  const pillar=FOUR_AREA_PAGES.find(p=>p.locale==='it'&&p.area===articleArea(article.id));
  assert.ok(links(result.body).includes(pillar.path));
  const clientEdition=mergeActiveMetadata([article],[active])[0];
  const clientGraph=editionStructuredData(clientEdition,PUBLIC_ORIGIN);
  assert.equal(clientGraph.find(n=>n['@type']==='BreadcrumbList').itemListElement[2].name,active.content.title);
  assert.equal(result.structuredData.find(n=>n['@type']==='BreadcrumbList').itemListElement[2].name,active.content.title);
  const arabic=editions.find(e=>e.kind==='article'&&e.locale==='ar'&&!e.id.startsWith('network-'));
  const arabicRevision={...active,identity:arabic.id,locale:'ar',path:arabic.path,
    content:{...active.content,title:'عنوان المراجعة التجريبية',contentLanguage:'ar',
      image:'/media/articles/piscine-e-laghetti-zen.jpg'}};
  const arabicRender=await render(arabic.path,'ar',[arabicRevision]);
  const arabicClient=editionStructuredData(mergeActiveMetadata([arabic],[arabicRevision])[0],PUBLIC_ORIGIN);
  for(const graph of [arabicRender.structuredData,arabicClient]) {
    assert.equal(graph.filter(n=>n['@type']==='FAQPage').length,0,'Do not attach invisible static FAQs to a live revision');
    assert.equal(graph.find(n=>n['@type']==='Article').headline,arabicRevision.content.title);
    assert.equal(graph.find(n=>n['@type']==='Article').image,PUBLIC_ORIGIN+arabicRevision.content.image);
  }
});
