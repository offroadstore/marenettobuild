/** One-time vendoring of the existing typefaces; never called by the browser. */
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const families = 'family=Barlow:wght@400;500;600;700&family=Gilda+Display&family=Manrope:wght@400..800&family=Newsreader:opsz,wght@6..72,400..500&family=Noto+Sans:wght@400..800&family=Noto+Serif:wght@400..700';
const url = `https://fonts.googleapis.com/css2?${families}&display=swap`;
const response = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}});
if(!response.ok) throw new Error(`Font stylesheet ${response.status}`);
let css = await response.text();
const dir = new URL('../public/fonts/',import.meta.url);
await mkdir(dir,{recursive:true});
for(const file of await readdir(dir)) if(/^[a-f0-9]{20}\.woff2$/.test(file)) await unlink(new URL(file,dir));
let bytes=0;
for(const source of new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m=>m[1]))) {
  const asset=await fetch(source);
  if(!asset.ok) throw new Error(`Font download ${asset.status}`);
  const buffer=Buffer.from(await asset.arrayBuffer());
  const name=createHash('sha256').update(buffer).digest('hex').slice(0,20)+'.woff2';
  await writeFile(new URL(name,dir),buffer);
  css=css.replaceAll(source,'./'+name);
  bytes+=buffer.length;
}
await writeFile(new URL('fonts.css',dir),css);
for(const family of ['barlow','gildadisplay','manrope','newsreader','notosans','notoserif']) {
  const license=await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`);
  if(!license.ok) throw new Error(`Missing ${family} license`);
  await writeFile(new URL(`${family}-OFL.txt`,dir),await license.text());
}
console.log(`Vendored font bytes: ${bytes}. Browser CSS has no remote font URLs.`);
