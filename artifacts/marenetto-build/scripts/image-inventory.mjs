import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=new URL('../dist/public/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('route-manifest.json',root),'utf8'));
const locales=new Set(['it','en','de','fr','es','nl','pt','pl','ru','sv','no','da']);
const assets=new Map();
const decode=value=>value.replaceAll('&amp;','&');
function add(url,occurrence){
  if(!url || url.startsWith('data:')) return;
  url=decode(url);
  const googleMark=/\/images\/google-maps-attribution\.svg$/.test(url);
  const record=assets.get(url)??{
    url, category:/\/media\/home\/approved-hero-/.test(url)?'ai-generated':/\/media\/home\/cefalu-hero-/.test(url)?'ai-edited':/\/brand\/|\/favicon/.test(url)||googleMark?'brand':'uncertain',
    provenance:/\/media\/home\/approved-hero-/.test(url)?'Owner-supplied AI illustration; ordinary derivatives are not further AI generation':/\/media\/home\/cefalu-hero-/.test(url)?'Owner-supplied AI illustration plus documented localized AI retouch':'Historical use or existing asset only; not proof of authorship or authenticity',
    evidence:/\/media\/home\/(?:cefalu-hero|approved-hero)-/.test(url)?'public/media/home/README.md; original and patch retained':'src/content/historical-media.json and public/media/articles/manifest.json where mapped; no independent authenticity proof',
    rights:'Rights and releases not independently verified; owner confirmation required',
    action:/\/brand\/|\/favicon/.test(url)?'Preserve approved brand; not a portfolio reference':'Retain visible localized disclosure; do not use as completed-work evidence; verify rights',
    occurrences:[],
  };
  if(googleMark) {
    record.provenance='Google Maps attribution mark supplied with the server-only reviews feature, not a company photograph';
    record.evidence='docs/production-readiness/GOOGLE_PLACES_REVIEWS.md; src/components/home/GoogleReviews.tsx';
    record.rights='Provider attribution use under Google Maps terms; not a general-purpose image license or portfolio evidence';
    record.action='Preserve attribution mark and required provider links; do not label as company work';
  }
  record.occurrences.push(occurrence);
  assets.set(url,record);
}
for(const [route,file] of Object.entries(manifest.pages)) {
  const edition=manifest.editions[route];
  if(!edition||!locales.has(edition.locale)||route.startsWith('/__')) continue;
  const html=await readFile(new URL(file,root),'utf8');
  let order=0;
  for(const match of html.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    order++;
    const tag=match[0], occurrence={path:route,locale:edition.locale,kind:'image',order};
    const src=tag.match(/\bsrc="([^"]+)"/)?.[1];
    if(src)add(src,{...occurrence,labelledLogo:tag.includes('data-historical-logo')});
    for(const variant of tag.match(/\bsrcSet="([^"]+)"/i)?.[1]?.split(',')??[]) add(variant.trim().split(/\s+/)[0],{...occurrence,kind:'responsive-source'});
  }
  for(const match of html.matchAll(/<meta\b[^>]*(?:property="og:image"|name="twitter:image")[^>]*content="([^"]+)"/g))add(match[1],{path:route,locale:edition.locale,kind:'social-preview'});
  for(const match of html.matchAll(/(?:background(?:-image)?)[^;{}]*?url\(["']?([^"')]+)["']?\)/gi))add(match[1],{path:route,locale:edition.locale,kind:'background'});
}
for(const file of await readdir(new URL('assets/',root))) {
  if(!file.endsWith('.css')) continue;
  const css=await readFile(new URL('assets/'+file,root),'utf8');
  for(const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if(/\.(?:svg|png|jpe?g|gif|webp|avif)(?:[?#].*)?$/i.test(match[1])) add(match[1],{path:'/assets/'+file,locale:'shared',kind:'stylesheet-background'});
  }
}
// Include stored image assets with no current occurrence, not only visible IMG.
for(const file of await readdir(new URL('../public/',import.meta.url),{recursive:true})) {
  if(/\.(png|jpe?g|webp|avif|gif|svg)$/i.test(file)) {
    const url='/'+file.split(path.sep).join('/');
    if(!assets.has(url))add(url,{path:null,locale:null,kind:'stored-unused'});
  }
}
const rows=[...assets.values()];
const dir=new URL('../../../generated-artifacts/privacy/',import.meta.url);
await mkdir(dir,{recursive:true});
await writeFile(new URL('image-inventory.json',dir),JSON.stringify({scope:'Candidate generated HTML, all 12 languages; not production or private-session evidence',date:'2026-11-23',assets:rows},null,2));
const columns=['url','category','provenance','rights','evidence','action','occurrences'];
await writeFile(new URL('image-inventory.csv',dir),[columns.join(','),...rows.map(row=>columns.map(k=>`"${(typeof row[k]==='string'?row[k]:JSON.stringify(row[k])).replaceAll('"','""')}"`).join(','))].join('\n'));
console.log(JSON.stringify({assets:rows.length,aiGenerated:rows.filter(r=>r.category==='ai-generated').length,aiEdited:rows.filter(r=>r.category==='ai-edited').length,uncertain:rows.filter(r=>r.category==='uncertain').length,occurrences:rows.reduce((n,r)=>n+r.occurrences.length,0)}));
