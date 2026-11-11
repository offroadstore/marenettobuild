// Development-only synthetic fixture. Never changes operational approval flags.
import pg from 'pg';
import { randomUUID, createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const file=path.resolve(import.meta.dirname,'../../../generated-artifacts/editorial/runtime-fixture.json');
const command=process.argv[2];
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try {
  if (!process.env.DATABASE_URL || process.env.NODE_ENV === 'production') throw new Error('Solo verifica sintetica nel database di sviluppo.');
  if(command==='seed') {
    const identity=`synthetic-editorial-runtime-${randomUUID()}`;
    const rows=[];
    for(const locale of ['it','ar']) {
      const id=randomUUID(), revId=randomUUID();
      const content={title:locale==='it'?'Prova sintetica italiana':'اختبار تحريري اصطناعي',summary:'Runtime synthetic check',body:`<p>${identity}-${locale}-ACTIVE</p>`,category:'Prova sintetica',tags:[],image:'',imageAlt:'',sources:[],seoTitle:`SEO-${identity}-${locale}`,seoDescription:'Synthetic runtime SEO',contentLanguage:locale};
      const hash=createHash('sha256').update(JSON.stringify(content)).digest('hex');
      const revision={id:revId,content,hash,sourceHash:hash,actor:'synthetic-test',createdAt:new Date().toISOString()};
      const draft={...revision,id:randomUUID(),content:{...content,title:`PRIVATE-DRAFT-${identity}`,body:`<p>PRIVATE-DRAFT-${identity}</p>`}};
      const publicPath=`${locale==='it'?'':`/${locale}`}/${identity}`;
      const aliases=[`${locale==='it'?'':`/${locale}`}/${identity}-alias`];
      const data={state:'draft',historical:false,correction:false,activeRevisionId:revId,aliases,revisions:[revision,draft],events:[],originals:[]};
      await pool.query('INSERT INTO editorial_editions(id,identity,locale,path,kind,version,data) VALUES($1,$2,$3,$4,$5,2,$6)',[id,identity,locale,publicPath,'article',data]);
      rows.push({id,locale,path:publicPath,aliases,revId,content});
    }
    await mkdir(path.dirname(file),{recursive:true}); await writeFile(file,JSON.stringify({identity,rows}));
    console.log('Fixture sintetica IT/AR preparata; nessuna approvazione operativa modificata.');
  } else {
    const fixture=JSON.parse(await readFile(file,'utf8'));
    if(command==='cleanup') {
      await pool.query('DELETE FROM editorial_editions WHERE identity=$1 AND id=ANY($2::text[])',[fixture.identity,fixture.rows.map(row=>row.id)]);
      await unlink(file); console.log('Fixture sintetica rimossa.');
    } else if(command==='check') {
      const origin=process.argv[3] || 'http://localhost:80';
      const apiOrigin='http://localhost:80';
      const active=await (await fetch(`${apiOrigin}/api/editorial/active`)).json();
      for(const row of fixture.rows) {
        const selected=active.find(e=>e.path===row.path);
        assert.equal(selected.revisionId,row.revId);
        assert.equal(selected.content.title,row.content.title);
        for(const address of [row.path,...row.aliases]) {
          const response=await fetch(`${origin}${address}`);
          const html=await response.text();
          assert.equal(response.status,200,address);
          assert.ok(html.includes(`data-active-revision="${row.revId}"`),address);
          assert.ok(html.includes(`${fixture.identity}-${row.locale}-ACTIVE`),address);
          assert.ok(html.includes(row.content.seoTitle),address);
          assert.ok(!html.includes(`PRIVATE-DRAFT-${fixture.identity}`),address);
          assert.equal((html.match(/<h1(?:\s|>)/g)??[]).length,1,address);
          assert.match(html,/<html[^>]*dir="ltr"/);
          if(row.locale==='ar') assert.match(html,/class="site-shell"[^>]*dir="rtl"/);
          assert.match(html,/name="robots" content="noindex, nofollow"/);
          assert.ok(!html.includes('hreflang="ar"'));
        }
      }
      const archive=await(await fetch(`${origin}/articoli`)).text();
      const search=await(await fetch(`${origin}/ricerca`)).text();
      for(const html of [archive,search]) {
        assert.ok(html.includes(fixture.rows[0].content.title));
        assert.ok(html.includes(fixture.rows[0].path));
        assert.ok(!html.includes(`PRIVATE-DRAFT-${fixture.identity}`));
      }
      const rtlArchive=await(await fetch(`${origin}/ar/articles`)).text();
      assert.ok(rtlArchive.includes(fixture.rows[1].content.title), 'Arabic archive must use the Arabic active revision, not the Italian context');
      assert.ok(rtlArchive.includes(fixture.rows[1].path));
      assert.ok(!rtlArchive.includes(`PRIVATE-DRAFT-${fixture.identity}`));
      const sitemap=await(await fetch(`${origin}/sitemap.xml`)).text();
      assert.ok(!sitemap.includes(fixture.identity));
      assert.equal((await fetch(`${apiOrigin}/api/internal/editorial`)).status,401);
      console.log('Runtime verificato: IT/AR, alias, revisione/SEO HTML, archivi, ricerca, isolamento bozze, noindex e accesso riservato.');
    } else throw new Error('Usare seed, check o cleanup.');
  }
} finally {await pool.end();}
