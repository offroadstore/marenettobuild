/*
 * Curated, typed content library derived from content/source-articles-it.json.
 * The archival JSON is intentionally NOT imported into the browser bundle.
 * Each record keeps its exact historical slug; summaries are neutral rewrites,
 * and any claim that could not be verified is listed under `claimsToReview`.
 */

export type ReviewStatus = 'technical-review' | 'editorial-review' | 'summary-reviewed';
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
  'technical-review': { short: 'In revisione tecnica', long: 'Il testo originale contiene affermazioni tecniche che devono essere verificate da un professionista prima di qualsiasi ripubblicazione.' },
  'editorial-review': { short: 'In revisione editoriale', long: 'Il testo originale ha un tono promozionale e affermazioni non documentate: è in corso una revisione editoriale.' },
  'summary-reviewed': { short: 'Sintesi revisionata', long: 'La sintesi su questa pagina è stata riletta; le affermazioni specifiche dell’originale restano comunque in verifica.' },
};

export const articles: Article[] = [
  {
    slug: 'comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali',
    title: 'Comprare e ristrutturare casa a Cefalù: i controlli da considerare',
    originalTitle: 'Buying and Renovating a House in Cefalù: A Technical Guide to the 5 Essential Checks',
    summary: 'Una panoramica degli aspetti da approfondire prima di acquistare un immobile da ristrutturare: impianti, documenti, stato dell’edificio e vincoli.',
    category: 'Acquisto e ristrutturazione', publishedOn: '2026-03-25', reviewStatus: 'summary-reviewed', isGuide: true,
    image: img('comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sull’acquisto di una casa a Cefalù',
    overview: [
      'Prima di acquistare una casa da ristrutturare è utile separare ciò che si vede da ciò che va verificato. Lo stato apparente di muri, coperture e impianti non basta a capire quali lavori serviranno.',
      'Gli aspetti documentali — conformità urbanistica e catastale, eventuali vincoli nel centro storico — richiedono il parere di tecnici abilitati e, se necessario, del notaio.',
      'Un primo confronto con noi può aiutare a ordinare le domande e a capire quali professionisti coinvolgere. Non sostituisce una perizia né una verifica documentale.',
    ],
    questions: ['Quali documenti urbanistici e catastali sono disponibili?', 'Quando sono stati realizzati o rifatti gli impianti?', 'Ci sono segni di umidità, fessurazioni o infiltrazioni da far valutare?', 'L’immobile ricade in zone con vincoli particolari?'],
    claimsToReview: ['structural-diagnosis', 'absolute-claims'],
  },
  {
    slug: 'impresa-edile-a-cefalu',
    title: 'Un’impresa edile a Cefalù: come impostare il primo confronto',
    originalTitle: 'Construction Company in Cefalù: Turning Your Vision into Reality',
    summary: 'Che cosa chiarire con un’impresa locale prima di iniziare: perimetro dei lavori, ruoli, pratiche e modalità di aggiornamento.',
    category: 'Impresa e servizi', publishedOn: '2026-02-10', reviewStatus: 'editorial-review', isGuide: false,
    image: img('impresa-edile-a-cefalu.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sui lavori edili a Cefalù',
    overview: [
      'L’articolo originale presentava l’impresa con formule promozionali. Qui ne riportiamo solo il nucleo utile: un lavoro edile parte da un perimetro definito e da ruoli chiari.',
      'Pratiche edilizie, progettazione e direzione lavori sono attività che spettano a professionisti abilitati incaricati; il loro coinvolgimento va concordato caso per caso.',
      'Sopralluoghi, tempi e modalità di intervento vengono definiti dopo aver compreso la richiesta, senza promesse preventive.',
    ],
    questions: ['Quali lavori sono inclusi e quali esclusi?', 'Chi segue le pratiche e chi firma la documentazione tecnica?', 'Come e con quale frequenza ricevo aggiornamenti?'],
    claimsToReview: ['durations', 'absolute-claims', 'certifications'],
  },
  {
    slug: 'ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni',
    title: 'Infiltrazioni e umidità: come impostare una verifica',
    originalTitle: 'Water and Moisture Leak Detection: How to Address It Without Demolition',
    summary: 'Come raccogliere sintomi e informazioni su macchie, umidità e perdite, e perché la causa va individuata prima di scegliere un intervento.',
    category: 'Cura della proprietà', publishedOn: '2026-02-06', reviewStatus: 'technical-review', isGuide: true,
    image: img('ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni.png'), imageAlt: 'Immagine di copertina dell’articolo originale sulla ricerca di infiltrazioni',
    overview: [
      'Macchie, distacchi di intonaco o odore di umido possono avere cause diverse: perdite di impianto, risalita capillare, condensa, infiltrazioni da coperture o terrazzi.',
      'L’originale descriveva strumenti e risultati specifici, inclusa la possibilità di intervenire sempre senza demolizioni. Queste affermazioni sono in revisione tecnica e non vengono riproposte.',
      'Per chi vive all’estero è utile annotare quando compare il problema, dopo quali eventi e in quali stanze, e condividere fotografie datate. Le foto aiutano a capire, ma non costituiscono una diagnosi.',
    ],
    questions: ['Il problema peggiora dopo la pioggia o con l’uso dell’acqua?', 'Da quanto tempo è visibile?', 'Ci sono impianti o terrazzi sopra o accanto alla zona interessata?'],
    claimsToReview: ['structural-diagnosis', 'equipment-ownership', 'absolute-claims', 'performance'],
  },
  {
    slug: 'garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto',
    title: 'Garanzie sui lavori edili: che cosa chiedere e verificare',
    originalTitle: '10-Year Warranty on Construction Work: The Marenetto Decennial Insurance Policy',
    summary: 'Un promemoria neutrale su come informarsi riguardo garanzie e coperture assicurative prima di affidare un lavoro. Nessuna copertura viene qui dichiarata.',
    category: 'Tutele e garanzie', publishedOn: '2025-12-31', reviewStatus: 'technical-review', isGuide: false,
    image: img('garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto.png'), imageAlt: 'Immagine di copertina dell’articolo originale su garanzie e polizze',
    overview: [
      'L’articolo originale descriveva una specifica polizza decennale. Non ripubblichiamo questa affermazione finché non sarà verificata documentalmente: la sua presenza in archivio non costituisce un impegno.',
      'In generale, garanzie e coperture assicurative dipendono dal tipo di intervento, dal contratto e dalle condizioni della polizza eventualmente sottoscritta.',
      'Se l’argomento è importante per la tua decisione, chiedi la documentazione scritta e falla esaminare da un consulente di fiducia.',
    ],
    questions: ['Esiste una polizza per questo specifico intervento? Posso leggerne le condizioni?', 'Che cosa è escluso dalla copertura?', 'Chi è il soggetto garante?'],
    claimsToReview: ['insurance-guarantee', 'durations', 'absolute-claims'],
  },
  {
    slug: 'cappotto-termico-vs-intonaco-termico-cefalu',
    title: 'Cappotto termico e intonaco termico: criteri di confronto',
    originalTitle: 'Thermal Insulation vs Thermal Plaster: The Best Choice for Sicily',
    summary: 'Due approcci all’isolamento delle pareti messi a confronto in modo generale: spessori, contesto dell’edificio e verifiche da affidare a un tecnico.',
    category: 'Isolamento ed energia', publishedOn: '2025-12-27', reviewStatus: 'technical-review', isGuide: true,
    image: img('cappotto-termico-vs-intonaco-termico-cefalu.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sul confronto tra cappotto e intonaco termico',
    overview: [
      'Cappotto e intonaco termico rispondono a esigenze diverse. La scelta dipende da struttura, esposizione, spazio disponibile, vincoli di facciata e obiettivi del proprietario.',
      'L’originale indicava valori di prestazione, costi e possibili agevolazioni fiscali. Questi dati sono in revisione tecnica e non vengono riportati: vanno calcolati da un professionista sul singolo edificio.',
      'Un confronto preliminare può aiutare a chiarire le domande da porre; la valutazione energetica resta in capo a tecnici abilitati.',
    ],
    questions: ['La facciata è soggetta a vincoli?', 'Esiste una diagnosi energetica dell’edificio?', 'Quali sono gli obiettivi: comfort estivo, invernale, condensa?'],
    claimsToReview: ['performance', 'tax-bonuses', 'absolute-claims'],
  },
  {
    slug: 'pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete',
    title: 'Pavimentazioni esterne in cemento stampato: cosa considerare',
    originalTitle: 'Isoplam Outdoor Floors: Complete Guide to Stamped Concrete and Skyconcrete',
    summary: 'Aspetti pratici per valutare una pavimentazione esterna decorativa: sottofondo, pendenze, uso previsto e manutenzione.',
    category: 'Finiture e superfici', publishedOn: '2025-12-23', reviewStatus: 'technical-review', isGuide: true,
    image: img('pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete.png'), imageAlt: 'Immagine di copertina dell’articolo originale sulle pavimentazioni esterne',
    overview: [
      'Una pavimentazione esterna dipende prima di tutto dal sottofondo, dal drenaggio e dall’uso: passaggio pedonale, carrabile, bordo piscina.',
      'L’originale citava sistemi di marca, certificazioni e durate. Queste indicazioni sono in revisione e non vengono ripubblicate.',
      'La scelta di materiale e finitura va concordata dopo un sopralluogo e sulla base delle schede tecniche aggiornate del produttore.',
    ],
    questions: ['Quale sarà l’uso prevalente della superficie?', 'Come defluisce oggi l’acqua piovana?', 'Quale manutenzione sei disposto a prevedere?'],
    claimsToReview: ['certifications', 'durations', 'performance'],
  },
  {
    slug: 'ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam',
    title: 'Microcemento su superfici esistenti: quando valutarlo',
    originalTitle: 'Renovate Without Demolition: The Complete Guide to Microverlay Isoplam Microcement',
    summary: 'In quali casi un rivestimento a basso spessore può essere preso in considerazione e quali verifiche sul supporto servono prima.',
    category: 'Finiture e superfici', publishedOn: '2025-12-22', reviewStatus: 'technical-review', isGuide: true,
    image: img('ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sul microcemento',
    overview: [
      'I rivestimenti a basso spessore possono essere applicati su alcune superfici esistenti, ma solo se il supporto è stabile, asciutto e compatibile.',
      'L’originale presentava il rinnovo senza demolizioni come sempre possibile e citava prestazioni di prodotto. Queste affermazioni sono in revisione tecnica.',
      'Prima di scegliere, è utile valutare lo stato del pavimento esistente, l’umidità e l’uso dell’ambiente.',
    ],
    questions: ['Il pavimento esistente presenta piastrelle che suonano vuote o crepe?', 'L’ambiente è soggetto a umidità?', 'Ci sono vincoli di quota con porte e soglie?'],
    claimsToReview: ['absolute-claims', 'performance', 'certifications'],
  },
  {
    slug: 'gestione-manutenzione-immobile',
    title: 'Manutenzione della proprietà quando vivi lontano',
    originalTitle: 'Property Maintenance Management',
    summary: 'Come organizzare controlli periodici e piccoli interventi su una casa che resta vuota per parte dell’anno.',
    category: 'Cura della proprietà', publishedOn: '2025-12-16', reviewStatus: 'summary-reviewed', isGuide: true,
    image: img('gestione-manutenzione-immobile.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sulla manutenzione immobiliare',
    overview: [
      'Una casa vissuta solo in alcuni periodi beneficia di controlli regolari: aperture, impianti, coperture, esterni dopo eventi meteo.',
      'Attività, frequenze e modalità di aggiornamento si concordano per singolo immobile. Manutenzione, pulizie e gestione degli affitti restano servizi distinti.',
      'L’originale indicava tempi di intervento e livelli di servizio non documentati: non vengono ripubblicati.',
    ],
    questions: ['Quali parti della casa ti preoccupano di più quando sei lontano?', 'Preferisci aggiornamenti a cadenza fissa o solo su necessità?', 'Chi altro ha accesso alla proprietà?'],
    claimsToReview: ['durations', 'absolute-claims'],
  },
  {
    slug: 'garden-design-esclusivo',
    title: 'Giardini mediterranei: impostare un progetto esterno',
    originalTitle: 'Exclusive Garden Design',
    summary: 'Spunti per ragionare su un giardino in clima mediterraneo: specie adatte, acqua, percorsi e manutenzione nel tempo.',
    category: 'Esterni e giardini', publishedOn: '2025-12-16', reviewStatus: 'editorial-review', isGuide: false,
    image: img('garden-design-esclusivo.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sulla progettazione di giardini',
    overview: [
      'Un giardino vicino al mare va pensato con il clima: esposizione, vento, salsedine, disponibilità d’acqua.',
      'Specie mediterranee come olivo, carrubo, rosmarino e lentisco sono spesso considerate per la loro adattabilità; la scelta va comunque valutata sul sito.',
      'L’originale descriveva servizi di modellazione 3D e impianti specifici: questi elementi sono in revisione editoriale.',
    ],
    questions: ['Quanto tempo trascorri nella proprietà e in quali stagioni?', 'Chi si occuperà della manutenzione del verde?', 'Esiste già un impianto di irrigazione?'],
    claimsToReview: ['absolute-claims', 'equipment-ownership'],
  },
  {
    slug: 'opere-in-pietra-e-prospetti',
    title: 'Pietra e facciate: materiali e cura delle finiture',
    originalTitle: 'Stone Works and Facades',
    summary: 'Considerazioni generali sull’uso della pietra in facciata e sugli aspetti da verificare prima di un intervento su un prospetto.',
    category: 'Finiture e superfici', publishedOn: '2025-12-16', reviewStatus: 'editorial-review', isGuide: false,
    image: img('opere-in-pietra-e-prospetti.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale su opere in pietra',
    overview: [
      'La pietra è un materiale ricorrente nell’architettura siciliana. La scelta del tipo e della lavorazione dipende dal contesto e dagli eventuali vincoli.',
      'L’originale conteneva affermazioni assolute su durata, isolamento e integrità strutturale. Sono in revisione e non vengono ripubblicate.',
      'Gli interventi sui prospetti possono richiedere autorizzazioni: vanno valutati con un tecnico abilitato.',
    ],
    questions: ['L’edificio si trova in un contesto vincolato?', 'Si tratta di restauro o di nuova realizzazione?', 'Ci sono campioni o riferimenti di pietra già scelti?'],
    claimsToReview: ['absolute-claims', 'performance', 'durations'],
  },
  {
    slug: 'pavimenti-stampati-in-resina',
    title: 'Pavimenti in resina stampata: vantaggi e limiti da valutare',
    originalTitle: 'Stamped Resin Flooring',
    summary: 'Una lettura equilibrata delle superfici decorative continue, per interni ed esterni: supporto, uso, manutenzione.',
    category: 'Finiture e superfici', publishedOn: '2025-12-15', reviewStatus: 'technical-review', isGuide: false,
    image: img('pavimenti-stampati-in-resina.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sui pavimenti in resina',
    overview: [
      'Le superfici continue decorative sono apprezzate per l’assenza di fughe e la varietà di finiture.',
      'L’originale dichiarava resistenza estrema, durata e posa senza demolizioni in modo generalizzato. Queste affermazioni sono in revisione tecnica.',
      'Prestazioni e idoneità dipendono da supporto, prodotto e posa: si valutano con schede tecniche e sopralluogo.',
    ],
    questions: ['Interno o esterno? Con quale esposizione al sole?', 'Che tipo di traffico è previsto?', 'Com’è il supporto attuale?'],
    claimsToReview: ['performance', 'durations', 'absolute-claims'],
  },
  {
    slug: 'piscine-e-laghetti-zen',
    title: 'Piscine e specchi d’acqua: domande prima di iniziare',
    originalTitle: 'Zen Pools and Ponds',
    summary: 'Gli aspetti da chiarire prima di valutare una piscina o un laghetto ornamentale: terreno, accessi, autorizzazioni e manutenzione.',
    category: 'Esterni e giardini', publishedOn: '2025-12-15', reviewStatus: 'editorial-review', isGuide: false,
    image: img('piscine-e-laghetti-zen.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale su piscine e laghetti',
    overview: [
      'Una piscina o un laghetto incidono su terreno, drenaggi e accessi al cantiere: sono i primi aspetti da valutare.',
      'L’originale prometteva acqua sempre cristallina ed esecuzione impeccabile nel tempo. Affermazioni di questo tipo sono in revisione editoriale.',
      'La realizzazione può richiedere titoli edilizi e la manutenzione va pianificata, soprattutto se la proprietà resta vuota per periodi lunghi.',
    ],
    questions: ['Il terreno è in pendenza? Com’è l’accesso per i mezzi?', 'Chi gestirà la manutenzione dell’acqua?', 'Sono già state verificate le autorizzazioni necessarie?'],
    claimsToReview: ['absolute-claims', 'performance', 'durations'],
  },
  {
    slug: 'cucine-in-muratura-luxury',
    title: 'Cucine in muratura ed esterne: materiali e scelte',
    originalTitle: 'Luxury Built-in Kitchens',
    summary: 'Spunti su materiali, esposizione e uso per una cucina in muratura, anche all’aperto, con attenzione alla manutenzione.',
    category: 'Esterni e giardini', publishedOn: '2025-12-15', reviewStatus: 'editorial-review', isGuide: false,
    image: img('cucine-in-muratura-luxury.jpg'), imageAlt: 'Immagine di copertina dell’articolo originale sulle cucine in muratura',
    overview: [
      'Una cucina in muratura, soprattutto esterna, va pensata per l’esposizione: sole, salsedine, pioggia e periodi di inutilizzo.',
      'L’originale aveva un tono marcatamente promozionale e citava tecnologie e finiture di pregio senza riferimenti a lavori documentati. È in revisione editoriale.',
      'Materiali, impianti e posizione si definiscono insieme, con verifiche su allacci e scarichi.',
    ],
    questions: ['Sarà usata tutto l’anno o solo d’estate?', 'Sono disponibili allacci per acqua, gas o elettricità?', 'Che materiali hai già in mente?'],
    claimsToReview: ['absolute-claims'],
  },
  {
    slug: 'tecniche-avanzate-gestione-deformazioni-strutture-edili',
    title: 'Deformazioni negli edifici: perché serve una valutazione tecnica',
    originalTitle: 'Advanced Techniques for Managing Deformations in Modern Building Structures',
    summary: 'Una nota prudente su fessurazioni e deformazioni: perché il primo passo è sempre il parere di un professionista strutturale abilitato.',
    category: 'Strutture e verifiche', publishedOn: '2024-06-20', reviewStatus: 'technical-review', isGuide: false,
    image: img('tecniche-avanzate-gestione-deformazioni-strutture-edili.png'), imageAlt: 'Immagine di copertina dell’articolo originale sulle deformazioni strutturali',
    overview: [
      'Fessure, porte che non chiudono o pavimenti non in piano possono avere molte cause. Solo un tecnico strutturale abilitato può stabilire se si tratta di un problema strutturale.',
      'L’originale descriveva tecniche avanzate di monitoraggio, modellazione e consolidamento. Non le ripubblichiamo: il loro impiego va valutato e progettato da professionisti incaricati.',
      'Possiamo aiutarti a raccogliere le informazioni iniziali e a individuare a chi rivolgerti.',
    ],
    questions: ['Da quando hai notato le fessure? Si sono allargate?', 'Ci sono stati lavori o eventi recenti nelle vicinanze?', 'Esistono documenti strutturali dell’edificio?'],
    claimsToReview: ['structural-diagnosis', 'performance', 'absolute-claims'],
  },
];

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
