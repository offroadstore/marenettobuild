import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

// Explicit URL: capture the real routed preview, not a parallel local server.
const url = new URL(process.argv[2]);
const root = path.resolve(import.meta.dirname, '..');
const output = path.resolve(root, '../../generated-artifacts/cefalu-panorama');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/repl/tools/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const evidence = [];
try {
  for (const [width, height, deviceScaleFactor] of [[1440, 1000, 1], [390, 844, 2]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor, locale: 'it-IT' });
    const page = await context.newPage();
    await page.goto(url.href);
    await page.locator('.mbh-hero img').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      const img = document.querySelector('.mbh-hero img');
      return img.complete && img.naturalWidth > 0 && img.currentSrc.includes('cefalu-hero-geography-');
    });
    const state = await page.locator('.mbh-hero img').evaluate(img => ({
      currentSrc: img.currentSrc, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
    }));
    if (state.currentSrc.includes('-mobile-') !== (width < 700)) throw new Error('Wrong responsive family');
    const file = path.basename(new URL(state.currentSrc).pathname);
    const response = await context.request.get(state.currentSrc);
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    if (!response.ok() || hash(await response.body()) !== hash(readFileSync(path.join(root, 'public/media/home', file)))) {
      throw new Error('Preview is serving different bytes from the corrected image');
    }
    evidence.push({ width, height, deviceScaleFactor, ...state, sha256: hash(await response.body()) });
    for (const [family, label] of [['cefalu-hero-geography', 'after'], ['cefalu-hero', 'before']]) {
      await page.locator('.mbh-hero picture').evaluate((picture, family) => {
        for (const node of picture.querySelectorAll('source,img')) for (const attr of ['src', 'srcset']) {
          const value = node.getAttribute(attr);
          if (value) node.setAttribute(attr, value.replaceAll(/cefalu-hero(?:-geography)?/g, family));
        }
      }, family);
      await page.waitForFunction(family => {
        const img = document.querySelector('.mbh-hero img');
        return img.complete && img.naturalWidth > 0 &&
          img.currentSrc.includes('-geography-') === family.includes('-geography');
      }, family);
      await page.screenshot({ path: path.join(output, `preview-${label}-${width}.png`) });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
writeFileSync(path.join(output, 'preview-sources.json'), JSON.stringify({ url: url.href, evidence }, null, 2));
for (const [label, family] of [['before', 'cefalu-hero'], ['after', 'cefalu-hero-geography']]) {
  execFileSync('magick', [path.join(root, `public/media/home/${family}-1672.jpg`),
    '-crop', '650x240+320+440', '+repage', path.join(output, `detail-${label}.png`)]);
}
const image = file => `data:image/png;base64,${readFileSync(path.join(output, file)).toString('base64')}`;
const figure = (file, caption, cls = '') => `<figure class="${cls}"><figcaption>${caption}</figcaption><img src="${image(file)}" alt="${caption}"></figure>`;
writeFileSync(path.join(output, 'confronto-panorama.html'), `<!doctype html>
<html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cefalù: confronto della revisione del panorama</title>
<style>body{font:16px/1.5 system-ui,sans-serif;color:#243f4d;max-width:1480px;margin:32px auto;padding:0 20px;background:#f6f7f7}h1{font-size:30px}h2{margin-top:42px}figure{margin:16px 0;background:white;padding:12px}figcaption{font-weight:650;padding:0 0 10px}img{display:block;max-width:100%;height:auto}.details{overflow:auto}.details img{max-width:none;width:1300px}.mobile{display:flex;gap:20px;flex-wrap:wrap}.mobile figure{width:390px}.note{border-left:3px solid #9b7057;padding-left:18px}</style>
<h1>Correzione del panorama di Cefalù</h1>
<p class="note">Revisione in anteprima, in attesa della tua conferma visiva. Nessuna pubblicazione autorizzata.
Immagine illustrativa IA: non fotografia reale né prova di lavori eseguiti.</p>
<p>“Prima” è la precedente revisione effettivamente in uso, non l'originale più antico.
I confronti di pagina mantengono gli stessi viewport, testi, ombre e ritagli.</p>
<h2>Cosa è cambiato</h2><ul>
<li>Rocca: parete calcarea continua più leggibile, pendio superiore verde e sommità rocciosa nella stessa zona della composizione.</li>
<li>Abitato: più file sovrapposte di tetti e fronte mare irregolare di case compatte, al posto degli archi e palazzi ripetitivi.</li>
<li>Duomo: una sola cattedrale a due torri, nell'abitato ai piedi della Rocca, con base schermata dai tetti tra chiesa e mare; non trasferita al lungomare.</li>
<li>Terrazza, casa, ponteggio, ulivo, vegetazione, luce e inquadratura conservati. Nel master lossless, tutti i pixel esterni alla maschera sono identici all'originale.</li></ul>
<h2>Dettaglio del panorama, stesso ritaglio</h2>
<p>Ritaglio nativo 650 × 240, visualizzato al 200% per ispezione; non è un master ad alta risoluzione. Scorri orizzontalmente se necessario.</p>
${figure('detail-before.png', 'Prima — revisione precedente', 'details')}
${figure('detail-after.png', 'Dopo — revisione geografica', 'details')}
<h2>Desktop — viewport 1440 × 1000, DPR 1</h2>
${figure('preview-before-1440.png', 'Prima — stessa pagina e stesso viewport')}
${figure('preview-after-1440.png', 'Dopo — anteprima con panorama corretto')}
<h2>Mobile — viewport 390 × 844, DPR 2</h2><div class="mobile">
${figure('preview-before-390.png', 'Prima — ritaglio mobile precedente')}
${figure('preview-after-390.png', 'Dopo — ritaglio mobile corretto')}</div>
<h2>Verifica e limiti</h2><p>Verificata la sorgente realmente selezionata nell'anteprima e confrontati i suoi byte con il file revisionato per entrambi i viewport.
Tutte le 11 varianti AVIF/WebP/JPEG provengono dallo stesso master. 26 controlli dedicati superati in sviluppo e nell'anteprima della build.
La correzione è illustrativa e geograficamente plausibile, non un rilievo: il riferimento aereo e questa vista bassa obliqua non sono sovrapponibili.
Nessun pixel della fotografia di riferimento è stato riutilizzato. La risoluzione resta 1672 × 941: il limite sugli schermi molto densi rimane.</p>
<p><strong>Da confermare:</strong> naturalezza del panorama e riconoscibilità di Cefalù nel dettaglio e nella vista completa. Il controllo tecnico non sostituisce questa approvazione.</p></html>`);
console.log(JSON.stringify(evidence, null, 2));
console.log(`Comparison saved: ${path.join(output, 'confronto-panorama.html')}`);
