import { createServer } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

process.env.PORT ||= '4193';
process.env.BASE_PATH ||= '/';
const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(root, '../../generated-artifacts/network');
const previewArgument = process.argv.find(a => a.startsWith('--preview-origin='));
const previewOrigin = previewArgument ? new URL(previewArgument.slice('--preview-origin='.length)).origin : undefined;
await mkdir(out, { recursive: true });
// SSR-only: do not crawl thousands of generated HTML pages for browser deps.
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
async function optionalJSON(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}
try {
  const n = await vite.ssrLoadModule('/src/content/network/index.ts');
  const { networkCMSRecord } = await vite.ssrLoadModule('/src/content/network/cms.ts');
  const { networkStructuredData } = await vite.ssrLoadModule('/src/content/network/schema.ts');
  const { networkSourcesFor } = await vite.ssrLoadModule('/src/content/network/sources.ts');
  const ai = await optionalJSON(path.join(root, 'src/content/network/ai-checks.json'));
  const records = n.NETWORK_PAGES.map(page => {
    const revisionSHA256 = createHash('sha256').update(n.networkRevisionPayload(page)).digest('hex');
    const recorded = ai?.editions.find(e => e.locale === page.locale && e.id === page.id);
    return { ...page, revisionSHA256, aiCheckCurrent: recorded?.contentSHA256 === revisionSHA256,
      indexable: Boolean(n.networkPublic(page)), linguisticReview: recorded?.contentSHA256 === revisionSHA256 ? 'AI-assisted; not native certification' : 'not recorded for current revision', professionalReview: 'not recorded',
      cms: networkCMSRecord(page), schema: networkStructuredData(page, 'https://www.marenettobuild.com') };
  });
  const readiness = await optionalJSON(path.join(root, 'src/content/network/readiness.json'));
  const candidateHTTP = await optionalJSON(path.join(out, 'candidate/http-results.json'));
  const candidateLighthouse = await optionalJSON(path.join(out, 'candidate/lighthouse-coverage.json'));
  const contrastCorrection = await optionalJSON(path.join(out, 'contrast-correction.json'));
  const ready = readiness?.state === 'ready-for-owner-republish' &&
    records.every(r => r.aiCheckCurrent && readiness.editions.some(e => e.id === r.id && e.locale === r.locale && e.sha256 === r.revisionSHA256)) &&
    n.networkImageInventory.every(i => i.review === 'accepted') &&
    candidateHTTP?.results.length === 186 && candidateHTTP.results.every(r => r.status === 200) &&
    candidateLighthouse?.results.length === 28;
  const status = ready ? 'PRONTO PER REPUBLISH' : 'Candidato con controlli finali da concludere';
  await writeFile(path.join(out, 'edition-inventory.json'), JSON.stringify({ generatedAt: new Date().toISOString(), records }, null, 2));
  const image = (await readFile(path.join(out, 'contact-sheet.jpg'))).toString('base64');
  const visualPanels = [];
  for (let i = 1; i <= 9; i++) {
    const panel = await readFile(path.join(out, 'final-visual-review', `panel-${i}.jpg`));
    visualPanels.push(`<details><summary>Pannello ${i} — scene ${4 * (i - 1) + 1}–${Math.min(4 * i, 34)}</summary><p>Immagini illustrative generate con IA, non fotografie di opere dell’impresa.</p><img src="data:image/jpeg;base64,${panel.toString('base64')}" width="2048" height="1152" loading="lazy" alt="Pannello ${i} dell’inventario visivo delle illustrazioni IA"></details>`);
  }
  const matrix = await readFile(path.resolve(root, '../../docs/marketing/rete-professionisti/KEYWORD-PROVENIENZA.md'), 'utf8');
  const http = await optionalJSON(path.join(out, 'http-audit.json'));
  const lighthouse = await optionalJSON(path.join(out, 'lighthouse/coverage.json'));
  const browser = await optionalJSON(path.join(out, 'browser-audit.json'));
  const aiReview = ai ? `<section id="ai-review"><h2>Revisione assistita da IA</h2>
    <p>Autorizzata dal titolare in assenza di allegati esterni. Registrata il ${escape(ai.at)}.
    Copertura: ${records.filter(r => r.aiCheckCurrent).length}/144 revisioni correnti, dodici pagine per lingua, testi condivisi dei servizi, FAQ, metadati e alt.
    Il confronto riguarda anche fedeltà al testo italiano e adattamento degli istituti italiani: non è una certificazione madrelingua né un parere professionale.</p>
    <p>Correzioni: tre riferimenti fuori ambito rimossi da SV/NO/DA; termini FR/RU precisati; 48 alt corretti nelle due riprese perché non descrivessero dettagli o materiali non visibili. Le proposte IA sono state valutate, non applicate automaticamente: mantenute le spiegazioni locali di notaio/geometra/CIN e scartati testo italiano proposto per NL ed equivalenze professionali improprie.</p>
    <p>Tutti i 34 originali osservati in nove pannelli più grandi. Per Comfort e Infissi tutte le sei scene mostrano ambienti finiti. Accettazione editoriale visiva assistita da IA, non approvazione personale del titolare. Questa osservazione non dimostra materiali, impianti nascosti, esecuzione di opere proprie o prestazioni.</p>
    <table><thead><tr><th>Lingua</th><th>Revisioni correnti controllate con IA</th><th>Qualificazione</th></tr></thead><tbody>
    ${n.NETWORK_LOCALES.map(locale => `<tr><td>${escape(locale.toUpperCase())}</td><td>${records.filter(r => r.locale === locale && r.aiCheckCurrent).length}/12</td><td>Controllo IA con correzioni valutate; nessuna certificazione madrelingua</td></tr>`).join('')}</tbody></table>
    <h3>Riscontri documentali aggiuntivi effettivamente consultati</h3>
    <ul>${ai.sourceReceipts.filter(s => s.usableAsEvidence).map(s => `<li><a href="${escape(s.url)}">${escape(s.id)}</a> — ${escape(s.consultedAt)}. Ricevuta SHA-256: <code>${escape(s.receiptSHA256)}</code>.</li>`).join('')}</ul>
    <p>Il riferimento generico Casa del Notariato non ha restituito contenuti sostanziali e non è stato usato come prova: è stata consultata invece la pagina specifica sui controlli. La pagina ministeriale del Molise vale come spiegazione nazionale, non come autorità procedurale siciliana. L’atto NTC è stato letto senza l’intero allegato tecnico. La guida impiantistica è stata letta in due porzioni, senza troncamento finale.</p>
    <h3>Limiti che rimangono espliciti</h3><ul>
      <li>Non risultano pareri tecnici/legali qualificati né certificazioni linguistiche madrelingua. L’IA non li sostituisce.</li>
      <li>Il titolare ha accettato il riferimento al testo coordinato della L.R. 16/2016 alla L.R. 27/2024, vigente al 28 febbraio 2025. Verificato il PDF ufficiale: 23 pagine, HTTP 200 application/pdf. Le modifiche successive non verificate restano nel riquadro localizzato “Da verificare con il tecnico incaricato”, senza bloccare la consegna.</li>
      <li>Il percorso /sites/default/files/ indicato, con e senza WWW, ha restituito HTTP 404. È stata conservata la copia ufficiale funzionante /system/files/, con hash del PDF e intestazione estratta nella ricevuta; la pagina del Dipartimento Urbanistica è stata consultata come riferimento, non spacciata per consolidamento successivo.</li>
      <li>La pagina ARS consultata riporta il testo originario del 2016, non un coordinamento aggiornato. Il supplemento GURS 25/2026 individuato non è stato recuperabile: errore del lettore e timeout HTTP diretto dopo 35 secondi. Non se ne attribuisce alcun contenuto.</li>
      <li>Per il caso concreto restano verifiche su incarichi, abilitazioni, titoli edilizi, vincoli, strutture, ancoraggi, sicurezza del vetro, compatibilità dei materiali, umidità/condensa, impermeabilizzazione, pozzi e acquisto.</li>
      <li>Controlli e immagini hanno evidenza IA dichiarata. Il candidato pronto è distinto dal registro pubblico: l’attivazione richiede il via esplicito del titolare. Nessuna pubblicazione, approvazione umana inventata o notifica ai motori.</li>
    </ul><p>Le impronte delle 144 revisioni sono nel CSV delle revisioni IA. Se cambia una revisione, non viene più conteggiata come verificata dal dossier.</p></section>` : '';
  const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const imageHeaders = ['category', 'scene', 'source', 'responsiveVariants', 'width', 'height', 'sha256', 'generatedAt', 'review', 'reviewEvidence', 'prompt'];
  await writeFile(path.join(out, 'INVENTARIO-IMMAGINI.csv'), '\uFEFF' + [
    imageHeaders.join(','),
    ...n.networkImageInventory.map(i => [i.id, i.n, i.src, i.srcSet, i.width, i.height, i.sha256, i.generatedAt, i.review, i.reviewEvidence, i.prompt].map(cell).join(',')),
  ].join('\r\n'));
  const candidateSection = readiness ? `<section id="release"><h2>${status}</h2>
    <p>Candidato: ${readiness.audit.editorialPages} pagine editoriali e ${readiness.audit.servicePages} edizioni di servizi esistenti. Sono presenti servizi principali e servizi locali nelle dodici lingue, più le due famiglie storiche nelle nove lingue in cui esistono: non sono state inventate ulteriori pagine storiche.</p>
    <p>Nel processo isolato sono state verificate le revisioni, la resa iniziale completa, una H1, metadati, link e anchor, il CMS senza link di anteprima, schema e date reali di revisione, sitemap e hreflang reciproci con x-default, llms.txt senza bozze. Nessuna data di pubblicazione futura è inventata.</p>
    <p>HTTP del candidato: ${candidateHTTP?.results.filter(r => r.status === 200).length ?? 0}/${candidateHTTP?.results.length ?? 0}. Ambiente: fixture temporanea locale dei documenti SSR, non sito pubblico. I moduli JavaScript del client sono rimossi per misurare HTML/CSS iniziali; questo non è un nuovo test di interazione o idratazione.</p>
    ${candidateLighthouse ? `<p>${escape(candidateLighthouse.auditScope)} Viewport: 390×844. Noindex conservato; il punteggio SEO grezzo non viene corretto per nasconderlo. Gli audit non certificano conformità né tutti i 144 URL nel browser.</p><table><thead><tr><th>Pagina e lingua</th><th>Ambiente / URL temporaneo</th><th>SEO</th><th>Accessibilità</th><th>Rilievi</th></tr></thead><tbody>${candidateLighthouse.results.map(r => `<tr><td>${escape(r.locale)} / ${escape(r.id)}</td><td>${escape(r.url)}<br>${escape(r.fetchTime)}<br>Lighthouse ${escape(r.lighthouseVersion)}</td><td>${Math.round(r.seo * 100)}</td><td>${Math.round(r.accessibility * 100)}</td><td>${r.failed.map(f => escape(f.id)).join(', ') || 'Nessuno'}</td></tr>`).join('')}</tbody></table>` : '<p>Audit finali non ancora completati.</p>'}
    ${contrastCorrection ? `<p>Correzione puntuale successiva al rilievo: il testo dell’invito al contatto aveva contrasto 4,38:1. La regola corrente ${escape(contrastCorrection.selector)} usa ${escape(contrastCorrection.foreground)} su ${escape(contrastCorrection.background)}, con rapporto ${contrastCorrection.ratio.toFixed(2)}:1 verificato con il calcolo della luminanza relativa (soglia 4,5:1). I punteggi grezzi sopra restano quelli degli audit effettivi: non sono stati riscritti o presentati come nuove esecuzioni.</p>` : ''}
    <h3>Attivazione separata dalla disponibilità al Republish</h3>
    <p>Avvisi runtime osservati: un 502 editoriale transitorio durante il riavvio, poi richieste editoriali e immagini HTTP 200. Avvisi MaxListenersExceededWarning sui flussi media storici e della rete: causa non accertata, nessuna perdita di memoria dichiarata come provata, nessun errore visibile nella schermata mobile finale. Segnalazione da approfondire senza sopprimerla.</p>
    <p>Successivamente agli audit Lighthouse sono stati conciliati gli aggiornamenti condivisi SEO e gestione immobili, conservando entrambe le funzionalità. Rieseguiti con esito positivo build e protezione degli asset, TypeScript web, rete 9/9, SEO 39/39, i18n 9/9 e verifica non distruttiva delle 144 impronte di attivazione. I 28 audit Lighthouse restano quelli datati sopra, non sono presentati come nuove esecuzioni dopo la sincronizzazione.</p>
    <p>Il registro pubblico resta inattivo: una normale build o pubblicazione di altre modifiche non attiva la sezione. Dopo il via esplicito del titolare si ricontrollano le impronte e si prepara l’attivazione, poi il titolare esegue Republish. Il comando di attivazione non è stato eseguito.</p>
    </section>` : '';
  await writeFile(path.join(out, 'FONTI-E-LIMITI.csv'), '\uFEFF' + [
    ['article', 'title', 'url', 'consultedAt', 'status', 'scopeAndLimits'].join(','),
    ...n.NETWORK_IDS.flatMap(id => networkSourcesFor(id).map(s => [id, s.title, s.url, s.checkedAt, s.status, s.scope].map(cell).join(','))),
  ].join('\r\n'));
  const verification = `<section id="checks"><h2>Controlli effettivi del candidato</h2>
    <p>Build superata. Rieseguiti nella consegna finale: rete 9/9 (144 edizioni SSR, impronte e isolamento delle approvazioni), SEO 39/39, localizzazione 9/9, servizi/privacy 10/10 e CMS 7/7: 74 test passati. Passato anche TypeScript dell’intero workspace. Verifiche HTTP/browser/Lighthouse iniziali sotto riportate sono conservate come prove precedenti, distinte dagli audit finali del candidato.</p>
    <p>Risolto il caricamento della pagina servizi rumena: le lingue esterne alla nuova sezione non devono cercare un catalogo rete inesistente. Sistemato anche l’avvio dei controlli permessi, eseguendo i sette test editoriali con il loro runner dedicato anziché importarli senza preparazione. Le due suite generali precedentemente fallite non sono state cancellate o dichiarate superate retroattivamente.</p>
    <p>Dopo queste correzioni è passato il comando <code>test:permissions</code>, compresi test editoriali e monitoraggio, seguito da <code>check:internal-schema</code>. La correzione rumena è verificata dal test SSR e da una schermata della pagina caricata; non è stata rieseguita l’intera suite browser generale di centinaia di URL.</p>
    <p>Questi controlli verificano struttura, testi presenti, isolamento delle bozze e comportamento software: non attestano qualità madrelingua, pareri professionali o conformità normativa.</p>
    ${browser ? `<p>Percorso browser: <strong>${escape(browser.verdict)}</strong>. Una prova di lettura servizi → pilastro → Comfort → Infissi → richiesta, senza invio di dati. Controllati focus dell’anchor FAQ, immagini caricate, assenza di overflow, ingombro dei contatti, colonne desktop e metadati tedeschi. Copertura dichiarata: non tutti i 144 URL nel browser.</p><details><summary>Rapporto browser originale e limiti</summary><pre lang="en">${escape(browser.text)}</pre></details>` : '<p>Verifica browser non ancora registrata.</p>'}
    ${http ? `<p>HTTP: ${http.results.filter(r => r.passed).length}/${http.results.length} verifiche superate, ambiente ${escape(http.environment)}, ${escape(http.at)}.</p>
      ${http.results.some(r => !r.passed) ? `<ul>${http.results.filter(r => !r.passed).map(r => `<li>${escape(r.label)}: ${escape(r.error)}</li>`).join('')}</ul>` : ''}` : '<p>Controlli HTTP non ancora registrati.</p>'}
    ${lighthouse ? `<p>${escape(lighthouse.auditScope)} Ambiente: ${escape(lighthouse.environment)}</p>
      <p>Le anteprime sono volutamente noindex e il proxy aggiunge esclusioni ai robot: il punteggio SEO grezzo ne risente. Non sono stati rimossi i blocchi per migliorare artificialmente i punteggi.</p>
      <p>Questi sono gli audit iniziali, precedenti alle correzioni del contrasto del riepilogo dell’informativa e dei nomi accessibili del logo e del selettore lingua. I risultati finali sono nella sezione Rilascio; i punteggi originali non sono stati riscritti, arrotondati a 100 o presentati come certificazione.</p>
      <table><thead><tr><th>Lingua / pagina</th><th>Viewport</th><th>SEO</th><th>Accessibilità</th><th>Esito e rilievi</th></tr></thead><tbody>
      ${lighthouse.results.map(r => `<tr><td>${escape(r.locale)} / ${escape(r.id)}<br><small>${escape(r.url)}</small></td><td>390×844 mobile</td><td>${r.seo == null ? '—' : Math.round(r.seo * 100)}</td><td>${r.accessibility == null ? '—' : Math.round(r.accessibility * 100)}</td><td>${escape(r.error ?? r.runtimeError?.message ?? r.failed.map(f => f.id).join(', '))}<br><small>${escape(r.fetchTime ?? '')}; Lighthouse ${escape(r.lighthouseVersion ?? '')}</small></td></tr>`).join('')}
      </tbody></table>` : '<p>Audit Lighthouse non ancora registrati.</p>'}</section>`;
  const blocks = n.NETWORK_LOCALES.map(locale => {
    const c = n.networkCopy(locale);
    return `<section id="${locale}"><h2>${locale.toUpperCase()} — ${escape(c.nav)}</h2>
    <h3>Aggiornamento servizi — testo candidato</h3><div lang="${locale}"><h4>${escape(c.directHeading)}</h4><p>${escape(c.direct)}</p><h4>${escape(c.coordinatedHeading)}</h4><p>${escape(c.coordinated)}</p><p>${escape(c.scope)}</p></div>
    ${records.filter(r => r.locale === locale).map(r => `<details id="${locale}-${r.id}" lang="${locale}"><summary>${escape(c.articles[r.id].title)}</summary>
    <p class="meta">URL candidato: ${escape(r.path)} · Non pubblico · SHA-256 ${r.revisionSHA256}</p>
    <p><strong>Title:</strong> ${escape(r.title)}<br><strong>Description:</strong> ${escape(r.description)}</p>
    ${previewOrigin ? `<p><a href="${escape(new URL(n.networkPreviewPath(locale, r.id), previewOrigin).href)}" target="_blank" rel="noopener noreferrer">Apri l’anteprima dal vivo — ${escape(locale.toUpperCase())}</a></p>` : ''}
    ${r.cms.content.body
      .replace(/<figure>[\s\S]*?<\/figure>/g, figure => `<p class="meta">${escape(figure.match(/alt="([^"]*)"/)?.[1] ?? '')} · ${escape(c.illustration)}</p>`)
      .replace(/\bid="([^"]+)"/g, (_all, id) => `id="${locale}-${r.id}-${id}"`)
      .replace(/href="\/__network-review\/([a-z]{2})\/([a-z]+)"/g, 'href="#$1-$2"')}
    </details>`).join('')}</section>`;
  }).join('');
  const html = `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow">
  <title>Rete di professionisti — dossier del candidato</title><style>
  *{box-sizing:border-box}body{margin:0;color:#172c36;background:#f6f1e8;font:17px/1.65 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:40px 22px}h1,h2,h3,h4{line-height:1.2;color:#123d50}h1{font-size:38px}h2{margin-top:56px}details{background:#fffaf2;border-block:1px solid #b8aa94;padding:18px;margin:12px 0}summary{cursor:pointer;font-size:20px;font-weight:600}a{color:#154f6a;overflow-wrap:anywhere}a:focus-visible,summary:focus-visible{outline:3px solid #154f6a;outline-offset:4px}.meta{font-size:13px;overflow-wrap:anywhere}.warning{padding:20px;border-left:5px solid #9a462a;background:#f8e2d4}img{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px}nav{display:flex;flex-wrap:wrap;gap:18px}section{scroll-margin:20px}table{border-collapse:collapse;table-layout:fixed;width:100%;font-size:12px}th,td{text-align:left;vertical-align:top;border:1px solid #b8aa94;padding:7px;overflow-wrap:anywhere}th:first-child{width:35%}</style>
  <main><h1>La nostra rete di professionisti</h1><p>Dossier di lavoro — ${records.length} edizioni, ${n.NETWORK_LOCALES.length} lingue, 34 scene illustrative.</p>
  <p class="warning"><strong>${status}.</strong> ${records.filter(r => r.aiCheckCurrent).length}/144 revisioni correnti controllate con IA, senza simulare pareri professionali o certificazioni madrelingua. Riferimento regionale vigente al 28 febbraio 2025, con limite successivo accettato dal titolare e riquadro nelle dodici lingue. Candidato verificato, attivazione pubblica non eseguita. Nessuna pubblicazione o notifica ai motori.</p>
  <nav>${n.NETWORK_LOCALES.map(l => `<a href="#${l}">${l.toUpperCase()}</a>`).join('')}<a href="#keyword">Keyword</a><a href="#images">Immagini</a><a href="#ai-review">Revisione IA</a><a href="#release">Rilascio</a><a href="#checks">Controlli</a></nav>
  <section id="images"><h2>Inventario visivo</h2><p>34 scene differenti. Ordine: pilastro; tre scene per ciascuno degli undici approfondimenti nell’ordine del piano. Originali IA, non opere proprie. Nessuna approvazione del titolare è simulata.</p><img src="data:image/jpeg;base64,${image}" width="1280" height="1620" alt="Provino delle 34 scene illustrative generate con IA">
  ${visualPanels.join('')}
  ${n.networkImageInventory.map(i => `<details><summary>${escape(i.id)} — scena ${i.n + 1}</summary><p>Origine: generata con IA. ${i.width}×${i.height}, varianti WebP in App Storage. Generata: ${escape(i.generatedAt)}. Stato: ${escape(i.review)}.</p><p class="meta">SHA-256: ${escape(i.sha256)}<br>${escape(i.srcSet)}</p><pre lang="en">${escape(i.prompt)}</pre></details>`).join('')}</section>
  ${blocks}<section id="keyword"><h2>Matrice keyword e provenienza</h2><pre>${escape(matrix)}</pre></section>${aiReview}${candidateSection}${verification}</main></html>`;
  await writeFile(path.join(out, 'DOSSIER-RETE.html'), html);
  await writeFile(path.join(out, 'ai-review/REVISIONE-IA.html'), `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rete di professionisti — revisione assistita da IA</title><style>body{max-width:1000px;margin:32px auto;padding:0 20px;font:17px/1.6 system-ui;color:#302a23;background:#faf7f1}table{border-collapse:collapse;width:100%}th,td{padding:8px;text-align:left;border:1px solid #b5a995}li,code{overflow-wrap:anywhere}code{font-size:12px}</style><main><h1>Rete di professionisti — controllo assistito da IA</h1><p>${status}. Candidato non attivato. Nessuna pubblicazione.</p>${aiReview}</main></html>`);
  console.log(`${status}: ${records.length} candidate editions; ${records.filter(r => r.indexable).length} actual public editions.`);
} finally { await vite.close(); }
