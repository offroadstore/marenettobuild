// A private, disposable read-only preview of the actually activated test rows.
// Never included in a production service command or public route.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {editorialTopology} from './test-support/editorial-topology.mjs';
const out=path.resolve(import.meta.dirname,'../../../generated-artifacts/editorial/release-2026-11');
const snapshot=JSON.parse(await readFile(path.join(out,'candidate-active.json'),'utf8'));
if(snapshot.length!==290)throw new Error('Complete isolated activation receipt including the preserved series required');
// Read only already-authorized public derivatives from the development media
// endpoint. Never proxy arbitrary URLs, private originals or editorial data.
const manifest=JSON.parse(await readFile(new URL('../../api-server/content/network-media.json',import.meta.url),'utf8'));
const names=new Set(snapshot.map(e=>e.content.image).filter(p=>p?.startsWith('/api/network-media/')).map(p=>p.split('/').at(-1)));
for(const name of Object.keys(manifest.assets))if(name.startsWith('network-'))names.add(name);
const publicAssets=new Map(),mediaEvidence=[];
for(const name of names) {
  const expected=manifest.assets[name];if(!expected)throw new Error('Unknown illustrative derivative');
  const response=await fetch('http://127.0.0.1:8080/api/network-media/'+name,{redirect:'error'});
  if(!response.ok)throw new Error('Authorized development illustration unavailable');
  const bytes=Buffer.from(await response.arrayBuffer()),sha256=createHash('sha256').update(bytes).digest('hex');
  if(sha256!==expected.sha256||bytes.length!==expected.bytes||response.headers.get('content-type')!==expected.contentType)throw new Error('Illustration differs from authorized manifest');
  const publicPath='/api/network-media/'+name;
  publicAssets.set(publicPath,{bytes,sha256,contentType:expected.contentType});
  mediaEvidence.push({path:publicPath,sha256,bytes:bytes.length,contentType:expected.contentType,developmentStatus:response.status});
}
const topology=await editorialTopology({snapshot,publicIndexing:false,publicAssets});
for(const asset of mediaEvidence) {
  const response=await fetch(topology.origin+asset.path);
  if(!response.ok||createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex')!==asset.sha256)throw new Error('Private preview media transport failed');
}
await writeFile(path.join(out,'merge-media-recovery.json'),JSON.stringify({scope:'Test-only illustration transport; actual app endpoint returned 200 before this fix',verified:true,assets:mediaEvidence,privatePreview:topology.origin},null,2));
await writeFile(path.join(out,'preview.json'),JSON.stringify({origin:topology.origin,environment:'isolated read-only test snapshot'}));
console.log('CANDIDATE_URL='+topology.origin);
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await topology.close();process.exit(0);});
