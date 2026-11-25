import {readFile,writeFile,mkdir} from 'node:fs/promises';
const directory=new URL('../../../generated-artifacts/deliveries/',import.meta.url);
await mkdir(directory,{recursive:true});
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const [source,output] of [['FASE_3_SERVIZI_2026-11-25.md','fase-3-servizi.html'],['FASE_4_PRIVACY_IA_2026-11-25.md','fase-4-privacy-ia.html']]) {
  const text=await readFile(new URL('../../../docs/production-readiness/'+source,import.meta.url),'utf8');
  const title=text.split('\n')[0].replace(/^# /,'');
  let body='',paragraph=[];
  const flush=()=>{if(paragraph.length){body+='<p>'+escape(paragraph.join(' ')).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>')+'</p>';paragraph=[];}};
  for(const line of text.split('\n')) {
    if(/^#{1,3} /.test(line)) {flush();const level=line.match(/^#+/)[0].length;body+=`<h${level}>${escape(line.replace(/^#+ /,''))}</h${level}>`;}
    else if(!line.trim())flush();
    else if(line.startsWith('|')) {flush();body+=`<pre>${escape(line)}</pre>`;}
    else paragraph.push(line);
  }
  flush();
  await writeFile(new URL(output,directory),`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(title)}</title><style>body{margin:0;background:#f4f5f3;color:#243b45;font:17px/1.65 system-ui,sans-serif}main{max-width:920px;margin:auto;padding:3rem 1.5rem;background:white}h1{font-size:2.2rem;line-height:1.2}h2{margin-top:2.5rem;border-top:2px solid #345867;padding-top:1rem;font-size:1.4rem}p{white-space:pre-line}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.7 ui-monospace,monospace;margin:0;background:#f1f4f4}code{font-size:.85em;overflow-wrap:anywhere}strong{color:#142f3b}@media print{main{max-width:none;padding:0}body{font-size:11pt}}</style><main>${body}</main></html>`);
}
console.log('Rapporti autonomi HTML generati; nessuna pubblicazione.');
