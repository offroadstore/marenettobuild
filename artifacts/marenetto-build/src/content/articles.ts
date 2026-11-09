/*
 * Curated, typed content library informed by content/source-articles-it.json.
 * The archival JSON is intentionally NOT imported into the browser bundle.
 * Each record keeps its exact historical slug. Public full texts are rewritten,
 * source-linked and reviewed documentally; this does not imply professional sign-off.
 */

export type ReviewStatus = 'technical-review' | 'editorial-review' | 'summary-reviewed' | 'documentary-review';
export type ClaimType =
  | 'insurance-guarantee'
  | 'structural-diagnosis'
  | 'equipment-ownership'
  | 'durations'
  | 'tax-bonuses'
  | 'performance'
  | 'certifications'
  | 'absolute-claims';

export type ArticleCategory =
  | 'Strutture e verifiche'
  | 'Esterni e giardini'
  | 'Finiture e superfici'
  | 'Cura della proprietà'
  | 'Isolamento ed energia'
  | 'Tutele e garanzie'
  | 'Acquisto e ristrutturazione'
  | 'Impresa e servizi';

export type Article = {
  slug: string;
  title: string;
  originalTitle: string;
  summary: string;
  category: ArticleCategory;
  /** Date shown on the old homepage/article listing (ISO). */
  publishedOn: string | null;
  reviewStatus: ReviewStatus;
  review: {
    responsible: string | null;
    reviewedAt: string | null;
    sources: { title: string; url: string; verifiedAt: string; scope: string }[];
  };
  /** Public copy after documentary review; never copy the archival source without checking claims. */
  approvedFullText: string | null;
  isGuide: boolean;
  image: string;
  imageAlt: string;
  overview: string[];
  questions: string[];
  claimsToReview: ClaimType[];
};

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const img = (file: string) => `${base}/media/articles/${file}`;

export const claimLabels: Record<ClaimType, string> = {
  'insurance-guarantee': 'Assicurazioni e garanzie',
  'structural-diagnosis': 'Diagnosi strutturali',
  'equipment-ownership': 'Proprietà di attrezzature',
  durations: 'Durate e tempistiche',
  'tax-bonuses': 'Bonus fiscali',
  performance: 'Prestazioni dichiarate',
  certifications: 'Certificazioni',
  'absolute-claims': 'Affermazioni assolute',
};

export const reviewLabels: Record<ReviewStatus, { short: string; long: string }> = {
  'technical-review': { short: 'Da verificare · tecnico', long: 'Il testo completo attende una revisione tecnica competente e fonti aggiornate. La sintesi prudente resta pubblica.' },
  'editorial-review': { short: 'Da verificare · editoriale', long: 'Il testo completo attende una revisione editoriale e la verifica delle affermazioni. La sintesi prudente resta pubblica.' },
  'summary-reviewed': { short: 'Solo sintesi pubblica', long: 'È disponibile la sintesi; non risultano registrati responsabile, data e fonti per approvare il testo completo.' },
  'documentary-review': { short: 'Testo integrale · fonti citate', long: 'Testo rielaborato con verifica documentale automatizzata. Non equivale a un’approvazione professionale o a una perizia sul singolo immobile.' },
};

