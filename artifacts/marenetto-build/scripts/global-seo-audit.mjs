import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { editorialTopology } from './test-support/editorial-topology.mjs';
import { PUBLIC_ORIGIN } from './public-release.mjs';

export const decode = value => String(value ?? '').replace(/&#(?:x([a-f0-9]+)|(\d+));/gi, (_, hex, dec) => String.fromCodePoint(parseInt(hex ?? dec, hex ? 16 : 10)))
  .replaceAll('&nbsp;', ' ').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&apos;', "'")
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
export const plain = html => decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
export const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m => [m[1], decode(m[2] ?? m[3])]));
const count = value => [...value.normalize('NFC')].length;
const digest = value => createHash('sha256').update(value).digest('hex');
export function inspect(html, edition) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
  const content = main.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>|<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '');
  const text = plain(content);
  const headings = [...content.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m => ({level:Number(m[1]), text:plain(m[2])}));
  const meta = Object.fromEntries([...html.matchAll(/<meta\b[^>]*>/gi)].map(m => attributes(m[0])).map(a => [a.name ?? a.property, a.content]));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => attributes(m[0]));
  const images = [...content.matchAll(/<img\b[^>]*>/gi)].map(m => attributes(m[0]));
  const issues = [];
  const graph = [];
  for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@context'] !== 'https://schema.org') issues.push('context');
      graph.push(...(data['@graph'] ?? [data]));
    } catch { issues.push('syntax'); }
  }
  // The existing network models actual direct work/coordination in a Service catalog.
  // These valid types do not imply a Product, price or an Atelier commercial offer.
  const allowed = new Set(['GeneralContractor','Organization','WebSite','BreadcrumbList','Service','FAQPage','Article','WebPage','Place','City','Country','AdministrativeArea','PostalAddress','ListItem','Question','Answer','OfferCatalog','Offer','BusinessAudience']);
  const ids = new Set(graph.map(n => n['@id']).filter(Boolean));
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node['@type'] && !allowed.has(node['@type'])) issues.push('type:' + node['@type']);
    for (const [key,value] of Object.entries(node)) {
      if (['url','image','item','mainEntityOfPage','@id'].includes(key) && typeof value === 'string') {
        try { if (!['https:','http:'].includes(new URL(value).protocol)) issues.push('url:' + key); } catch { issues.push('url:' + key); }
      }
      if (key === '@id' && Object.keys(node).length === 1 && value.startsWith(PUBLIC_ORIGIN) && !ids.has(value) &&
        value !== PUBLIC_ORIGIN + edition.path) issues.push('reference:' + value);
      if (typeof value === 'object') Array.isArray(value) ? value.forEach(walk) : walk(value);
    }
  }
  graph.forEach(walk);
  for (const faq of graph.filter(n => n['@type'] === 'FAQPage')) for (const q of faq.mainEntity ?? []) {
    if (!text.includes(plain(q.name)) || !text.includes(plain(q.acceptedAnswer?.text ?? ''))) issues.push('faq-not-visible:' + q.name);
  }
  if (edition.kind === 'article' && !graph.some(n => n['@type'] === 'Article')) issues.push('missing-Article');
  const title = plain(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const description = meta.description ?? '';
  return { path:edition.path, locale:edition.locale, id:edition.id, kind:edition.kind, source:edition.source,
    htmlSHA256:digest(html), title, titleCharacters:count(title), titleOutOfRange:count(title)<50 || count(title)>60,
    description, descriptionCharacters:count(description), descriptionOutOfRange:count(description)<140 || count(description)>160,
    canonical:links.find(l=>l.rel==='canonical')?.href, alternates:links.filter(l=>l.hreflang),
    words:[...new Intl.Segmenter(edition.locale,{granularity:'word'}).segment(text)].filter(s=>s.isWordLike).length,
    countedText:text,
    textBlocks:[...content.matchAll(/<(p|li|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m=>plain(m[2])).filter(t=>t.length>=12),
    h1:headings.filter(h=>h.level===1).length, hierarchy:headings.filter((h,i)=>h.level>(headings[i-1]?.level??0)+1),
    headings, images, inadequateAlt:images.filter(i=>i.alt===undefined || (!i.alt && i.role!=='presentation' && i['aria-hidden']!=='true' && !i['data-historical-logo']) || /^(?:image|photo|foto|img)\s*\d*$/i.test(i.alt??'')),
    jsonldIssues:[...new Set(issues)], schemaTypes:graph.map(n=>n['@type']),
    links:[...html.matchAll(/<a\b[^>]*>/gi)].map(m=>attributes(m[0]).href).filter(Boolean),
    og:meta['og:title']===title && meta['og:description']===description && meta['og:url']===PUBLIC_ORIGIN+edition.path,
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const label = process.argv[2] ?? 'after';
  if (!['before','after'].includes(label)) throw new Error('Use before or after');
  const dir = new URL(`../../../generated-artifacts/global-seo/${label}/`, import.meta.url);
  await mkdir(new URL('html/',dir),{recursive:true});
  const manifest = JSON.parse(await readFile(new URL('../dist/public/route-manifest.json',import.meta.url)));
  const saved=process.argv.includes('--saved');
  const previous=saved ? JSON.parse(await readFile(new URL('inventory.json',dir))) : undefined;
  const topology = saved ? undefined : await editorialTopology({ publicIndexing:true });
  const headers = {'x-forwarded-host':'www.marenettobuild.com','x-forwarded-proto':'https'};
  const rows = [], documents = new Map(), targets = new Map();
  try {
    const sitemap = saved ? await readFile(new URL('sitemap.xml',dir),'utf8') : await (await fetch(topology.origin+'/sitemap.xml',{headers})).text();
    await writeFile(new URL('sitemap.xml',dir),sitemap);
    const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(decode(m[1])).pathname);
    for (const path of paths) {
      const response = saved ? undefined : await fetch(topology.origin+path,{headers,redirect:'manual'});
      const html = saved ? await readFile(new URL('html/'+digest(path)+'.html',dir),'utf8') : await response.text();
      const edition = previous?.rows.find(row=>row.path===path) ?? manifest.editions[path];
      if (!edition) throw new Error('Unregistered sitemap page '+path);
      const row = {...inspect(html,edition), status:response?.status??edition.status,
        csp:response ? response.headers.get('content-security-policy')??response.headers.get('content-security-policy-report-only') : edition.csp,
        cspMode:response ? response.headers.has('content-security-policy')?'enforce':'report-only' : edition.cspMode};
      rows.push(row); documents.set(path,html);
      await writeFile(new URL('html/'+digest(path)+'.html',dir),html);
      for (const href of row.links) {
        let url; try { url = new URL(href,PUBLIC_ORIGIN+path); } catch { continue; }
        if (url.origin===PUBLIC_ORIGIN) targets.set(url.pathname+url.search+url.hash,url);
      }
    }
    const checked = previous?.checked ?? {};
    for (const [key,url] of targets) {
      if(saved && checked[key])continue;
      if(saved) {
        const peer=previous.rows.find(row=>row.path===url.pathname);
        if (!peer) {checked[key]={status:null,fragment:null,target:url.pathname,method:'Not measured in baseline snapshot'};continue;}
        const body=await readFile(new URL('html/'+digest(peer.path)+'.html',dir),'utf8');
        checked[key]={status:peer.status,fragment:!url.hash || [...body.matchAll(/\b(?:id|name)="([^"]*)"/g)]
          .some(m=>decode(m[1])===decodeURIComponent(url.hash.slice(1))),target:peer.path,method:'Baseline initial GET snapshot'};
        continue;
      }
      let path = url.pathname, status, fragment=true;
      const visited = new Set();
      for (let hop=0;hop<6;hop++) {
        if (visited.has(path)) {status=508;break;} visited.add(path);
        const response = await fetch(topology.origin+path,{headers,redirect:'manual'});
        status=response.status;
        if ([301,302,307,308].includes(status)) {path=new URL(response.headers.get('location'),PUBLIC_ORIGIN).pathname;continue;}
        if (url.hash && status===200) {
          const body=documents.get(path)??await response.text();
          fragment=[...body.matchAll(/\b(?:id|name)="([^"]*)"/g)].some(m=>decode(m[1])===decodeURIComponent(url.hash.slice(1)));
        }
        break;
      }
      checked[key]={status,fragment,target:path};
    }
    // Common paragraphs/list labels copied across >=35% of a locale's pages
    // are not original editorial depth. Remove them equally before and after.
    for(const locale of new Set(rows.map(r=>r.locale))) {
      const group=rows.filter(r=>r.locale===locale), frequency=new Map();
      for(const row of group) for(const block of new Set(row.textBlocks)) frequency.set(block,(frequency.get(block)??0)+1);
      const common=[...frequency].filter(([,n])=>n>=Math.max(8,Math.ceil(group.length*.35))).map(([s])=>s).sort((a,b)=>b.length-a.length);
      for(const row of group) {
        row.wordsRawMain=row.words;
        row.excludedRepeatedBlocks=common.filter(s=>row.countedText.includes(s));
        let text=row.countedText;
        for(const block of common)text=text.replaceAll(block,' ');
        row.words=[...new Intl.Segmenter(locale,{granularity:'word'}).segment(text)].filter(s=>s.isWordLike).length;
        delete row.countedText;delete row.textBlocks;
      }
    }
    for (const row of rows) {
      row.brokenLinks=row.links.filter(href=>{
        try { const u=new URL(href,PUBLIC_ORIGIN+row.path);const c=checked[u.pathname+u.search+u.hash];return u.origin===PUBLIC_ORIGIN && (!c || c.status>=400 || c.fragment===false); } catch {return true;}
      });
      row.unverifiedLinks=row.links.filter(href=>{
        try {const u=new URL(href,PUBLIC_ORIGIN+row.path);return u.origin===PUBLIC_ORIGIN && checked[u.pathname+u.search+u.hash]?.status===null;}catch{return false;}
      });
      for (const field of ['title','description']) row[field+'Duplicates']=rows.filter(r=>r.path!==row.path && r[field]===row[field]).map(r=>r.path);
      row.hreflangIssues=row.alternates.filter(a=>{
        if(a.hreflang==='x-default')return false;
        const peer=rows.find(r=>PUBLIC_ORIGIN+r.path===a.href);
        return !peer || !peer.alternates.some(b=>b.href===PUBLIC_ORIGIN+row.path);
      });
    }
    const summary=Object.fromEntries(['titleOutOfRange','descriptionOutOfRange','titleDuplicates','descriptionDuplicates','inadequateAlt','hierarchy','jsonldIssues','brokenLinks','unverifiedLinks','hreflangIssues'].map(key=>[key,rows.filter(r=>Array.isArray(r[key])?r[key].length:r[key]).length]));
    summary.h1Errors=rows.filter(r=>r.h1!==1).length;
    const report={at:previous?.at??new Date().toISOString(),revision:previous?.revision??execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
      workingTreeDiffSHA256:previous?.workingTreeDiffSHA256??digest(saved&&label==='before'?'':execFileSync('git',['diff','HEAD'],{encoding:'utf8',maxBuffer:10000000})),
      auditorSHA256:digest(await readFile(new URL(import.meta.url),'utf8')),
      method:'Actual candidate HTTP server; simulated official www host; isolated empty editorial API; no JavaScript. NFC Unicode code points. Intl.Segmenter words inside main excluding nav/footer and blocks repeated on >=35% (minimum eight) pages per locale. HTML snapshots SHA256. No Search Console access or production validation.',
      pages:rows.length,locales:[...new Set(rows.map(r=>r.locale))],summary,rows,checked};
    await writeFile(new URL('inventory.json',dir),JSON.stringify(report,null,2));
    const columns=['path','locale','kind','status','canonical','title','titleCharacters','titleOutOfRange','titleDuplicates','description','descriptionCharacters','descriptionOutOfRange','descriptionDuplicates','words','h1','hierarchy','inadequateAlt','jsonldIssues','brokenLinks','hreflangIssues','htmlSHA256','source'];
    await writeFile(new URL('inventory.csv',dir),'\uFEFF'+[columns.join(','),...rows.map(row=>columns.map(c=>'"'+String(typeof row[c]==='object'?JSON.stringify(row[c]):row[c]??'').replaceAll('"','""')+'"').join(','))].join('\r\n'));
    console.log(JSON.stringify({label,pages:rows.length,locales:report.locales,summary},null,2));
  } finally {await topology?.close();}
}
