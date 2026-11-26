import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const origin = process.argv[2];
const directory = process.argv[3];
if (!origin || !directory?.startsWith('generated-artifacts/')) throw new Error('Usage: origin generated-artifacts/output');
await mkdir(directory + '/raw', { recursive: true });
const catalog = JSON.parse(await readFile('generated-artifacts/editorial/catalog.json', 'utf8')).seriesDrafts;
// Eighteen recovered source URLs plus six already-published phase2 editions.
// The integrated catalog, not the nine-language source archive, owns all 24.
const historical = catalog.filter(d => [4,7].includes(d.content.guide.episode));
const startedAt = new Date().toISOString();
async function capture(path) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  const body = await response.text();
  const hash = createHash('sha256').update(path).digest('hex');
  const headers = Object.fromEntries(response.headers);
  await writeFile(`${directory}/raw/${hash}.json.gz`, gzipSync(JSON.stringify({ path, at:new Date().toISOString(), status:response.status, headers, body })));
  if (path === catalog[0].path) {
    const snapshot=body.match(/<script type="application\/json" id="editorial-active">([\s\S]*?)<\/script>/);
    if(snapshot)await writeFile(directory+'/observed-active.json',JSON.stringify(JSON.parse(snapshot[1])));
  }
  return {path,status:response.status,robots:body.match(/<meta\b[^>]*name="robots"[^>]*content="([^"]*)"/)?.[1]??'',
    headerRobots:headers['x-robots-tag']??'',canonical:body.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1]??'',
    hreflang:[...body.matchAll(/<link\b[^>]*rel="alternate"[^>]*hreflang="([^"]*)"[^>]*href="([^"]*)"/g)].map(m=>[m[1],m[2]]),
    title:body.match(/<title>([\s\S]*?)<\/title>/)?.[1]??'',raw:`raw/${hash}.json.gz`,
    ...(path==='/sitemap.xml'?{locations:[...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1])}:{})};
}
const sitemap = await capture('/sitemap.xml');
await writeFile(`${directory}/sitemap.json`,JSON.stringify(sitemap,null,2));
const queue=[...new Set(['/robots.txt',...sitemap.locations.map(u=>new URL(u).pathname),...catalog.map(d=>d.path),...historical.map(h=>h.path)])], rows=[];
await Promise.all(Array.from({length:4},async()=>{while(queue.length){const path=queue.shift();try{rows.push(await capture(path));}catch(e){rows.push({path,error:e.message});}}}));
await writeFile(`${directory}/baseline.json`,JSON.stringify({startedAt,finishedAt:new Date().toISOString(),origin,
  revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),historical:historical.map(h=>h.path),sitemapCount:sitemap.locations?.length,rows},null,2));
console.log(JSON.stringify({directory,sitemap:sitemap.locations?.length,editions:rows.length,errors:rows.filter(r=>r.error).length}));