export const articles: Article[] = [
  {
    slug: 'comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali',
    title: 'Comprare e ristrutturare casa a Cefalù: i controlli da considerare',
    originalTitle: 'Buying and Renovating a House in Cefalù: A Technical Guide to the 5 Essential Checks',
    summary: 'Una panoramica degli aspetti da approfondire prima di acquistare un immobile da ristrutturare: impianti, documenti, stato dell’edificio e vincoli.',
    category: 'Acquisto e ristrutturazione', publishedOn: '2026-03-25', reviewStatus: 'documentary-review', isGuide: true,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Agenzia delle Entrate — L’acquisto della casa', url: 'https://www1.agenziaentrate.gov.it/web_app_entrate/guida_acquisto_casa.html/1000', verifiedAt: '2026-11-09', scope: 'Verifiche catastali e ipotecarie prima dell’acquisto.' },
      { title: 'Gazzetta Ufficiale — Norme tecniche per le costruzioni', url: 'https://www.gazzettaufficiale.it/eli/id/2018/2/20/18A00716/sg', verifiedAt: '2026-11-09', scope: 'Riferimento per le valutazioni strutturali da demandare a un tecnico.' },
      { title: 'Gazzetta Ufficiale — D.P.R. 31/2017', url: 'https://www.gazzettaufficiale.it/eli/id/2017/03/22/17G00042/sg', verifiedAt: '2026-11-09', scope: 'Autorizzazioni paesaggistiche: interventi esclusi o semplificati secondo i casi previsti.' },
    ] }, approvedFullText: `## Prima di fare un’offerta

Comprare una casa da ristrutturare richiede verifiche distinte: documenti, stato materiale dell’edificio, impianti e vincoli applicabili. Nessun singolo documento o sopralluogo fornisce da solo un quadro completo, e una guida generale non sostituisce le verifiche del notaio e dei tecnici incaricati.

## Documenti e stato amministrativo

Raccogli i dati catastali, gli atti di provenienza e la documentazione edilizia disponibile. L’Agenzia delle Entrate spiega che prima dell’acquisto è utile verificare i dati catastali e ipotecari; il notaio svolge le verifiche di propria competenza. La conformità catastale non equivale a una valutazione tecnica dell’immobile: per confrontare lo stato dei luoghi con i titoli edilizi, incarica un professionista abilitato.

## Condizioni dell’edificio e impianti

Osserva coperture, facciate, pavimenti e impianti, annotando i problemi visibili e chiedendo quando sono stati eseguiti gli interventi precedenti. Fessure, macchie o superfici non in piano non identificano da sole una causa. Se emergono dubbi, un tecnico può decidere quali verifiche siano appropriate; strumenti come una termocamera non certificano da soli la sicurezza o la conformità.

## Vincoli, costi e prossimi passi

Controlla se l’immobile ricade in un’area tutelata e quali autorizzazioni possono essere necessarie: le procedure paesaggistiche dipendono dalla categoria dell’intervento e dal contesto. Prima di impegnarti, chiedi una stima scritta con ipotesi, esclusioni e attività ancora da verificare. Agevolazioni fiscali e fattibilità non sono garantite e vanno controllate sulla normativa vigente e sul caso concreto.` ,
    image: img('comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sull’acquisto di una casa a Cefalù',
    overview: [
      'Prima di acquistare una casa da ristrutturare è utile separare ciò che si vede da ciò che va verificato. Lo stato apparente di muri, coperture e impianti non basta a capire quali lavori serviranno.',
      'Gli aspetti documentali — conformità urbanistica e catastale, eventuali vincoli nel centro storico — richiedono il parere di tecnici abilitati e, se necessario, del notaio.',
      'Un primo confronto con noi può aiutare a ordinare le domande e a capire quali professionisti coinvolgere. Non sostituisce una perizia né una verifica documentale.',
    ],
    questions: ['Quali documenti urbanistici e catastali sono disponibili?', 'Quando sono stati realizzati o rifatti gli impianti?', 'Ci sono segni di umidità, fessurazioni o infiltrazioni da far valutare?', 'L’immobile ricade in zone con vincoli particolari?'],
    claimsToReview: [],
  },
  {
    slug: 'impresa-edile-a-cefalu',
    title: 'Un’impresa edile a Cefalù: come impostare il primo confronto',
    originalTitle: 'Construction Company in Cefalù: Turning Your Vision into Reality',
    summary: 'Che cosa chiarire con un’impresa locale prima di iniziare: perimetro dei lavori, ruoli, pratiche e modalità di aggiornamento.',
    category: 'Impresa e servizi', publishedOn: '2026-02-10', reviewStatus: 'documentary-review', isGuide: false,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Camera di Commercio di Genova — Guida all’attività di impiantistica, D.M. 37/2008', url: 'https://www.ge.camcom.gov.it/it/avvia/attivita-con-requisiti/copy_of_imprese-di-impiantistica/guida-impiantistica-rev-4-3-2026.pdf', verifiedAt: '2026-11-09', scope: 'Ruoli, requisiti e documentazione per lavori sugli impianti.' },
      { title: 'Gazzetta Ufficiale — D.P.R. 31/2017', url: 'https://www.gazzettaufficiale.it/eli/id/2017/03/22/17G00042/sg', verifiedAt: '2026-11-09', scope: 'Regole paesaggistiche applicabili in funzione dell’intervento.' },
    ] }, approvedFullText: `## Definire il lavoro prima di iniziare

Quando confronti un’impresa per lavori edili, descrivi l’obiettivo e chiedi un’offerta che specifichi opere comprese, materiali previsti, esclusioni, modalità di pagamento e gestione delle varianti. Un preventivo dettagliato rende più facile confrontare proposte diverse, ma non è una diagnosi tecnica né una garanzia sul costo finale se cambiano le condizioni o il progetto.

## Ruoli, pratiche e impianti

Progettazione, direzione dei lavori, sicurezza e pratiche edilizie possono coinvolgere professionisti con incarichi e responsabilità distinti. Chiarisci chi prepara e presenta le pratiche e quali documenti riceverai a fine lavoro. In Italia le attività sugli impianti sono regolate dal D.M. 37/2008 e dalle modifiche successive: chiedi che gli interventi siano affidati a imprese abilitate per le attività pertinenti e che sia rilasciata la documentazione prevista.

In presenza di vincoli, non presumere che una pratica ordinaria basti. L’autorizzazione paesaggistica dipende dalle caratteristiche e dalla localizzazione dell’opera; il professionista incaricato può verificare con gli uffici competenti quale procedura si applichi.

## Comunicazione e confronto

Concorda un referente, un metodo per approvare le modifiche e un ritmo ragionevole di aggiornamento. Chiedi di essere informato quando emergono condizioni non visibili prima dell’avvio. Queste domande aiutano a valutare un’offerta, ma non attestano in anticipo la disponibilità, le qualifiche o i risultati di una specifica impresa: tali informazioni vanno verificate direttamente e inserite negli accordi.` ,
    image: img('impresa-edile-a-cefalu.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sui lavori edili a Cefalù',
    overview: [
      'L’articolo originale presentava l’impresa con formule promozionali. Qui ne riportiamo solo il nucleo utile: un lavoro edile parte da un perimetro definito e da ruoli chiari.',
      'Pratiche edilizie, progettazione e direzione lavori sono attività che spettano a professionisti abilitati incaricati; il loro coinvolgimento va concordato caso per caso.',
      'Sopralluoghi, tempi e modalità di intervento vengono definiti dopo aver compreso la richiesta, senza promesse preventive.',
    ],
    questions: ['Quali lavori sono inclusi e quali esclusi?', 'Chi segue le pratiche e chi firma la documentazione tecnica?', 'Come e con quale frequenza ricevo aggiornamenti?'],
    claimsToReview: [],
  },
  {
    slug: 'ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni',
    title: 'Infiltrazioni e umidità: come impostare una verifica',
    originalTitle: 'Water and Moisture Leak Detection: How to Address It Without Demolition',
    summary: 'Come raccogliere sintomi e informazioni su macchie, umidità e perdite, e perché la causa va individuata prima di scegliere un intervento.',
    category: 'Cura della proprietà', publishedOn: '2026-02-06', reviewStatus: 'documentary-review', isGuide: true,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'ANIT — Manuale tecnico sulle murature umide e degradate', url: 'https://www.anit.it/wp-content/uploads/groups-file-access/Manuale-ANIT-Murature-umide.pdf', verifiedAt: '2026-11-09', scope: 'Cause diverse possono produrre manifestazioni simili di umidità; occorre una valutazione del caso.' },
      { title: 'ANIT — Diagnosi energetica e isolamento termico degli edifici', url: 'https://www.anit.it/wp-content/uploads/groups-file-access/Manuale-ANIT-Diagnosi-energetica-e-isolamento-termico.pdf', verifiedAt: '2026-11-09', scope: 'Rilevanza delle caratteristiche dell’edificio e delle verifiche tecniche.' },
    ] }, approvedFullText: `## Una macchia non è una diagnosi

Umidità visibile, efflorescenze, distacchi o odori possono essere associati a fenomeni differenti, tra cui infiltrazioni meteoriche, perdite, condensa o umidità proveniente dal terreno. La stessa manifestazione può avere più di una causa; attribuirla a un impianto o a una parte precisa dell’edificio solo dall’aspetto può portare a interventi inappropriati.

## Informazioni utili da raccogliere

Annota quando il fenomeno è iniziato, se cambia dopo la pioggia o l’uso di acqua, quali locali sono coinvolti e se sono stati eseguiti lavori recenti. Fotografie datate e una planimetria semplice possono aiutare a descrivere il problema. Sono elementi informativi, non una diagnosi.

## Verifiche e interventi

La scelta delle indagini dipende dall’edificio e dalle ipotesi da controllare. Misurazioni strumentali, ispezioni o aperture localizzate possono essere utili in alcuni casi, ma nessuno strumento individua sempre e da solo la causa o garantisce un intervento senza demolizioni. L’esito va interpretato insieme alle condizioni del sito e alla documentazione disponibile.

Prima di ripristinare intonaci o finiture, chiedi a un professionista competente di valutare l’origine del fenomeno e di motivare il metodo proposto. L’idoneità di un prodotto dipende dal supporto e dalle condizioni d’uso; verifica le relative schede tecniche e le istruzioni aggiornate del produttore.` ,
    image: img('ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni.png'), imageAlt: 'Immagine di copertina dell’articolo originale sulla ricerca di infiltrazioni',
    overview: [
      'Macchie, distacchi di intonaco o odore di umido possono avere cause diverse: perdite di impianto, risalita capillare, condensa, infiltrazioni da coperture o terrazzi.',
      'L’originale descriveva strumenti e risultati specifici, inclusa la possibilità di intervenire sempre senza demolizioni. Queste affermazioni sono in revisione tecnica e non vengono riproposte.',
      'Per chi vive all’estero è utile annotare quando compare il problema, dopo quali eventi e in quali stanze, e condividere fotografie datate. Le foto aiutano a capire, ma non costituiscono una diagnosi.',
    ],
    questions: ['Il problema peggiora dopo la pioggia o con l’uso dell’acqua?', 'Da quanto tempo è visibile?', 'Ci sono impianti o terrazzi sopra o accanto alla zona interessata?'],
    claimsToReview: [],
  },
  {
    slug: 'garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto',
    title: 'Garanzie sui lavori edili: che cosa chiedere e verificare',
    originalTitle: '10-Year Warranty on Construction Work: The Marenetto Decennial Insurance Policy',
    summary: 'Un promemoria neutrale su come informarsi riguardo garanzie e coperture assicurative prima di affidare un lavoro. Nessuna copertura viene qui dichiarata.',
    category: 'Tutele e garanzie', publishedOn: '2025-12-31', reviewStatus: 'documentary-review', isGuide: false,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Gazzetta Ufficiale — Codice civile, art. 1669', url: 'https://www.gazzettaufficiale.it/atto/serie_generale/caricaArticolo?art.progressivo=0&art.idArticolo=1669&art.versione=1&art.codiceRedazionale=042U0262&art.dataPubblicazioneGazzetta=1942-04-04&art.idGruppo=208&art.idSottoArticolo1=10&art.idSottoArticolo=1&art.flagTipoArticolo=2', verifiedAt: '2026-11-09', scope: 'Responsabilità per rovina, pericolo di rovina o gravi difetti alle condizioni previste dalla norma.' },
      { title: 'Gazzetta Ufficiale — D.Lgs. 122/2005 e schema tipo di polizza', url: 'https://www.gazzettaufficiale.it/atto/serie_generale/caricaArticolo?art.codiceRedazionale=22G00161&art.dataPubblicazioneGazzetta=2022-10-21&art.flagTipoArticolo=0&art.idArticolo=1&art.idGruppo=0&art.idSottoArticolo=1&art.idSottoArticolo1=10&art.progressivo=0&art.versione=1', verifiedAt: '2026-11-09', scope: 'Schema tipo di polizza per immobili da costruire e richiamo all’art. 4 del D.Lgs. 122/2005.' },
    ] }, approvedFullText: `## Responsabilità prevista dalla legge e polizza non sono la stessa cosa

L’articolo 1669 del Codice civile disciplina la responsabilità dell’appaltatore in determinate circostanze relative a edifici destinati a lunga durata, quando entro dieci anni dal compimento si verifichino rovina, pericolo di rovina o gravi difetti riconducibili ai presupposti indicati dalla norma. Prevede inoltre termini specifici per la denuncia e per l’azione. L’applicazione a un caso concreto richiede una valutazione giuridica: non è una garanzia generica su qualunque lavoro o difetto.

La polizza assicurativa indennitaria decennale prevista dal D.Lgs. 122/2005 riguarda la disciplina di tutela degli acquirenti di immobili da costruire e le condizioni previste dalla legge. Non va confusa con la responsabilità civile né estesa automaticamente a ogni ristrutturazione.

## Che cosa chiedere prima di firmare

Se una copertura viene proposta per uno specifico intervento, chiedi il certificato e il testo completo della polizza, controllando contraente, beneficiario, immobile, durata, decorrenza, massimali, franchigie, esclusioni e procedura di denuncia del sinistro. Verifica anche se il contratto di lavoro e i documenti finali richiamano la copertura.

Questa pagina non dichiara che Marenetto Build abbia una polizza attiva e non offre consulenza legale. La disponibilità e l’ambito di una copertura devono essere confermati per iscritto dall’impresa e dall’assicuratore; per interpretare i documenti, rivolgiti a un notaio o a un consulente legale e assicurativo.` ,
    image: img('garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto.png'), imageAlt: 'Immagine di copertina dell’articolo originale su garanzie e polizze',
    overview: [
      'L’articolo originale descriveva una specifica polizza decennale. Non ripubblichiamo questa affermazione finché non sarà verificata documentalmente: la sua presenza in archivio non costituisce un impegno.',
      'In generale, garanzie e coperture assicurative dipendono dal tipo di intervento, dal contratto e dalle condizioni della polizza eventualmente sottoscritta.',
      'Se l’argomento è importante per la tua decisione, chiedi la documentazione scritta e falla esaminare da un consulente di fiducia.',
    ],
    questions: ['Esiste una polizza per questo specifico intervento? Posso leggerne le condizioni?', 'Che cosa è escluso dalla copertura?', 'Chi è il soggetto garante?'],
    claimsToReview: [],
  },
  {
    slug: 'cappotto-termico-vs-intonaco-termico-cefalu',
    title: 'Cappotto termico e intonaco termico: criteri di confronto',
    originalTitle: 'Thermal Insulation vs Thermal Plaster: The Best Choice for Sicily',
    summary: 'Due approcci all’isolamento delle pareti messi a confronto in modo generale: spessori, contesto dell’edificio e verifiche da affidare a un tecnico.',
    category: 'Isolamento ed energia', publishedOn: '2025-12-27', reviewStatus: 'documentary-review', isGuide: true,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'ANIT — Diagnosi energetica e isolamento termico degli edifici', url: 'https://www.anit.it/wp-content/uploads/groups-file-access/Manuale-ANIT-Diagnosi-energetica-e-isolamento-termico.pdf', verifiedAt: '2026-11-09', scope: 'La valutazione energetica considera caratteristiche dell’edificio e interventi possibili.' },
      { title: 'ENEA — Vademecum per la riqualificazione globale, aggiornamento 2026', url: 'https://www.efficienzaenergetica.enea.it/images/detrazioni/VADEMECUM_2026/344_RIQUALIFICAZIONE%20GLOBALE.pdf', verifiedAt: '2026-11-09', scope: 'Requisiti e documentazione per interventi di riqualificazione energetica.' },
      { title: 'Agenzia delle Entrate — Agevolazioni 2026, riqualificazione energetica', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/10186910/Riqualificazione_energetica.pdf/d83df39d-2678-770c-4b81-84f49ab1bb49?t=1782456663725', verifiedAt: '2026-11-09', scope: 'Regole fiscali 2026: requisiti e aliquote dipendono dalla fattispecie.' },
    ] }, approvedFullText: `## Due famiglie di interventi, nessuna scelta universale

Un sistema a pannelli applicato all’involucro e un intonaco termico sono soluzioni diverse; il confronto non si riduce allo spessore o al nome del materiale. Prestazioni, comportamento igrometrico, raccordi, ponti termici, vincoli architettonici e condizioni della muratura incidono sul risultato. Non esiste una soluzione corretta per tutte le case di Cefalù o per tutta la Sicilia.

## La diagnosi viene prima del materiale

Una valutazione energetica raccoglie informazioni sull’edificio e sugli impianti, individua le criticità e confronta interventi possibili. Nei fabbricati esistenti è importante considerare anche umidità, esposizione, ombreggiamento, ventilazione e stato delle finiture. Su edifici storici o vincolati, la compatibilità dell’intervento con il prospetto e le autorizzazioni va verificata prima di progettare i lavori.

## Come confrontare le proposte

Chiedi che la proposta specifichi sistema e componenti, preparazione dei supporti, nodi costruttivi, prestazioni dichiarate e documenti tecnici del produttore. I dati vanno letti per il prodotto e lo spessore effettivamente previsti, non trasferiti da una soluzione all’altra. Affida dimensionamento e dettagli a un tecnico abilitato.

Le detrazioni fiscali variano in base alla norma, all’intervento, all’immobile e al beneficiario e possono cambiare. Consulta le fonti ufficiali aggiornate e un consulente fiscale prima di fare affidamento su un incentivo; questo articolo non promette classi energetiche, risparmi o bonus.` ,
    image: img('cappotto-termico-vs-intonaco-termico-cefalu.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sul confronto tra cappotto e intonaco termico',
    overview: [
      'Cappotto e intonaco termico rispondono a esigenze diverse. La scelta dipende da struttura, esposizione, spazio disponibile, vincoli di facciata e obiettivi del proprietario.',
      'L’originale indicava valori di prestazione, costi e possibili agevolazioni fiscali. Questi dati sono in revisione tecnica e non vengono riportati: vanno calcolati da un professionista sul singolo edificio.',
      'Un confronto preliminare può aiutare a chiarire le domande da porre; la valutazione energetica resta in capo a tecnici abilitati.',
    ],
    questions: ['La facciata è soggetta a vincoli?', 'Esiste una diagnosi energetica dell’edificio?', 'Quali sono gli obiettivi: comfort estivo, invernale, condensa?'],
    claimsToReview: [],
  },
  {
    slug: 'pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete',
    title: 'Pavimentazioni esterne in cemento stampato: cosa considerare',
    originalTitle: 'Isoplam Outdoor Floors: Complete Guide to Stamped Concrete and Skyconcrete',
    summary: 'Aspetti pratici per valutare una pavimentazione esterna decorativa: sottofondo, pendenze, uso previsto e manutenzione.',
    category: 'Finiture e superfici', publishedOn: '2025-12-23', reviewStatus: 'documentary-review', isGuide: true,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Isoplam — Plam Stampable, pavimento in cemento stampato', url: 'https://www.isoplam.it/soluzioni/pavimento-cemento-stampato-texture', verifiedAt: '2026-11-09', scope: 'Descrizione del sistema stampato e indicazioni di applicazione del produttore.' },
      { title: 'Isoplam — Soluzioni per superfici esterne', url: 'https://www.isoplam.it/', verifiedAt: '2026-11-09', scope: 'Gamma di prodotti: verificare la scheda tecnica del sistema selezionato.' },
    ] }, approvedFullText: `## Progettare la pavimentazione in base all’uso

Un ingresso carrabile, un camminamento e un bordo piscina hanno esigenze diverse. Prima di scegliere una finitura, definisci traffico previsto, pendenze, drenaggio, esposizione, quote disponibili e manutenzione desiderata. Le condizioni del sottofondo e la gestione dei giunti sono parte del progetto, non dettagli estetici.

## Cemento stampato e rivestimenti a basso spessore

Il cemento stampato è una superficie in calcestruzzo lavorata con texture decorative; il produttore Isoplam descrive il sistema Plam Stampable e le relative fasi di applicazione. Skyconcrete Outdoor è una diversa soluzione di finitura per esterni. Non sono prodotti intercambiabili e le caratteristiche di un sistema non si possono attribuire all’altro.

La scelta dipende dalle condizioni esistenti e dalla documentazione aggiornata del produttore. Prima della posa verifica la compatibilità del supporto, i dettagli per acqua e giunti, lo spessore disponibile e l’eventuale necessità di caratteristiche antiscivolo specifiche. Una descrizione commerciale non sostituisce le schede tecniche, le istruzioni di posa o le verifiche sul posto.

## Prima di approvare un’offerta

Chiedi che il preventivo indichi il nome esatto del sistema, la preparazione del fondo, i materiali inclusi, i dettagli dei bordi e dei giunti, la finitura protettiva e le istruzioni per la cura. Richiedi la documentazione del lotto e concorda per iscritto come verranno trattate eventuali condizioni impreviste. Durata, resistenza e risultati dipendono dal sistema, dalla posa e dall’uso: qui non sono garantiti.` ,
    image: img('pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete.png'), imageAlt: 'Immagine di copertina dell’articolo originale sulle pavimentazioni esterne',
    overview: [
      'Una pavimentazione esterna dipende prima di tutto dal sottofondo, dal drenaggio e dall’uso: passaggio pedonale, carrabile, bordo piscina.',
      'L’originale citava sistemi di marca, certificazioni e durate. Queste indicazioni sono in revisione e non vengono ripubblicate.',
      'La scelta di materiale e finitura va concordata dopo un sopralluogo e sulla base delle schede tecniche aggiornate del produttore.',
    ],
    questions: ['Quale sarà l’uso prevalente della superficie?', 'Come defluisce oggi l’acqua piovana?', 'Quale manutenzione sei disposto a prevedere?'],
    claimsToReview: [],
  },
  {
    slug: 'ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam',
    title: 'Microcemento su superfici esistenti: quando valutarlo',
    originalTitle: 'Renovate Without Demolition: The Complete Guide to Microverlay Isoplam Microcement',
    summary: 'In quali casi un rivestimento a basso spessore può essere preso in considerazione e quali verifiche sul supporto servono prima.',
    category: 'Finiture e superfici', publishedOn: '2025-12-22', reviewStatus: 'documentary-review', isGuide: true,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Isoplam — Microverlay, informazioni e applicazione', url: 'https://www.isoplam.it/soluzioni/microcemento/', verifiedAt: '2026-11-09', scope: 'Descrizione del prodotto, superfici previste, ciclo applicativo e schede tecniche del produttore.' },
    ] }, approvedFullText: `## Che cos’è un rivestimento in microcemento

Microverlay è un sistema di rivestimento cementizio a basso spessore descritto dal produttore per superfici continue. La pagina di prodotto riporta gli ambienti e i cicli applicativi previsti; queste indicazioni valgono per il sistema e per la versione specifica, non per tutti i prodotti chiamati microcemento.

## Il supporto determina la fattibilità

Applicare un nuovo strato sopra una pavimentazione esistente non è sempre possibile. Il supporto deve essere valutato per stabilità, adesione, umidità, planarità, fessure, giunti e compatibilità con il ciclo previsto. Piastrelle distaccate, movimenti o umidità possono richiedere preparazioni o soluzioni differenti. Il basso spessore non elimina automaticamente demolizioni, rialzi o lavorazioni sui raccordi.

## Scelta del sistema e posa

Chiedi la scheda tecnica aggiornata, le istruzioni di preparazione, i primer e protettivi compatibili, i tempi tra le fasi e i limiti d’uso per il locale. In docce e ambienti bagnati, chiarisci come viene realizzata e verificata l’impermeabilizzazione: la finitura decorativa non va considerata da sola una tenuta all’acqua.

Il risultato dipende dal prodotto, dal supporto e dalla posa. Richiedi una valutazione del pavimento e un’offerta che specifichi il ciclo completo. Non è possibile garantire in astratto che ogni superficie esistente possa essere rinnovata senza demolizione o che una finitura sia resistente a graffi, macchie o acqua in ogni condizione.` ,
    image: img('ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sul microcemento',
    overview: [
      'I rivestimenti a basso spessore possono essere applicati su alcune superfici esistenti, ma solo se il supporto è stabile, asciutto e compatibile.',
      'L’originale presentava il rinnovo senza demolizioni come sempre possibile e citava prestazioni di prodotto. Queste affermazioni sono in revisione tecnica.',
      'Prima di scegliere, è utile valutare lo stato del pavimento esistente, l’umidità e l’uso dell’ambiente.',
    ],
    questions: ['Il pavimento esistente presenta piastrelle che suonano vuote o crepe?', 'L’ambiente è soggetto a umidità?', 'Ci sono vincoli di quota con porte e soglie?'],
    claimsToReview: [],
  },
  {
    slug: 'gestione-manutenzione-immobile',
    title: 'Manutenzione della proprietà quando vivi lontano',
    originalTitle: 'Property Maintenance Management',
    summary: 'Come organizzare controlli periodici e piccoli interventi su una casa che resta vuota per parte dell’anno.',
    category: 'Cura della proprietà', publishedOn: '2025-12-16', reviewStatus: 'documentary-review', isGuide: true,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Gazzetta Ufficiale — D.M. 37/2008 e successive modifiche', url: 'https://www.gazzettaufficiale.it/eli/id/2008/03/12/008G0060/sg', verifiedAt: '2026-11-09', scope: 'Installazione e documentazione degli impianti negli edifici.' },
      { title: 'Camera di Commercio di Genova — Guida all’attività di impiantistica, aggiornata al 2026', url: 'https://www.ge.camcom.gov.it/it/avvia/attivita-con-requisiti/copy_of_imprese-di-impiantistica/guida-impiantistica-rev-4-3-2026.pdf', verifiedAt: '2026-11-09', scope: 'Quadro aggiornato per attività e documenti relativi agli impianti.' },
    ] }, approvedFullText: `## Organizzare i controlli della casa

Una proprietà abitata solo per parte dell’anno può essere più semplice da seguire se le informazioni sono raccolte in un unico registro: data dei controlli, lavori eseguiti, documenti ricevuti e problemi osservati. La frequenza dipende da edificio, impianti, uso e condizioni locali; non esiste un calendario unico adatto a tutte le case.

## Un piano pratico

Annota le verifiche di coperture, scarichi, aperture, esterni e impianti secondo le istruzioni dei produttori e le indicazioni dei professionisti incaricati. Dopo piogge intense o altri eventi che possono interessare l’immobile, documenta eventuali variazioni senza tentare diagnosi da fotografie. Conserva manuali, fatture e dichiarazioni di conformità insieme alla documentazione dell’edificio.

Per modifiche e interventi sugli impianti, le attività e i documenti richiesti dipendono dal tipo di impianto e di lavoro. Il D.M. 37/2008 disciplina le attività di installazione negli edifici; per gli interventi pertinenti, verifica requisiti dell’impresa e documentazione rilasciata.

## Servizi e accordi

Manutenzione, pulizia, gestione degli affitti e risposta alle emergenze sono attività diverse. Se incarichi un fornitore, specifica quali controlli svolge, con quale periodicità, come accede alla proprietà, come segnala un’urgenza e quali attività richiedono un preventivo separato. Nessuna frequenza o tempo di risposta è promesso da questa guida: concordali nel contratto e verifica la disponibilità del fornitore.` ,
    image: img('gestione-manutenzione-immobile.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sulla manutenzione immobiliare',
    overview: [
      'Una casa vissuta solo in alcuni periodi beneficia di controlli regolari: aperture, impianti, coperture, esterni dopo eventi meteo.',
      'Attività, frequenze e modalità di aggiornamento si concordano per singolo immobile. Manutenzione, pulizie e gestione degli affitti restano servizi distinti.',
      'L’originale indicava tempi di intervento e livelli di servizio non documentati: non vengono ripubblicati.',
    ],
    questions: ['Quali parti della casa ti preoccupano di più quando sei lontano?', 'Preferisci aggiornamenti a cadenza fissa o solo su necessità?', 'Chi altro ha accesso alla proprietà?'],
    claimsToReview: [],
  },
  {
    slug: 'garden-design-esclusivo',
    title: 'Giardini mediterranei: impostare un progetto esterno',
    originalTitle: 'Exclusive Garden Design',
    summary: 'Spunti per ragionare su un giardino in clima mediterraneo: specie adatte, acqua, percorsi e manutenzione nel tempo.',
    category: 'Esterni e giardini', publishedOn: '2025-12-16', reviewStatus: 'documentary-review', isGuide: false,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Regione Siciliana — Flora e vegetazione', url: 'https://orbs.regione.sicilia.it/attivita/biodiversita/flora.html', verifiedAt: '2026-11-09', scope: 'Specie e ambienti della flora siciliana, inclusa la vegetazione mediterranea e costiera.' },
      { title: 'Di Gristina et al. — A Checklist of the Ornamental Vascular Flora of Sicily (2025)', url: 'https://www.mdpi.com/2223-7747/14/5/795', verifiedAt: '2026-11-09', scope: 'Studio sulla flora ornamentale in Sicilia e sulla valutazione di specie native e non native.' },
    ] }, approvedFullText: `## Progettare a partire dal luogo

Un giardino costiero dipende da esposizione, vento, salinità, disponibilità d’acqua, terreno e manutenzione possibile. Prima di scegliere piante e materiali, rileva sole e ombra, accessi, pendenze e impianti esistenti. La stessa specie può comportarsi diversamente in siti con condizioni differenti.

## Specie e risorse

La flora siciliana comprende ambienti diversi, dalla macchia mediterranea alle coste; la Regione Siciliana cita specie come lentisco e palma nana tra gli elementi di questi ambienti. Una checklist scientifica recente documenta la varietà della flora ornamentale dell’isola e invita a considerare con attenzione le specie non native. Questi riferimenti non costituiscono un elenco di piante adatte a ogni proprietà: la scelta va verificata rispetto a suolo, esposizione, disponibilità idrica e possibili vincoli ambientali.

Progetta l’irrigazione in base al fabbisogno effettivo e alla disponibilità d’acqua, e pianifica la manutenzione prevista prima della messa a dimora. Evita di promettere consumi ridotti senza una valutazione del progetto e del sistema di irrigazione.

## Percorsi, luci e opere

Percorsi, muri, pergole, illuminazione e specchi d’acqua devono essere coordinati con quote e drenaggio del sito. Interventi su aree vincolate possono richiedere verifiche e autorizzazioni; accertale prima di progettare o iniziare i lavori. Un progetto paesaggistico è una proposta da adattare al luogo, non una garanzia di risultato o di manutenzione senza interventi.` ,
    image: img('garden-design-esclusivo.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sulla progettazione di giardini',
    overview: [
      'Un giardino vicino al mare va pensato con il clima: esposizione, vento, salsedine, disponibilità d’acqua.',
      'Specie mediterranee come olivo, carrubo, rosmarino e lentisco sono spesso considerate per la loro adattabilità; la scelta va comunque valutata sul sito.',
      'L’originale descriveva servizi di modellazione 3D e impianti specifici: questi elementi sono in revisione editoriale.',
    ],
    questions: ['Quanto tempo trascorri nella proprietà e in quali stagioni?', 'Chi si occuperà della manutenzione del verde?', 'Esiste già un impianto di irrigazione?'],
    claimsToReview: [],
  },
  {
    slug: 'opere-in-pietra-e-prospetti',
    title: 'Pietra e facciate: materiali e cura delle finiture',
    originalTitle: 'Stone Works and Facades',
    summary: 'Considerazioni generali sull’uso della pietra in facciata e sugli aspetti da verificare prima di un intervento su un prospetto.',
    category: 'Finiture e superfici', publishedOn: '2025-12-16', reviewStatus: 'documentary-review', isGuide: false,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Gazzetta Ufficiale — D.P.R. 31/2017', url: 'https://www.gazzettaufficiale.it/eli/id/2017/03/22/17G00042/sg', verifiedAt: '2026-11-09', scope: 'Individua opere escluse dall’autorizzazione paesaggistica o soggette a procedura semplificata.' },
      { title: 'Regione Siciliana — Portale Paesaggistica, D.D.G. 2443/2021', url: 'https://www.regione.sicilia.it/system/files/2021-07/Decreto_Portale%20Paesaggistica_2443%20del%2012%20luglio%202021.pdf', verifiedAt: '2026-11-09', scope: 'Procedimenti paesaggistici e riferimenti regionali.' },
    ] }, approvedFullText: `## Valutare il prospetto prima di scegliere la pietra

Il risultato di un rivestimento lapideo dipende dalla pietra, dalla lavorazione, dal sistema di fissaggio o posa, dal supporto e dall’esposizione. Prima di definire finitura e colore, verifica stato della facciata, presenza di umidità o parti distaccate, carichi e modalità di ancoraggio. Queste valutazioni richiedono un progetto adeguato all’edificio; la pietra, da sola, non garantisce isolamento, impermeabilità o integrità strutturale.

## Edifici esistenti e contesti tutelati

Su un edificio storico, la compatibilità di un materiale e di una lavorazione dipende anche dal valore architettonico e dalle regole applicabili. Il D.P.R. 31/2017 distingue interventi esclusi dall’autorizzazione paesaggistica e interventi soggetti a procedura semplificata; non è possibile stabilire dalla sola descrizione se una specifica opera ricada in una categoria. In Sicilia, verifica con il professionista incaricato e con gli uffici competenti la procedura da seguire.

## Specificare materiali e dettagli

In un’offerta, chiedi di indicare provenienza e caratteristiche dichiarate del materiale, spessori, fissaggi, giunti, trattamento dei bordi e manutenzione. Richiedi campioni quando colore e texture sono determinanti. Evita di dedurre durabilità o prestazioni strutturali da affermazioni generiche: dipendono dalla soluzione progettata, dai prodotti e dall’esecuzione.` ,
    image: img('opere-in-pietra-e-prospetti.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale su opere in pietra',
    overview: [
      'La pietra è un materiale ricorrente nell’architettura siciliana. La scelta del tipo e della lavorazione dipende dal contesto e dagli eventuali vincoli.',
      'L’originale conteneva affermazioni assolute su durata, isolamento e integrità strutturale. Sono in revisione e non vengono ripubblicate.',
      'Gli interventi sui prospetti possono richiedere autorizzazioni: vanno valutati con un tecnico abilitato.',
    ],
    questions: ['L’edificio si trova in un contesto vincolato?', 'Si tratta di restauro o di nuova realizzazione?', 'Ci sono campioni o riferimenti di pietra già scelti?'],
    claimsToReview: [],
  },
  {
    slug: 'pavimenti-stampati-in-resina',
    title: 'Pavimenti in resina stampata: vantaggi e limiti da valutare',
    originalTitle: 'Stamped Resin Flooring',
    summary: 'Una lettura equilibrata delle superfici decorative continue, per interni ed esterni: supporto, uso, manutenzione.',
    category: 'Finiture e superfici', publishedOn: '2025-12-15', reviewStatus: 'documentary-review', isGuide: false,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Isoplam — Deco Epox W BI, resina epossidica a base acqua', url: 'https://www.isoplam.it/prodotto/resina-epossidica-deco-epox-w-bi/', verifiedAt: '2026-11-09', scope: 'Esempio di prodotto specifico e dei supporti indicati dal produttore; non rappresenta tutte le resine.' },
      { title: 'Isoplam — Microverlay, sistema cementizio continuo', url: 'https://www.isoplam.it/soluzioni/microcemento/', verifiedAt: '2026-11-09', scope: 'Distinzione tra sistemi e cicli di finitura differenti.' },
    ] }, approvedFullText: `## “Pavimento in resina” non identifica un unico sistema

Le finiture continue possono includere prodotti e cicli diversi, con composizioni, supporti ammessi e destinazioni d’uso specifiche. Una resina epossidica, un rivestimento cementizio e un sistema decorativo non sono intercambiabili. Anche all’interno della stessa famiglia, i dati dichiarati valgono per il prodotto e le condizioni indicate dal produttore.

## Controllare supporto e uso

Prima di scegliere un ciclo, definisci se la superficie sarà interna o esterna, il traffico previsto, l’esposizione ad acqua e sole, le esigenze di pulizia e la presenza di umidità nel supporto. Verifica stabilità, planarità, giunti e compatibilità del fondo. In alcuni casi sono necessarie prove o preparazioni; una finitura continua non elimina automaticamente fessure, movimenti o problemi preesistenti.

## Documentazione e manutenzione

Chiedi la scheda tecnica e la scheda di sicurezza del prodotto, le istruzioni di posa, i tempi di maturazione e le condizioni di esercizio. Specifica nell’offerta preparazione, primer, strati, finitura e modalità di riparazione. Isoplam, ad esempio, descrive prodotti specifici per il trattamento di alcuni supporti cementizi: le indicazioni non devono essere generalizzate a tutte le pavimentazioni.

Resistenza a usura, macchie, raggi UV, scivolamento e durata richiedono dati riferiti al sistema preciso e, quando necessario, verifiche del progetto. Non sono garantiti in astratto dalla definizione “resina”.` ,
    image: img('pavimenti-stampati-in-resina.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sui pavimenti in resina',
    overview: [
      'Le superfici continue decorative sono apprezzate per l’assenza di fughe e la varietà di finiture.',
      'L’originale dichiarava resistenza estrema, durata e posa senza demolizioni in modo generalizzato. Queste affermazioni sono in revisione tecnica.',
      'Prestazioni e idoneità dipendono da supporto, prodotto e posa: si valutano con schede tecniche e sopralluogo.',
    ],
    questions: ['Interno o esterno? Con quale esposizione al sole?', 'Che tipo di traffico è previsto?', 'Com’è il supporto attuale?'],
    claimsToReview: [],
  },
  {
    slug: 'piscine-e-laghetti-zen',
    title: 'Piscine e specchi d’acqua: domande prima di iniziare',
    originalTitle: 'Zen Pools and Ponds',
    summary: 'Gli aspetti da chiarire prima di valutare una piscina o un laghetto ornamentale: terreno, accessi, autorizzazioni e manutenzione.',
    category: 'Esterni e giardini', publishedOn: '2025-12-15', reviewStatus: 'documentary-review', isGuide: false,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Gazzetta Ufficiale — D.P.R. 31/2017', url: 'https://www.gazzettaufficiale.it/eli/id/2017/03/22/17G00042/sg', verifiedAt: '2026-11-09', scope: 'Regole paesaggistiche per opere esterne: procedura da determinare per il singolo intervento.' },
      { title: 'Regione Siciliana — Portale Paesaggistica, D.D.G. 2443/2021', url: 'https://www.regione.sicilia.it/system/files/2021-07/Decreto_Portale%20Paesaggistica_2443%20del%2012%20luglio%202021.pdf', verifiedAt: '2026-11-09', scope: 'Riferimenti regionali per le istanze e i procedimenti paesaggistici.' },
    ] }, approvedFullText: `## Prima il luogo, poi la forma

Una piscina o un laghetto modificano l’uso del giardino e possono incidere su terreno, drenaggio, accessi e impianti. Raccogli informazioni su pendenze, condizioni del suolo, reti presenti, disponibilità di spazio per il cantiere e modalità di manutenzione. Una vasca a sfioro, una piscina tradizionale e un bacino ornamentale hanno requisiti progettuali differenti.

## Autorizzazioni e progettazione

Prima di definire dimensioni e posizione, fai verificare titoli edilizi, vincoli e autorizzazioni applicabili all’immobile. Il D.P.R. 31/2017 elenca interventi esclusi dall’autorizzazione paesaggistica e altri sottoposti a procedura semplificata; la classificazione dipende dalle caratteristiche dell’opera e dal contesto e non si può stabilire con una regola unica per ogni piscina.

Impianti elettrici, circolazione e trattamento dell’acqua devono essere progettati secondo le norme e le specifiche dei componenti scelti. Pianifica accesso sicuro, scarichi e manutenzione ordinaria. Le modalità di controllo dell’acqua dipendono dal sistema e dalle istruzioni del produttore.

## Costi e gestione

Un preventivo utile distingue opere civili, impianti, finiture, pratiche e gestione futura. Chiedi quali attività sono incluse, quali documenti verranno consegnati e quali interventi periodici sono necessari. Non è possibile promettere acqua sempre cristallina, assenza di manutenzione o autorizzazione certa prima delle verifiche sul progetto.` ,
    image: img('piscine-e-laghetti-zen.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale su piscine e laghetti',
    overview: [
      'Una piscina o un laghetto incidono su terreno, drenaggi e accessi al cantiere: sono i primi aspetti da valutare.',
      'L’originale prometteva acqua sempre cristallina ed esecuzione impeccabile nel tempo. Affermazioni di questo tipo sono in revisione editoriale.',
      'La realizzazione può richiedere titoli edilizi e la manutenzione va pianificata, soprattutto se la proprietà resta vuota per periodi lunghi.',
    ],
    questions: ['Il terreno è in pendenza? Com’è l’accesso per i mezzi?', 'Chi gestirà la manutenzione dell’acqua?', 'Sono già state verificate le autorizzazioni necessarie?'],
    claimsToReview: [],
  },
  {
    slug: 'cucine-in-muratura-luxury',
    title: 'Cucine in muratura ed esterne: materiali e scelte',
    originalTitle: 'Luxury Built-in Kitchens',
    summary: 'Spunti su materiali, esposizione e uso per una cucina in muratura, anche all’aperto, con attenzione alla manutenzione.',
    category: 'Esterni e giardini', publishedOn: '2025-12-15', reviewStatus: 'documentary-review', isGuide: false,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Gazzetta Ufficiale — D.M. 37/2008 e successive modifiche', url: 'https://www.gazzettaufficiale.it/eli/id/2008/03/12/008G0060/sg', verifiedAt: '2026-11-09', scope: 'Regole per interventi sugli impianti al servizio degli edifici.' },
      { title: 'Camera di Commercio di Genova — Guida all’attività di impiantistica, aggiornata al 2026', url: 'https://www.ge.camcom.gov.it/it/avvia/attivita-con-requisiti/copy_of_imprese-di-impiantistica/guida-impiantistica-rev-4-3-2026.pdf', verifiedAt: '2026-11-09', scope: 'Requisiti e documentazione per le attività sugli impianti.' },
    ] }, approvedFullText: `## Progettare in base all’uso

Una cucina in muratura si definisce partendo da attività, spazio disponibile e impianti, non solo dall’aspetto. Per una cucina esterna considera esposizione a pioggia e sole, ventilazione, protezione degli apparecchi, accesso per la manutenzione e materiali compatibili con le condizioni locali.

## Materiali e dettagli

Confronta superfici di lavoro, rivestimenti, basi e giunti considerando pulizia, temperature d’uso e istruzioni di manutenzione. Pietra, metallo, legno e materiali compositi hanno proprietà differenti; il nome del materiale non basta a stabilirne idoneità e durata. Chiedi campioni e specifiche del produttore per i prodotti effettivamente previsti.

Prevedi quote e spazi per apparecchi, lavello, scarichi, prese e ventilazione prima di realizzare la struttura. Gli impianti devono essere progettati e installati da soggetti abilitati quando previsto; il D.M. 37/2008 disciplina le attività di installazione degli impianti negli edifici e i relativi documenti.

## Accordi e verifiche

Metti per iscritto dimensioni, materiali, apparecchi inclusi, collegamenti, finiture e responsabilità per eventuali opere edilizie. Per installazioni esterne o in contesti tutelati, verifica pratiche e vincoli prima dell’avvio. Questa guida non descrive servizi, marchi partner o tecnologie disponibili presso una specifica impresa: confermali direttamente prima di inserirli in un progetto o in un’offerta.` ,
    image: img('cucine-in-muratura-luxury.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sulle cucine in muratura',
    overview: [
      'Una cucina in muratura, soprattutto esterna, va pensata per l’esposizione: sole, salsedine, pioggia e periodi di inutilizzo.',
      'L’originale aveva un tono marcatamente promozionale e citava tecnologie e finiture di pregio senza riferimenti a lavori documentati. È in revisione editoriale.',
      'Materiali, impianti e posizione si definiscono insieme, con verifiche su allacci e scarichi.',
    ],
    questions: ['Sarà usata tutto l’anno o solo d’estate?', 'Sono disponibili allacci per acqua, gas o elettricità?', 'Che materiali hai già in mente?'],
    claimsToReview: [],
  },
  {
    slug: 'tecniche-avanzate-gestione-deformazioni-strutture-edili',
    title: 'Deformazioni negli edifici: perché serve una valutazione tecnica',
    originalTitle: 'Advanced Techniques for Managing Deformations in Modern Building Structures',
    summary: 'Una nota prudente su fessurazioni e deformazioni: perché il primo passo è sempre il parere di un professionista strutturale abilitato.',
    category: 'Strutture e verifiche', publishedOn: '2024-06-20', reviewStatus: 'documentary-review', isGuide: false,
    review: { responsible: 'Revisione documentale automatizzata (IA)', reviewedAt: '2026-11-09', sources: [
      { title: 'Gazzetta Ufficiale — D.M. 17 gennaio 2018, Norme tecniche per le costruzioni', url: 'https://www.gazzettaufficiale.it/eli/id/2018/2/20/18A00716/sg', verifiedAt: '2026-11-09', scope: 'Quadro normativo per la valutazione della sicurezza delle costruzioni esistenti.' },
      { title: 'Gazzetta Ufficiale — Codice civile, art. 1669', url: 'https://www.gazzettaufficiale.it/atto/serie_generale/caricaArticolo?art.progressivo=0&art.idArticolo=1669&art.versione=1&art.codiceRedazionale=042U0262&art.dataPubblicazioneGazzetta=1942-04-04&art.idGruppo=208&art.idSottoArticolo1=10&art.idSottoArticolo=1&art.flagTipoArticolo=2', verifiedAt: '2026-11-09', scope: 'Riferimento legale circoscritto ai presupposti previsti dalla norma, non diagnosi del danno.' },
    ] }, approvedFullText: `## Le manifestazioni visibili non identificano la causa

Fessure, deformazioni, porte che non chiudono o pavimenti inclinati possono dipendere da fenomeni diversi e non consentono, da soli, di stabilire se esista un problema strutturale. Anche la forma o la posizione di una fessura non bastano a formulare una diagnosi o a definire l’urgenza dell’intervento.

## Come preparare una valutazione

Annota quando il fenomeno è stato notato, se è cambiato nel tempo, quali parti dell’edificio coinvolge e se sono avvenuti lavori, infiltrazioni o eventi recenti. Conserva fotografie datate e documenti disponibili, senza coprire o riparare la zona prima della valutazione se ciò può cancellare informazioni utili.

La valutazione di una costruzione esistente deve considerare edificio, materiali, condizioni e documentazione. Le Norme tecniche per le costruzioni prevedono un quadro per la valutazione della sicurezza; indagini, monitoraggi, calcoli e interventi devono essere scelti e progettati da un ingegnere strutturale abilitato dopo aver esaminato il caso.

## In caso di possibile pericolo

Se osservi un peggioramento rapido, caduta di materiale o altri segnali che fanno temere un pericolo immediato, allontanati dalla zona e contatta i servizi di emergenza o le autorità competenti. Non tentare riparazioni o puntellamenti senza indicazioni professionali. Le responsabilità legali relative ai gravi difetti edilizi hanno presupposti e termini specifici: per un caso concreto chiedi consulenza tecnica e legale.` ,
    image: img('tecniche-avanzate-gestione-deformazioni-strutture-edili.png'), imageAlt: 'Immagine di copertina dell’articolo originale sulle deformazioni strutturali',
    overview: [
      'Fessure, porte che non chiudono o pavimenti non in piano possono avere molte cause. Solo un tecnico strutturale abilitato può stabilire se si tratta di un problema strutturale.',
      'L’originale descriveva tecniche avanzate di monitoraggio, modellazione e consolidamento. Non le ripubblichiamo: il loro impiego va valutato e progettato da professionisti incaricati.',
      'Possiamo aiutarti a raccogliere le informazioni iniziali e a individuare a chi rivolgerti.',
    ],
    questions: ['Da quando hai notato le fessure? Si sono allargate?', 'Ci sono stati lavori o eventi recenti nelle vicinanze?', 'Esistono documenti strutturali dell’edificio?'],
    claimsToReview: [],
  },
];

