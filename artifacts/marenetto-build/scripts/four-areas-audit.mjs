import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { inspect, plain, attributes } from './global-seo-audit.mjs';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { publicEditions, PUBLIC_ORIGIN, canonicalRedirect } from './public-release.mjs';
import { indexExclusion } from '../src/localization/index-exclusions.mjs';

// Never overwrite an earlier capture. Baseline collection must precede changes.
// Usage: node scripts/four-areas-audit.mjs before|after|report
const root = new URL('../../../generated-artifacts/four-areas/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('../dist/public/route-manifest.json', import.meta.url)));
const locales = new Set(['it','en','de','fr','nl','es','pt','ru','pl','sv','no','da','ar']);
const hash = text => createHash('sha256').update(text).digest('hex');
const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));
const csv = (rows, columns) => '\uFEFF' + [columns.join(','), ...rows.map(row => columns.map(key => {
  const value = typeof row[key] === 'object' ? JSON.stringify(row[key]) : row[key] ?? '';
  return `"${String(value).replaceAll('"','""')}"`;
}).join(','))].join('\r\n');
const articleBodies = html => [...html.matchAll(/<article\b[^>]*class="[^"]*(?:historical-content|article-body|mbn-body)[^"]*"[^>]*>([\s\S]*?)<\/article>/g)]
  .map(m => m[1].replace(/\sdata-(?:replit-metadata|component-name)="[^"]*"/g, '')
    .replace(/<aside class="fa-pillar-link" data-testid="article-pillar-link">[\s\S]*?<\/aside>/g,'')
    .replace(/(\/@vite\/client|\/src\/[^"'<> ]+\.(?:tsx?|jsx?))\?t=\d+(?=["'])/g, '$1')).join('\n');
export function auditPage(html, edition) {
  const row = inspect(html, edition);
  const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map(m => attributes(m[0]));
  const article = edition.kind==='article' ? articleBodies(html) : '';
  return { ...row, robots: metas.find(m => m.name === 'robots')?.content,
    documentLanguage: attributes(html.match(/<html\b[^>]*>/)?.[0] ?? '').lang,
    direction: attributes(html.match(/<html\b[^>]*>/)?.[0] ?? '').dir,
    structuralPillarPanels:(html.match(/data-testid="article-pillar-link"/g)??[]).length,
    articleBodySHA256: article ? hash(article) : null };
}
const mode = process.argv[2] ?? 'report';
if (mode === 'before' || mode === 'after') {
  const directory = new URL(`${mode}/`, root);
  try { await access(new URL('inventory.json', directory)); throw new Error('Capture already exists; choose a new evidence directory, do not overwrite it.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(new URL('html/', directory), { recursive: true });
  const old = mode === 'after' ? await readJSON(new URL('before/inventory.json', root)) : [];
  const entries = Object.values(manifest.editions).filter(e => locales.has(e.locale));
  const paths = new Map([...old, ...entries].map(e => [e.path, e]));
  const editorialResponse=await fetch(`https://${process.env.REPLIT_DEV_DOMAIN}/api/editorial/active`);
  if(!editorialResponse.ok)throw new Error(`Editorial state unavailable: ${editorialResponse.status}`);
  const snapshot=await editorialResponse.json();
  if(!Array.isArray(snapshot))throw new Error('Invalid editorial snapshot');
  await writeFile(new URL('editorial-active.json',directory),JSON.stringify(snapshot,null,2));
  for(const active of snapshot)if(active.revisionId!=='withdrawn'&&!paths.has(active.path))
    throw new Error(`Active editorial identity requires explicit inventory and area mapping: ${active.path}`);
  const topology = mode === 'after' ? await editorialTopology({snapshot, publicIndexing:true}) : undefined;
  const origin = topology?.origin ?? `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const headers = topology ? {'x-forwarded-host':'www.marenettobuild.com','x-forwarded-proto':'https'} : {};
  const rows = [];
  try {
    for (const entry of paths.values()) {
      const response = await fetch(origin + entry.path, {headers, redirect:'manual'});
      const html = await response.text();
      await writeFile(new URL(`html/${hash(entry.path)}.html`, directory), html);
      rows.push({...entry,status:response.status,location:response.headers.get('location'),
        responseRobots:response.headers.get('x-robots-tag')});
    }
    await writeFile(new URL('sitemap.xml', directory), await (await fetch(origin+'/sitemap.xml',{headers})).text());
    await writeFile(new URL('robots.txt', directory), await (await fetch(origin+'/robots.txt',{headers})).text());
    await writeFile(new URL('inventory.json', directory), JSON.stringify(rows,null,2));
    if (topology) {
      const targets=new Map();
      for (const entry of rows.filter(e=>e.id.startsWith('pillar-')||e.id==='home'||e.kind==='article')) {
        const html=await readFile(new URL(`html/${hash(entry.path)}.html`,directory),'utf8');
        for (const href of auditPage(html,entry).links) {
          let url; try {url=new URL(href,PUBLIC_ORIGIN+entry.path);} catch {continue;}
          if(url.origin!==PUBLIC_ORIGIN)continue;
          const key=url.pathname+url.search+url.hash;
          const target=targets.get(key)??{href:key,sources:[]};
          target.sources.push(entry.path);targets.set(key,target);
        }
      }
      for (const item of targets.values()) {
        let url=new URL(item.href,PUBLIC_ORIGIN);
        item.redirects=[];item.fragment=true;
        for(let hop=0;hop<7;hop++) {
          const response=await fetch(origin+url.pathname+url.search,{headers,redirect:'manual'});
          item.status=response.status;
          if([301,302,307,308].includes(response.status)) {
            item.redirects.push({from:url.pathname,status:response.status,to:response.headers.get('location')});
            const next=new URL(response.headers.get('location'),url);
            if(!next.hash)next.hash=url.hash;
            url=next;continue;
          }
          if(url.hash&&response.status===200) {
            const body=await response.text();
            item.fragment=[...body.matchAll(/\b(?:id|name)="([^"]*)"/g)].some(m=>m[1]===decodeURIComponent(url.hash.slice(1)));
          }
          break;
        }
        item.target=url.pathname;
        console.log(`Link ${item.href}: ${item.status}`);
      }
      await writeFile(new URL('links.json',directory),JSON.stringify([...targets.values()],null,2));
    }
    await writeFile(new URL('revision.json', directory), JSON.stringify({
      revision:execFileSync('git',['rev-parse','HEAD']).toString().trim(),date:new Date().toISOString(),
      method: topology ? 'Candidate production HTTP, official host simulated, captured real editorial snapshot; no mutations, no live emails' : 'Initial development HTTP, preview noindex; raw evidence',
    },null,2));
    console.log(`${mode}: ${rows.length} documents captured`);
  } finally { await topology?.close(); }
} else if (mode === 'report') {
  const collections = {};
  for (const label of ['before','after']) {
    const entries = await readJSON(new URL(`${label}/inventory.json`,root));
    collections[label] = await Promise.all(entries.map(async edition => ({
      ...auditPage(await readFile(new URL(`${label}/html/${hash(edition.path)}.html`,root),'utf8'),edition),
      status:edition.status,location:edition.location,indexExclusion:indexExclusion(edition)??'',
    })));
    await writeFile(new URL(`${label}/audit.json`,root),JSON.stringify(collections[label],null,2));
    await writeFile(new URL(`${label}/audit.csv`,root),csv(collections[label],[
      'path','locale','id','kind','status','canonical','robots','documentLanguage','direction',
      'title','titleCharacters','titleOutOfRange','titleOutsidePreferred','description','descriptionCharacters',
      'descriptionOutOfRange','descriptionOutsidePreferred','h1','hierarchy','inadequateAlt','jsonldIssues','indexExclusion','htmlSHA256','articleBodySHA256','structuralPillarPanels',
    ]));
  }
  const before = new Map(collections.before.map(row => [row.path,row]));
  const exclusionReason=row=>row.indexExclusion||(row.status===200&&/\bnoindex\b/.test(row.robots)
    ? row.id==='search'?'Ricerca interna: pagina di servizio non destinata all’indice'
      : row.id==='professional-downloads'?'Area professionale vuota: materiali non ancora disponibili; esclusione permanente fino a revisione esplicita'
        :'Edizione non pubblicabile secondo inventario e protezioni editoriali':'');
  const exclusions=collections.after.filter(row=>exclusionReason(row)).map(row=>({...row,indexExclusion:exclusionReason(row)}));
  const comparison = collections.after.map(row => {
    const old = before.get(row.path);
    return { path:row.path,locale:row.locale,id:row.id,change:!old
      ? row.id==='projects'?'PREPARATORY_CONTENT_REPLACES_EXISTING_PROJECTS_REDIRECT'
        : row.id.startsWith('pillar-')?'NEW_PILLAR':'PARALLEL_PROFESSIONAL_EDITION_ADDED_DURING_SYNC':'EXISTING',
      beforeStatus:old?.status,afterStatus:row.status,beforeTitle:old?.title,afterTitle:row.title,
      beforeDescription:old?.description,afterDescription:row.description,
      titleChanged:old?old.title!==row.title:null,descriptionChanged:old?old.description!==row.description:null,
      oldArticleBodyPreserved:old?.articleBodySHA256?old.articleBodySHA256===row.articleBodySHA256:null,
      beforeRobots:old?.robots,afterRobots:row.robots,reason:exclusionReason(row) };
  });
  await writeFile(new URL('comparison.csv',root),csv(comparison,Object.keys(comparison[0])));
  const pillars = collections.after.filter(row => row.id.startsWith('pillar-'));
  await writeFile(new URL('pillar-matrix.csv',root),csv(pillars,[
    'locale','id','path','status','title','titleCharacters','description','descriptionCharacters','canonical','h1','schemaTypes','jsonldIssues','inadequateAlt',
  ]));
  const server=await import('../dist/server/entry-server.mjs');
  // A development capture is NOT a production baseline. Reconstruct only
  // the old production metadata policy from its recorded Git revision, keeping
  // this secondary evidence separate from the immutable HTTP capture.
  const baselineRevision=(await readJSON(new URL('before/revision.json',root))).revision;
  if(!/^[a-f0-9]{40}$/.test(baselineRevision))throw new Error('Invalid recorded baseline revision');
  const baselineModules=new Map(),baselineSources=new Map();
  const artifactRoot=new URL('../',import.meta.url);
  const baselineModule=file=>{
    if(baselineModules.has(file))return baselineModules.get(file);
    const source=execFileSync('git',['show',`${baselineRevision}:artifacts/marenetto-build/${file}`]).toString();
    baselineSources.set(file,source);
    const rewritten=file.endsWith('.json')?source:source.replace(/\bfrom\s+(['"])(\.[^'"]+)\1/g,(_,quote,relative)=>{
      const dependency=new URL(relative,new URL(file,artifactRoot));
      if(!dependency.href.startsWith(artifactRoot.href))throw new Error('Unexpected baseline dependency outside artifact');
      return `from ${quote}${baselineModule(dependency.href.slice(artifactRoot.href.length))}${quote}`;
    });
    const url=`data:${file.endsWith('.json')?'application/json':'text/javascript'};base64,`+Buffer.from(rewritten).toString('base64');
    baselineModules.set(file,url);
    return url;
  };
  const oldSeoURL=baselineModule('src/localization/public-seo.mjs');
  const oldPolicy=await import(baselineModule('scripts/public-release.mjs'));
  const oldSeo=await import(oldSeoURL);
  for(const [file,source] of baselineSources) {
    const destination=new URL(`reconstructed-before-policy/${file}`,root);
    await mkdir(new URL('./',destination),{recursive:true});
    await writeFile(destination,source);
  }
  await writeFile(new URL('reconstructed-before-policy/sources.json',root),JSON.stringify({
    revision:baselineRevision,method:'Exact baseline Git source and recursive relative dependencies; reconstruction, not original HTTP',
    sources:[...baselineSources].map(([path,source])=>({path,sha256:hash(source)})),
  },null,2));
  const beforeInventory=await readJSON(new URL('before/inventory.json',root));
  const oldManifest={editions:Object.fromEntries(beforeInventory.map(e=>[e.path,e])),
    pages:Object.fromEntries(beforeInventory.map(e=>[e.path,'captured']))};
  const oldEligible=oldPolicy.publicEditions(oldManifest,[]);
  const currentEligible=publicEditions(manifest,[]);
  const metadataContinuity=[];
  for(const entry of currentEligible) {
    const prior=oldEligible.find(e=>e.path===entry.path);
    if(!prior)continue;
    const rawBefore=await readFile(new URL(`before/html/${hash(prior.path)}.html`,root),'utf8');
    const expected=oldSeo.releaseMetadata(prior,rawBefore,oldEligible);
    const after=collections.after.find(e=>e.path===entry.path);
    metadataContinuity.push({path:entry.path,locale:entry.locale,
      method:'Old production policy reconstructed from recorded revision; not an old production HTTP capture',
      beforeTitle:expected.title,afterTitle:after.title,beforeDescription:expected.description,afterDescription:after.description,
      titleUnchanged:expected.title===after.title,descriptionUnchanged:expected.description===after.description});
  }
  await writeFile(new URL('production-metadata-continuity.csv',root),csv(metadataContinuity,Object.keys(metadataContinuity[0])));
  const classification=collections.after.filter(row=>row.kind==='article').map(row=>{
    const area=server.requireArticleArea(row.id);
    return {identity:server.ARTICLE_AREA[row.id]?row.id:row.id.replace(/^historical:/,'').replace(/^\/+|\/+$/g,''),
      locale:row.locale,path:row.path,area,pillar:server.areaPage(row.locale,area)?.path,
      classification:'EXCLUSIVE',contentLanguage:row.contentLanguage,robots:row.robots};
  });
  await writeFile(new URL('article-area-map.csv',root),csv(classification,Object.keys(classification[0])));
  const links=await readJSON(new URL('after/links.json',root));
  await writeFile(new URL('link-map.csv',root),csv(links,['href','target','status','fragment','redirects','sources']));
  const redirects=Object.entries(manifest.redirects).map(([from,to])=>({from,to,
    change:'Pre-existing redirect retained unless noted in Projects comparison; status verified in link-map when reached'}));
  await writeFile(new URL('redirect-map.csv',root),csv(redirects,['from','to','change']));
  const oldPages=JSON.parse(execFileSync('git',['show',`${baselineRevision}:artifacts/marenetto-build/src/localization/public-pages.json`]));
  const projectRedirects=server.PROJECT_PAGES.map(page=>({from:page.path,
    priorDeclaredTarget:page.locale==='it'?'/servizi':oldPages[page.locale].services.path,
    priorMethod:'Recorded source redirect; no old HTTP Projects capture',
    finalStatus:200,finalTarget:page.path,finalRobots:'noindex, nofollow',
    reason:'Preparatory page expressly requested; no real project materials approved'}));
  await writeFile(new URL('projects-redirect-changes.csv',root),csv(projectRedirects,Object.keys(projectRedirects[0])));
  await writeFile(new URL('index-exclusions.csv',root),csv(exclusions,['path','locale','id','robots','indexExclusion']));
  const knownTransportRedirect=row=>[301,308].includes(row.status)&&row.location===canonicalRedirect({
    url:row.path,headers:{host:'www.marenettobuild.com','x-forwarded-proto':'https'}},manifest,{NODE_ENV:'production'});
  const summary = {
    before:collections.before.length,after:collections.after.length,newPillars:pillars.length,
    locales:[...new Set(pillars.map(p=>p.locale))],
    statusErrors:collections.after.filter(p=>p.status!==200&&!knownTransportRedirect(p)).map(p=>p.path),
    existingTransportRedirects:collections.after.filter(knownTransportRedirect).map(p=>({path:p.path,status:p.status,location:p.location})),
    pillarErrors:pillars.filter(p=>p.h1!==1||p.titleOutOfRange||p.descriptionOutOfRange||p.inadequateAlt.length||p.jsonldIssues.length),
    publicMetadataBlockers:collections.after.filter(p=>p.status===200&&(p.titleOutOfRange||p.descriptionOutOfRange)).map(p=>p.path),
    alteredArticleBodies:comparison.filter(p=>p.oldArticleBodyPreserved===false).map(p=>p.path),
    articleEditionsClassified:classification.length,articleFamiliesClassified:Object.keys(server.ARTICLE_AREA).length,
    existingEligibleProductionMetadataCompared:metadataContinuity.length,
    reconstructedProductionMetadataChanges:metadataContinuity.filter(e=>!e.titleUnchanged||!e.descriptionUnchanged),
    brokenNewPillarLinks:links.filter(l=>(l.status!==200||!l.fragment)&&l.sources.some(path=>pillars.some(p=>p.path===path))),
    linkErrors:links.filter(l=>l.status!==200||!l.fragment),
    exclusions:exclusions.map(p=>({path:p.path,reason:p.indexExclusion})),
    scope:'Before is development preview (noindex), after is production candidate with simulated official host; index flags cannot be compared as an SEO gain. New pillars have no before baseline. Article body comparison removes dev editor attributes data-replit-metadata/data-component-name, Vite numeric cache tokens and the requested new aside.fa-pillar-link structural panel (count recorded per document). Original raw HTML hashes/files and link map remain available. Canonical transport redirects are explicitly recorded, not classified as HTTP failures.',
  };
  await writeFile(new URL('summary.json',root),JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
} else throw new Error('Use before, after or report');
