// Documentary consultation, not legal/technical sign-off. Do not silently
// replace consultedOn with the build date or turn a located index into a read act.
const consultedOn = '2026-11-25';
const national = article => `https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:2001-06-06;380~art${article}!vig=`;
export const sources = [
  {
    id: 'purchase', title: 'Agenzia delle Entrate — L’acquisto della casa',
    url: 'https://www1.agenziaentrate.gov.it/web_app_entrate/guida_acquisto_casa.html/1000',
    consultedOn, status: 'consulted',
    scope: 'Sezione prima dell’acquisto: verifiche catastali e ipotecarie.',
    limit: 'Guida datata marzo 2024. Non utilizzata per aliquote, bonus o regole fiscali attuali; non certifica regolarità urbanistica.',
  },
  ...[
    ['9bis', 'Stato legittimo', 'Distinzione fra ricostruzione dello stato legittimo e sola documentazione catastale.'],
    ['6bis', 'CILA', 'Comunicazione asseverata e rispetto delle altre normative di settore.'],
    ['10', 'Permesso di costruire', 'Categorie nazionali e necessità di leggere il recepimento regionale.'],
    ['22', 'SCIA', 'Categorie nazionali, varianti e atti ulteriori per beni tutelati.'],
  ].map(([article, label, scope]) => ({
    id: `dpr-${article}`, title: `Normattiva — D.P.R. 380/2001, art. ${article.replace('bis', '-bis')} — ${label}`,
    url: national(article), consultedOn, status: 'consulted', scope,
    limit: 'Letto il testo dell’articolo nella visualizzazione vigente al 25/11/2026. Applicazione siciliana e valutazione del singolo caso da revisionare professionalmente.',
  })),
  {
    id: 'sicily', title: 'Regione Siciliana — L.R. 16/2016, testo coordinato',
    url: 'https://www.regione.sicilia.it/system/files/2025-04/lr%2016_2016%20agg%2028%20feb%202025.pdf',
    consultedOn, status: 'consulted-with-currency-limit',
    scope: 'Letti artt. 1 e 3, ambito dell’art. 5 e art. 10 sul recepimento modificato di SCIA e SCIA alternativa.',
    limit: 'Il documento dichiara vigenza al 28/02/2025 e coordinamento alla L.R. 27/2024. NON certifica assenza di aggiornamenti successivi. Verifica completa al momento del rilascio ancora necessaria.',
  },
  {
    id: 'sue', title: 'Comune di Cefalù — SUE, Sportello Unico per l’Edilizia',
    url: 'https://comune.cefalu.pa.it/servizio/sue-sportello-unico-per-ledilizia/',
    consultedOn, status: 'consulted',
    scope: 'Canale telematico rivolto ai professionisti; rinvio all’ufficio per tempi e scadenze.',
    limit: 'Pagina aggiornata il 16/01/2026. Consultare l’ufficio per procedura e allegati della pratica specifica; nessun invio effettuato.',
  },
  {
    id: 'office', title: 'Comune di Cefalù — Ufficio Edilizia Privata e Pianificazione Urbanistica',
    url: 'https://comune.cefalu.pa.it/amministrazione/unita_organizzativa/edilizia-privata-pianificazione-urbanistica/',
    consultedOn, status: 'consulted',
    scope: 'Competenze, rapporto con i professionisti, accesso documentale e collegamenti agli strumenti comunali.',
    limit: 'Pagina aggiornata il 06/05/2026. Non prova la conformità di un immobile né l’assenza di altri enti competenti.',
  },
  {
    id: 'landscape-notice', title: 'Comune di Cefalù — Avviso di adozione del Piano Paesaggistico provinciale',
    url: 'https://comune.cefalu.pa.it/novita/adozione-del-piano-paesaggistico-degli-ambiti-3-4-5-6-7-8-10-e-12-ricadenti-nella-provincia-di-palermo/',
    consultedOn, status: 'consulted-notice-only',
    scope: 'Avviso del 23/07/2026 relativo agli ambiti indicati nella pagina.',
    limit: 'Consultato l’avviso, NON tutti gli allegati, le cartografie o le prescrizioni. Non dimostra l’applicabilità a una particella: occorre verifica tecnica.',
  },
  {
    id: 'landscape-code', title: 'Normattiva — D.Lgs. 42/2004, Codice dei beni culturali e del paesaggio',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2004-01-22;42!vig=',
    consultedOn, status: 'index-consulted',
    scope: 'Identificazione del riferimento normativo e indice dell’atto nella visualizzazione vigente.',
    limit: 'Non acquisito con successo il testo integrale esportato. Non presentare il solo indice come verifica di tutti gli articoli, aggiornamenti o autorizzazioni applicabili.',
  },
  {
    id: 'landscape-simplified', title: 'Gazzetta Ufficiale — D.P.R. 31/2017',
    url: 'https://www.gazzettaufficiale.it/eli/id/2017/03/22/17G00042/sg',
    consultedOn, status: 'consulted-original',
    scope: 'Regolamento originario su interventi esclusi dall’autorizzazione paesaggistica o soggetti a procedura semplificata.',
    limit: 'La consultazione dell’atto originario non certifica il quadro vigente completo né la categoria applicabile all’intervento. Non dedurre un’esenzione dal solo nome del lavoro.',
  },
  {
    id: 'microverlay', title: 'Isoplam — Microverlay, pagina del sistema',
    url: 'https://www.isoplam.it/prodotto/microverlay-prodotto-per-micro-cemento/',
    consultedOn, status: 'consulted',
    scope: 'Identificazione del sistema e disponibilità della relativa scheda tecnica.',
    limit: 'Fonte del produttore, non prova che Marenetto impieghi questo sistema, sia partner o abbia certificazioni.',
  },
  {
    id: 'sicily-circular', title: 'Regione Siciliana — Circolare 1/2025, prot. 8325 del 28 maggio 2025',
    url: 'https://www.regione.sicilia.it/system/files/2025-05/Circolare%20n.%201_2025%20prot.%20n.%208325%20%20del%2028.05.2025.pdf',
    consultedOn, status: 'consulted',
    scope: 'Chiarimenti regionali sul recepimento dinamico del D.P.R. 380/2001, sulle eccezioni recepite con modifiche e sul Capo II della L.R. 27/2024.',
    limit: 'Circolare amministrativa del 2025, non attestazione della regolarità di un immobile né verifica esaustiva degli aggiornamenti successivi. L’estrazione presenta errori OCR: non riprodurre numeri o termini ambigui come testo di legge.',
  },
  {
    id: 'management', title: 'Marenetto Build — Gestione immobili con Cefalù Apartments',
    url: 'https://www.marenettobuild.com/gestione-affitti-brevi-cefalu',
    consultedOn, status: 'consulted-public-canonical-and-sitemap',
    scope: 'Pagina pubblica del servizio distinto di gestione: pratiche, CIN, OTA, pulizie e check-in secondo incarico. Canonical e presenza in sitemap verificati.',
    limit: 'Fonte aziendale, non prova indipendente di risultati, garanzie di rendimento o competenze professionali riservate. La gestione resta distinta dall’appalto edile.',
  },
  {
    id: 'microverlay-sheet', title: 'Isoplam — Sistema Microverlay, scheda tecnica',
    url: 'https://www.isoplam.it/download/microverlay-scheda-tecnica/?wpdmdl=4705',
    consultedOn, status: 'consulted',
    scope: 'Descrizione, campi d’impiego su oggetti di design, scelta del protettivo, pulizia e manutenzione.',
    limit: 'Non rilevata una data/revisione esplicita nel testo estratto: non inventarla. Istruzioni pertinenti solo al ciclo effettivo, ancora da confermare. Non trasferire classi di pavimenti/pareti al mobile finito né dichiarare proprietà alimentari.',
  },
];

export const unsuccessfulChecks = [
  {
    url: 'https://www.regione.sicilia.it/sites/default/files/2025-05/Circolare%20n.%201_2025%20prot.%20n.%208325%20%20del%2028.05.2025.pdf',
    consultedOn, outcome: 'Il collegamento trovato nella ricerca ha restituito una pagina non trovata. Non usato come fonte letta.',
  },
  {
    url: 'https://www.normattiva.it/esporta/attoCompleto?atto.dataPubblicazioneGazzetta=2001-10-20&atto.codiceRedazionale=001G0429',
    consultedOn, outcome: 'Errore di caricamento nell’esportazione. Consultati invece con successo i singoli articoli elencati sopra.',
  },
  {
    url: 'https://www.normattiva.it/esporta/attoCompleto?atto.dataPubblicazioneGazzetta=2004-02-24&atto.codiceRedazionale=004G0066',
    consultedOn, outcome: 'Errore di caricamento nell’esportazione. L’indice dell’atto non è una verifica integrale del testo.',
  },
];
