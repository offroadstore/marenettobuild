import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { PUBLIC_ROBOTS, ROBOT_AGENTS, ROBOT_EXCLUSIONS } from './public-release.mjs';
import { llmsDocument } from './llms-document.mjs';
process.env.NODE_ENV = 'production';
const vite = await createServer({configFile:new URL('../vite.config.ts',import.meta.url).pathname,optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom'});
after(()=>vite.close());
test('each named crawler repeats every private/demo/review exclusion',()=>{
  const groups=PUBLIC_ROBOTS.split(/\n\n+/);
  for(const agent of ROBOT_AGENTS) {
    const group=groups.find(g=>g.startsWith(`User-agent: ${agent}\n`));
    assert.ok(group,agent);
    for(const path of ROBOT_EXCLUSIONS) assert.ok(group.includes(`Disallow: ${path}\n` )||group.endsWith(`Disallow: ${path}`),`${agent}: ${path}`);
  }
});
test('13 service editions SSR complete FAQ and match Service/FAQ schema without products',async()=>{
  const {render, editions, editionStructuredData}=await vite.ssrLoadModule('/src/entry-server.tsx');
  const {SERVICE_LOCALES,serviceCopy,offerPath}=await vite.ssrLoadModule('/src/content/service-offers.ts');
  for(const locale of SERVICE_LOCALES) for(const kind of ['premium','local']) {
    const path=offerPath(locale,kind), edition=editions.find(e=>e.path===path);
    const {body}=await render(path,locale);
    assert.equal((body.match(/<main\b/g)||[]).length,1,path);
    assert.equal((body.match(/<h1\b/g)||[]).length,1,path);
    assert.ok(body.includes(`page-service-${kind}`),path);
    assert.ok(body.includes(serviceCopy[locale].scope.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;')),path);
    assert.match(edition.approval,locale==='ar'?/Owner instruction to publish Arabic/:/Owner authorization: index all public pages/);
    assert.equal(edition.sitemap,true);
    const graph=editionStructuredData(edition,'https://www.marenettobuild.com');
    const service=graph.find(g=>g['@type']==='Service');
    assert.equal(service.areaServed.name==='Worldwide',kind==='premium');
    assert.ok(!graph.some(g=>['Product','Offer','Review','AggregateRating'].includes(g['@type'])));
    if(kind==='premium') {
      const faq=graph.find(g=>g['@type']==='FAQPage');
      assert.equal(faq.mainEntity.length,4);
      for(const [i,[q,a]] of serviceCopy[locale].faq.entries()) {
        assert.equal(faq.mainEntity[i].name,q);assert.equal(faq.mainEntity[i].acceptedAnswer.text,a);
        assert.ok(body.includes(a.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;')),`${path} FAQ ${i}`);
      }
    }
  }
});
test('geography separates municipalities, settlements, boundary cases and outside estimates',async()=>{
  const {areaResearch,areaStatus,areaKm}=await vite.ssrLoadModule('/src/config/service-area.ts');
  assert.equal(areaResearch.length,33);
  for(const name of ['Petralia Sottana','Petralia Soprana','Gangi','Alimena','Bompietro','Campofelice di Fitalia']) assert.equal(areaStatus(areaResearch.find(r=>r.name===name)),'historical-distance-not-a-service-boundary');
  assert.equal(areaResearch.find(r=>r.name==='Castel di Tusa').kind,'frazione');
  assert.equal(areaKm(areaResearch.find(r=>r.name==='Petralia Sottana')),58.6);
});
test('llms links are provided only from the filtered release inventory',()=>{
  const org={name:'Marenetto Build',legalName:'Marenetto s.r.l. unipersonale',email:'info@marenetto.com',telephone:'+393339363007',address:{streetAddress:'confirmed address',postalCode:'90015',addressLocality:'Cefalù'}};
  const text=llmsDocument(org,[{locale:'it',id:'home',path:'/',title:'Home'},{locale:'en',id:'legal-privacy',path:'/en/privacy',title:'Privacy notice'}],'https://www.marenettobuild.com');
  assert.ok(text.includes('mainly within about 60 km'));assert.ok(text.includes('Projects beyond'));assert.ok(text.includes('not a strict service boundary'));
  assert.ok(text.includes('kitchens'));assert.ok(text.includes('shipped or installed worldwide'));
  assert.ok(text.includes('https://www.marenettobuild.com/en/privacy'));
  assert.ok(!text.includes('/internal'));assert.ok(!text.includes('/__localization-review'));
  assert.ok(!text.includes('pending owner confirmation'));
  assert.ok(text.includes('Marenetto s.r.l. unipersonale'));
});
