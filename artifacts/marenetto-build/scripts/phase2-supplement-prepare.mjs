import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const inventory = await read('src/content/historical/index.json');
const manifest = await read('dist/public/route-manifest.json');
const italian = { ...await read('src/content/historical/it.json'), ...await read('src/content/historical-editorial/it.json') };
const paths = [
  '/en/renovate-without-demolition-the-complete-guide-to-microverlayr-isoplam-microcement/',
  '/nl/bouwbedrijf-in-cefalu-wij-brengen-jouw-visie-tot-leven/',
  '/nl/isoplam-buitenvloeren-uitgebreide-gids-voor-gestempeld-beton-en-skyconcrete/',
  '/es/empresa-constructora-en-cefalu-convertimos-tu-vision-en-realidad/',
  '/es/reformar-sin-derribar-la-guia-completa-del-microcemento-microverlayr-isoplam/',
  '/pt/pavimentos-externos-isoplam-guia-completo-de-concreto-estampado-e-skyconcrete/',
  '/pt/reformar-sem-demolir-o-guia-completo-do-microcimento-microverlayr-isoplam/',
  '/pt/trabalhos-em-pedra-e-fachadas/',
];
const result = [];
for (const url of paths) {
  const page = inventory.find(p => p.path === url);
  const documents = { ...await read(`src/content/historical/${page.locale}.json`), ...await read(`src/content/historical-editorial/${page.locale}.json`) };
  const document = documents[page.key];
  let i = 0;
  const nodes = [];
  document.html.replace(/>([^<]+)</g, (_, text) => {
    if (/[A-Za-zÀ-ž]/.test(text) && text.trim().length >= 4) nodes.push({ id: `n${i++}`, text });
    return _;
  });
  result.push({ page, edition: manifest.editions[url], document, nodes, italian: italian[page.family],
    italianPath: inventory.find(p => p.locale === 'it' && p.family === page.family).path });
}
await writeFile(path.resolve(root, '../../generated-artifacts/phase2/supplement-input.json'), JSON.stringify(result, null, 2));
console.log(`Prepared ${result.length} mixed historical editions for targeted corrections.`);
