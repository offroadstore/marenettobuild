import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const evidence = path.join(root, 'artifacts/marenetto-build/reports/revisione-visiva');
const output = path.join(root, 'generated-artifacts/marenetto-home-review');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const views = [
  ['smartphone', 'Smartphone', '390 × 844'],
  ['tablet', 'Tablet verticale', '768 × 1024'],
  ['desktop', 'Desktop', '1440 × 900'],
];
const comparisons = await Promise.all(views.map(async ([key, label, dimensions]) => {
  const pictures = await Promise.all(['prima', 'dopo'].map(async phase => {
    const buffer = await readFile(path.join(evidence, `${phase}-${key}.jpg`));
    return `<figure><figcaption>${phase === 'prima' ? 'Prima' : 'Dopo'}</figcaption><img alt="${phase === 'prima' ? 'Prima' : 'Dopo'}: ${label}, ${dimensions}" src="data:image/jpeg;base64,${buffer.toString('base64')}" width="${dimensions.split(' × ')[0]}" loading="lazy"></figure>`;
  }));
  return `<section><h2>${label} <small>${dimensions} pixel CSS</small></h2><p>Stessa homepage italiana, stessa viewport. I confronti mostrano la prima schermata, non l’intera pagina.</p><div class="pair">${pictures.join('')}</div></section>`;
}));
const notes = await readFile(path.join(evidence, 'CONSEGNA.md'), 'utf8');
const html = `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Marenetto Build — confronto homepage prima/dopo</title><style>
*{box-sizing:border-box}body{margin:0;background:#F7F5F0;color:#252724;font:17px/1.6 system-ui,sans-serif}header{background:#292D29;color:#FAF8F3;padding:48px max(24px,5vw)}h1{font:400 clamp(30px,4vw,48px)/1.15 Georgia,serif;max-width:900px}header p{max-width:800px;color:#FAF8F3}main{max-width:1400px;margin:auto;padding:24px}section{padding:32px 0;border-bottom:1px solid #DCDDD5}h2{font:400 30px/1.25 Georgia,serif}small{display:block;font:400 15px/1.6 system-ui;color:#555B56}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}figure{margin:0;background:#fff;border:1px solid #DCDDD5;border-radius:6px;overflow:hidden}figcaption{padding:12px 16px;font-weight:600;color:#914521}img{display:block;width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:16px/1.65 system-ui,sans-serif;max-width:1000px}.badge{display:inline-block;border:1px solid #DCDDD5;padding:4px 12px;border-radius:4px;font-size:14px}@media(max-width:650px){.pair{grid-template-columns:1fr}header{padding:32px 24px}}@media print{section{break-inside:avoid}header{background:white;color:#252724}header p{color:inherit}}
</style><header><span class="badge">Solo anteprima · Nessuna pubblicazione</span><h1>Marenetto Build<br>Confronto dell’interfaccia</h1><p>Confronti della homepage alle stesse dimensioni, non confronti di interventi edili. Le immagini illustrative non costituiscono prova di lavori eseguiti. Le fotografie reali autorizzate restano da fornire.</p></header><main>${comparisons.join('')}<section><h2>Scelte, verifiche e limiti</h2><pre>${escape(notes)}</pre></section></main></html>`;
await mkdir(output, { recursive: true });
const destination = path.join(output, 'confronto-homepage.html');
await writeFile(destination, html);
console.log(path.relative(root, destination));
