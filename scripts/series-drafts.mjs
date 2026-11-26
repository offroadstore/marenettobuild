import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { seriesLabels } from '../artifacts/marenetto-build/src/content/series-public.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dossier = path.join(root, 'docs/editorial/costruire-cefalu-madonie');
const json = async name => JSON.parse(await readFile(path.join(dossier, name), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const common = {
  it: ['Approfondire il caso concreto', 'Il quadro edilizio è il D.P.R. 380/2001 come recepito dalla L.R. Sicilia 16/2016 e successive modifiche: vigenza e applicabilità devono essere controllate per l’intervento e la localizzazione.', 'Lavoriamo principalmente entro circa 60 km da Cefalù, Madonie e costa; oltre, solo su richiesta. La guida non estende l’area dei cantieri.', 'Per i servizi edili locali', 'Per gli arredi su misura', 'Contatto', 'Questa guida offre orientamento generale e non è una perizia, un’autorizzazione o un preventivo.'],
  en: ['Assess the specific case', 'The building framework is D.P.R. 380/2001 as received through Sicily’s L.R. 16/2016 and subsequent amendments. Current validity and applicability must be checked for the work and location.', 'Our building work focuses mainly on the area within about 60 km of Cefalù, the Madonie and coast; beyond this, on request. This guide does not extend site coverage.', 'Local building services', 'Bespoke furniture', 'Contact', 'This guide provides general orientation, not a professional survey, permission or quotation.'],
  de: ['Den konkreten Fall prüfen', 'Der baurechtliche Rahmen ist der D.P.R. 380/2001, wie durch die sizilianische L.R. 16/2016 und spätere Änderungen übernommen. Geltung und Anwendbarkeit sind für Vorhaben und Standort zu prüfen.', 'Bauleistungen erfolgen hauptsächlich im Umkreis von etwa 60 km um Cefalù, in den Madonie und an der Küste; darüber hinaus auf Anfrage. Die Anleitung erweitert das Baustellengebiet nicht.', 'Örtliche Bauleistungen', 'Maßgefertigte Möbel', 'Kontakt', 'Diese Anleitung dient der allgemeinen Orientierung, nicht als Gutachten, Genehmigung oder Angebot.'],
  nl: ['Beoordeel het concrete geval', 'Het bouwrechtelijke kader is D.P.R. 380/2001 zoals overgenomen via L.R. Sicilia 16/2016 en latere wijzigingen. Geldigheid en toepasselijkheid moeten voor werk en locatie worden gecontroleerd.', 'Onze bouwactiviteiten liggen voornamelijk binnen circa 60 km van Cefalù, in de Madonie en langs de kust; daarbuiten op aanvraag. Deze gids vergroot het werkgebied niet.', 'Lokale bouwdiensten', 'Maatwerkmeubels', 'Contact', 'Deze gids biedt algemene oriëntatie, geen keuring, vergunning of offerte.'],
  fr: ['Examiner le cas concret', 'Le cadre du bâtiment est le D.P.R. 380/2001 tel que reçu par la L.R. Sicilia 16/2016 et ses modifications. Vigueur et applicabilité doivent être contrôlées pour les travaux et le lieu.', 'Nos travaux se concentrent principalement dans un rayon d’environ 60 km autour de Cefalù, dans les Madonie et sur la côte ; au-delà, sur demande. Cette guide n’étend pas la zone des chantiers.', 'Services de bâtiment locaux', 'Mobilier sur mesure', 'Contact', 'Ce guide apporte une orientation générale, non une expertise, une autorisation ou un devis.'],
  es: ['Evaluar el caso concreto', 'El marco constructivo es el D.P.R. 380/2001 recibido mediante la L.R. Sicilia 16/2016 y sus modificaciones. Vigencia y aplicación deben comprobarse para la intervención y el lugar.', 'Trabajamos principalmente en un radio de unos 60 km de Cefalù, las Madonie y la costa; más lejos, bajo solicitud. Esta guía no amplía la zona de obras.', 'Servicios de construcción locales', 'Mobiliario a medida', 'Contacto', 'Esta guía ofrece orientación general, no un peritaje, una autorización ni un presupuesto.'],
  pt: ['Avaliar o caso concreto', 'O enquadramento é o D.P.R. 380/2001 recebido pela L.R. Sicilia 16/2016 e alterações posteriores. Vigência e aplicação devem ser verificadas para a intervenção e o local.', 'Trabalhamos principalmente num raio de cerca de 60 km de Cefalù, Madonie e costa; além disso, mediante pedido. A orientação não alarga a área de obras.', 'Serviços de construção locais', 'Mobiliário por medida', 'Contacto', 'Este guia oferece orientação geral, não uma perícia, autorização ou orçamento.'],
  pl: ['Oceń konkretny przypadek', 'Podstawą jest D.P.R. 380/2001 przyjęty przez L.R. Sicilia 16/2016 i późniejsze zmiany. Aktualność i zastosowanie trzeba sprawdzić dla prac i lokalizacji.', 'Prace budowlane wykonujemy głównie w promieniu około 60 km od Cefalù, w Madonie i na wybrzeżu; dalej na zapytanie. Poradnik nie rozszerza obszaru budów.', 'Lokalne usługi budowlane', 'Meble na wymiar', 'Kontakt', 'Poradnik ma charakter ogólny i nie jest ekspertyzą, pozwoleniem ani wyceną.'],
  ru: ['Оценить конкретный случай', 'Основа строительного регулирования — D.P.R. 380/2001, принятый через L.R. Sicilia 16/2016 и последующие изменения. Актуальность и применимость проверяются для работ и места.', 'Строительные работы выполняются главным образом примерно в пределах 60 км от Чефалу, в Мадоние и на побережье; дальше — по запросу. Статья не расширяет территорию строек.', 'Местные строительные услуги', 'Мебель на заказ', 'Контакт', 'Статья даёт общие ориентиры, а не экспертизу, разрешение или сметное предложение.'],
  sv: ['Bedöm det enskilda fallet', 'Byggramverket är D.P.R. 380/2001 såsom införlivat genom L.R. Sicilia 16/2016 och senare ändringar. Giltighet och tillämpning måste kontrolleras för arbete och läge.', 'Vi arbetar främst inom cirka 60 km från Cefalù, i Madonie och längs kusten; längre bort på förfrågan. Guiden utvidgar inte byggområdet.', 'Lokala byggtjänster', 'Måttbeställda möbler', 'Kontakt', 'Guiden ger allmän vägledning, inte ett besiktningsutlåtande, tillstånd eller offert.'],
  no: ['Vurder det konkrete tilfellet', 'Byggeregelverket er D.P.R. 380/2001 som innført gjennom L.R. Sicilia 16/2016 og senere endringer. Gyldighet og anvendelse må kontrolleres for arbeid og plassering.', 'Vi arbeider hovedsakelig innen omtrent 60 km fra Cefalù, i Madonie og langs kysten; lenger unna på forespørsel. Guiden utvider ikke byggeområdet.', 'Lokale byggetjenester', 'Skreddersydde møbler', 'Kontakt', 'Guiden gir generell veiledning, ikke en tilstandsrapport, tillatelse eller et pristilbud.'],
  da: ['Vurdér det konkrete tilfælde', 'Byggereglerne er D.P.R. 380/2001 som indført gennem L.R. Sicilia 16/2016 og senere ændringer. Gyldighed og anvendelse skal kontrolleres for arbejde og placering.', 'Vi arbejder primært inden for cirka 60 km fra Cefalù, i Madonie og langs kysten; længere væk på forespørgsel. Guiden udvider ikke byggeområdet.', 'Lokale byggeydelser', 'Møbler efter mål', 'Kontakt', 'Guiden giver generel vejledning, ikke en tilstandsrapport, tilladelse eller et tilbud.'],
};
const official = {
  region: {title:'Regione Siciliana — L.R. 16/2016, testo coordinato al 28/02/2025',url:'https://www.regione.sicilia.it/system/files/2025-04/lr%2016_2016%20agg%2028%20feb%202025.pdf'},
  prg: {title:'Comune di Cefalù — NTA PRG, adeguate al DRU 85/2025',url:'https://comune.cefalu.pa.it/wp-content/uploads/2026/03/NORME-PRG-CORRETTE.pdf'},
  landscape: {title:'Regione Siciliana — Piano paesaggistico di Palermo, avviso luglio 2026',url:'https://www.regione.sicilia.it/la-regione-informa/norme-tecniche-attuazione-piano-paesaggistico-provincia-palermo'},
  park: {title:'Ente Parco delle Madonie — Regolamenti e modulistica',url:'https://www.parcodellemadonie.it/regolamenti-e-modulistica/'},
  map: {title:'Regione Siciliana SITR — Metadati zonizzazione Parco Madonie',url:'https://www.sitr.regione.sicilia.it/geoportale/it/metadata/details/369'},
  furniture: {title:'Isoplam — Microcemento Microverlay, documentazione del sistema specifico',url:'https://www.isoplam.it/soluzioni/microcemento/'},
  purchase: {title:'Agenzia delle Entrate — L’acquisto della casa',url:'https://www1.agenziaentrate.gov.it/web_app_entrate/guida_acquisto_casa.html/1000'},
};
const sourceKeys = {1:['region','prg','landscape'],2:['region'],3:['region'],4:['purchase','region','prg','landscape'],5:['prg','landscape','region'],6:['park','map','prg','region'],7:['region','prg','landscape'],8:[],9:[],10:['furniture']};

export async function buildSeriesDrafts(catalog = [], context) {
  context ??= JSON.parse(await readFile(path.join(root,'generated-artifacts/editorial/catalog.json'),'utf8')).seriesContext;
  assert.ok(context, 'Export the approved area and notice context first');
  const [series, strategy, conceptual, historical] = await Promise.all([
    json('episode-map.json'), json('keyword-strategy.json'), json('conceptual-keywords.json'),
    readFile(path.join(root,'artifacts/marenetto-build/src/content/historical/index.json'),'utf8').then(JSON.parse),
  ]);
  const texts = new Map(await Promise.all(series.localeOrder.map(async locale => [locale, await json(`drafts/${locale}.json`)])));
  const drafts = [];
  // The requested first delivery is the first 16 entries, before the remaining
  // episode/locale combinations; source Italian always precedes its translations.
  const order = [
    ...[1,4,8,10].flatMap(n => ['it','en','de','nl'].map(locale => [n,locale])),
    ...series.episodeOrder.flatMap(n => series.localeOrder.filter(locale => !([1,4,8,10].includes(n) && ['it','en','de','nl'].includes(locale))).map(locale => [n,locale])),
  ];
  for (const [number, locale] of order) {
    const episode = series.episodes.find(e => e.number === number);
    const copy = texts.get(locale).find(e => e.n === number);
    assert.ok(copy?.title && copy.summary && copy.sections.length >= 2 && copy.faq.length >= 2, `${number}:${locale}`);
    const cluster = strategy.clusters.find(c => c.id === episode.cluster);
    const terms = cluster.keywords[locale] ?? conceptual[cluster.id]?.[locale];
    assert.ok(terms?.length, `Missing documented keyword provenance ${number}:${locale}`);
    const identity = episode.existingFamily?.slice(1) ?? `costruire-cefalu-madonie/${String(number).padStart(2,'0')}`;
    const saved = catalog.find(e => e.identity === identity && e.locale === locale);
    const original = historical.find(e => e.family === episode.existingFamily && e.locale === locale);
    const route = saved?.path ?? original?.path ?? `${locale === 'it' ? '' : `/${locale}`}/costruire-cefalu-madonie/puntata-${number}/`;
    const c = common[locale].map(text => text.replace('Cette guide', 'Ce guide'));
    const presentation = context[locale];
    const areaId = ({4:'investment',5:'outdoors',7:'outdoors',8:'investment',10:'surfaces'})[number] ?? 'villas';
    const area = presentation.areas[areaId];
    const image = presentation.images[({investment:'buying',outdoors:'outdoors',surfaces:'bespoke'})[areaId] ?? 'design'];
    const servicePath = locale === 'it' ? (number === 10 ? '/arredi-su-misura' : '/area-servizi-edili') : `/${locale}/${number === 10 ? 'bespoke-furniture' : 'local-building-area'}`;
    // These exact service routes are asserted against the public inventory by tests.
    const paragraphs = copy.sections.map(([heading, text]) => `<h2>${escape(heading)}</h2><p>${escape(text)}</p>`).join('');
    const contextual = number === 10 ? '' : `<p>${escape(c[1])}</p><p>${escape(c[2])}</p>`;
    const body = paragraphs + `<h2>${escape(c[0])}</h2>${contextual}<p>${escape(c[6])}</p><p><a href="${area.path}">${escape(area.title)}</a> · <a href="${servicePath}">${escape(c[number === 10 ? 4 : 3])}</a> · <a href="mailto:info@marenetto.com">${escape(c[5])}: info@marenetto.com</a></p>`;
    const content = {
      title: copy.title, summary: copy.summary, body, contentLanguage: locale,
      category: seriesLabels[locale][0], tags: ['serie-cefalu-madonie', `puntata-${number}`],
      image: image.src, imageAlt: image.alt, sources: sourceKeys[number].map(key => official[key]),
      seoTitle: `${copy.title} | Marenetto Build`, seoDescription: copy.summary,
      guide: {episode:number, technicalReview:'', sourcesCurrent:false, searchConsoleVerified:false,
        reviewBasis:'ai-assisted-internal',
        documentaryReview:'2026-11-26 — AI-assisted documentary comparison. Regional consolidation valid at 2025-02-28; later changes and case applicability remain explicitly unverified. Internal owner policy; not a professional opinion.',
        editorialReview:'2026-11-26 — AI-assisted editorial check: no fabricated projects, clients, prices, durations, videos or professional sign-off. Internal owner approval for series activation, recorded separately against the content digest.',
        languageReview:`2026-11-26 — AI-assisted ${locale}/IT comparison of themes, FAQ, scope, legal institute names and mandatory closing. No native-speaker or professional translation certification is asserted.`,
        technicalHeading:presentation.notice.heading, technicalNotice:presentation.notice.body,
        reviewDisclosure:presentation.notice.reviewSummary,
        faq:copy.faq.map(([question,answer]) => ({question,answer}))},
    };
    drafts.push({identity,locale,path:route,kind:'article',historical:false,correction:false,content});
  }
  assert.equal(drafts.length, 120);
  assert.equal(new Set(drafts.map(d=>`${d.identity}:${d.locale}`)).size,120);
  return drafts;
}

export async function exportSeriesDossier() {
  // Reuse the same assigned paths as the API catalog, including pre-existing
  // editions beyond the nine historical source locales. Do not invent a second
  // route in the private delivery for a record already present in the CMS.
  const catalog = JSON.parse(await readFile(path.join(root,'generated-artifacts/editorial/catalog.json'),'utf8'));
  const drafts = await buildSeriesDrafts(catalog.records, catalog.seriesContext);
  const out = path.join(root,'generated-artifacts/costruire-cefalu-madonie');
  await mkdir(out,{recursive:true});
  await writeFile(path.join(out,'bozze-cms.json'),JSON.stringify(drafts,null,2));
  const item = d => {
    const g=d.content.guide, label=seriesLabels[d.locale];
    return `<article lang="${d.locale}"><p class="status">APPROVAZIONE INTERNA 26/11/2026 · controllo assistito da IA, non parere professionale · ${d.locale.toUpperCase()} · ${g.episode}/10</p><h2>${escape(d.content.title)}</h2><p>${escape(d.content.summary)}</p><p><code>${escape(d.path)}</code></p>${d.content.body}<aside><h3>${escape(g.technicalHeading)}</h3><p>${escape(g.technicalNotice)}</p><p>${escape(g.reviewDisclosure)}</p></aside><h3>Fonti / Sources</h3><ul>${d.content.sources.map(s=>`<li><a href="${escape(s.url)}">${escape(s.title)}</a></li>`).join('')}</ul><h3>${escape(label[6])}</h3>${g.faq.map(f=>`<h4>${escape(f.question)}</h4><p>${escape(f.answer)}</p>`).join('')}<h3>Video</h3><p>${escape(label[1])}</p><p>${escape(label[7])}</p></article>`;
  };
  const shell = (title, entries) => `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>${escape(title)}</title><style>body{font:17px/1.65 Georgia,serif;color:#282828;max-width:920px;margin:40px auto;padding:0 20px}article{border-top:1px solid #aaa;margin-top:40px;padding-top:25px;break-before:page}h1,h2,h3{line-height:1.25}.status{font:13px/1.5 sans-serif;color:#823b25}code{overflow-wrap:anywhere}a{color:#185b76}@media print{a{color:inherit}}</style><h1>${escape(title)}</h1><p>Consegna aggiornata il 26 novembre 2026. Autore organizzazione: Marenetto Build. Controllo documentale e linguistico assistito da IA con approvazione interna del titolare e attivazione autorizzata. Non è un parere professionale né una certificazione madrelingua. Pubblicazione in produzione non eseguita dall’assistente.</p><p>Riferimento regionale vigente al 28 febbraio 2025, con limiti e modifiche successive da verificare nel caso concreto. Search Console non attestata: le puntate restano escluse dall’indicizzazione fino alla registrazione della verifica separata. Nessun video, trascrizione o diritto inventato; le illustrazioni del sito sono dichiarate e non rappresentano lavori reali.</p>${entries.map(item).join('')}</html>`;
  await writeFile(path.join(out,'prime-16-edizioni.html'),shell('Puntate 1, 4, 8 e 10 — prime 16 edizioni · IT EN DE NL',drafts.slice(0,16)));
  await writeFile(path.join(out,'serie-completa-120-edizioni.html'),shell('Costruire a Cefalù e nelle Madonie — tutte le 120 edizioni',drafts));
  const documents = await Promise.all(['DELIVERY.md','RESEARCH.md','VERIFICATION.md','process-owner.md'].map(async name=>`<section><h2>${escape(name)}</h2><pre>${escape(await readFile(path.join(dossier,name),'utf8'))}</pre></section>`));
  await writeFile(path.join(out,'stato-fonti-verifiche.html'),`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Serie Marenetto — stato, fonti e verifiche</title><style>body{font:17px/1.6 system-ui;color:#252525;max-width:1000px;padding:24px;margin:auto}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}section{margin:40px 0;border-top:1px solid #aaa}</style><h1>Fascicolo privato di revisione</h1>${documents.join('')}</html>`);
  console.log('Esportate 120 edizioni e il primo gruppo di 16 secondo l’approvazione interna del 26/11/2026. Pubblicazione non eseguita.');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await exportSeriesDossier();
