// Read-only capture of existing public image responses for the offline browser.
// Never calls Places, forms, auth, private files, or any paid provider.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const origin=new URL(process.argv[2]);
if(origin.protocol!=='https:'||origin.hostname!=='www.marenettobuild.com')throw new Error('Use the verified WWW public origin explicitly');
const directory='generated-artifacts/global-seo/after';
const inventory=JSON.parse(await readFile(directory+'/inventory.json','utf8'));
const paths=[...new Set(inventory.rows.flatMap(r=>r.images.flatMap(i=>[i.src,
 ...(i.srcSet??i.srcset??'').split(',').map(s=>s.trim().split(/\s+/)[0])])).filter(p=>/^\/api\/(?:network-media|historical-media)\//.test(p)))];
await mkdir(directory+'/resources',{recursive:true});
let cached=[];
try{cached=JSON.parse(await readFile(directory+'/resources/index.json','utf8')).results;}
catch(error){if(error.code!=='ENOENT')throw error;}
const results=[];
for(const path of paths) {
 const previous=cached.find(r=>r.path===path);
 let bytes,type,status;
 if(previous) {
  bytes=await readFile(directory+'/resources/'+previous.file);type=previous.type;status=previous.status;
  if(createHash('sha256').update(bytes).digest('hex')!==previous.sha256)throw new Error(`Cached image changed: ${path}`);
 }else{
  const response=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(30000),redirect:'error'});
  bytes=Buffer.from(await response.arrayBuffer());type=response.headers.get('content-type')??'';status=response.status;
 }
 const file=createHash('sha256').update(path).digest('hex')+'.bin';
 if(status!==200||!type.startsWith('image/'))throw new Error(`Public image ${path}: HTTP ${status}`);
 await sharp(bytes).stats(); // Decode pixels, not just an image content-type/header.
 await writeFile(directory+'/resources/'+file,bytes);
 results.push({path,file,type,status,decoded:true,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile(directory+'/resources/index.json',JSON.stringify({at:new Date().toISOString(),origin:origin.origin,method:'Existing public src AND srcset image bytes; cached immutable checksums verified, missing variants fetched read-only, pixels decoded. Not a publication check or new media.',results},null,2));
console.log(JSON.stringify({publicImages:results.length,failed:0}));