// Fail early if public full text lacks its transparent documentary review record.
for (const article of articles) {
  const hasApprovalRecord = Boolean(
    article.review.responsible?.trim() &&
    article.review.reviewedAt &&
    article.review.sources.length &&
    article.review.sources.every(source => source.title.trim() && source.url.trim() && source.verifiedAt && source.scope.trim()) &&
    article.claimsToReview.length === 0
  );
  if (article.reviewStatus === 'documentary-review' && (!article.approvedFullText?.trim() || !hasApprovalRecord)) {
    throw new Error(`Article ${article.slug} is published without its complete documentary review record.`);
  }
  if (article.reviewStatus !== 'documentary-review' && article.approvedFullText !== null) {
    throw new Error(`Article ${article.slug} contains full text without documentary review.`);
  }
}

export const articleBySlug = new Map(articles.map(a => [a.slug, a]));
export const guides = articles.filter(a => a.isGuide);
export const categories = Array.from(new Set(articles.map(a => a.category)));

export function formatDate(iso: string | null) {
  if (!iso) return 'Data non indicata';
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T12:00:00`));
}

const norm = (s: string) => s.toLocaleLowerCase('it-IT').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export function searchArticles(query: string) {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return articles;
  return articles.filter(a => {
    const hay = norm(`${a.title} ${a.summary} ${a.category}`);
    return terms.every(t => hay.includes(t));
  });
}

/** Legacy non-article paths from the source sitemap, mapped one-to-one. /translation-ok is intentionally excluded. */
export const legacyRedirects: Record<string, string> = {
  '/chi-siamo': '/come-lavoriamo',
  '/recensioni': '/progetti',
  '/ristrutturazioni-chiavi-in-mano-cefalu-e-palermo-marenetto': '/servizi',
  '/general-contractor': '/servizi',
  '/edilizia-e-ristrutturazioni': '/articoli',
  '/bonus-edilizi-e-permessi': '/guide',
  '/cantieri-e-lavori': '/progetti',
  '/outdoor-e-garden-design': '/servizi',
  '/assistenza-e-pronto-intervento': '/contatti',
};
