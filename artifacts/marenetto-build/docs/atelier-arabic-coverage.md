# Atelier internazionale e arabo — consegna al titolare

## Perimetro e autorizzazione

Sviluppo nella copia di lavoro aggiornata alla versione principale che contiene
Fase 6, gestione affitti brevi e correzioni SEO. Nessun deploy, Republish,
IndexNow, creazione account, modifica secret/flag SMTP o invio email reale.
La pubblicazione rimane al titolare tramite Claude.

Le regole commerciali provengono dal titolare, non da progetti documentati:

- entro circa 60 km da Cefalù, preventivi ordinari;
- oltre, progetti di dimensione adeguata valutati con preventivo dedicato che
  include trasferta del team e logistica;
- Sicilia, Italia, Europa, Dubai/Golfo e Stati Uniti sono mercati di interesse,
  **non paesi/clienti/progetti già serviti**;
- contractor locale autorizzato o subappalto specializzato ove richiesto;
- accesso, sicurezza, fuoco, installazione, dogana e norme locali da valutare;
  nessuna garanzia nautica o di fattibilità universale;
- nessun prezzo pubblico, calendario, vettore, sede estera o personale
  arabofono inventato. Nessuna promessa di NDA o caricamento protetto.

## Copertura

| Superficie | Edizioni arabe | Trattamento |
|---|---:|---|
| Home, servizi, metodo, proprietari esteri, richiesta, contatti | 6 | Cataloghi completi e dizionario per le stringhe condivise; metadati dedicati |
| Articoli, guide e ricerca | 3 | Indice arabo, sei guide selezionate e ricerca locale funzionante; ricerca noindex |
| Articoli editoriali | 14 | Nuove composizioni arabe complete, fonti italiane e impronte di revisione |
| Categorie, tag, recensioni, pagina ristrutturazioni | 22 | Controparti degli archivi attivi; schede arabe, non testi italiani sotto titoli arabi |
| Servizi locale/premium | 2 | Distinzione geografica conservata |
| Privacy, cookie, trasparenza IA | 3 | Moduli, paese, lingua, consensi e limitazioni descritti |
| Zone, 20 località, arredi, trasferte | 23 | Testi locali; nessuna nuova landing cittadina internazionale |
| Rete professionisti | 12 | Tutte le sezioni, FAQ, checklist, alt e avvertenze in arabo |
| Gestione affitti brevi | 1 | Partner e ruoli distinti, controparti delle dodici edizioni esistenti |
| Atelier | 1 | Pagina sostanziale anche nelle altre dodici lingue |
| **Totale** | **87** | **86 indicizzabili; ricerca esclusa dagli indici** |

Le edizioni arabe non sono falsi recuperi di un sito storico: non è stato
aggiunto alcun originale arabo all'inventario storico. Gli articoli sono
adattamenti nuovi, identificati come tali. Le affermazioni storiche assolute
non comprovate sono state qualificate, non rilanciate come garanzie. Gli
archivi prima vuoti hanno un'introduzione informativa e collegamenti pertinenti,
non un portfolio inventato.

I contenuti della Fase 5 non sono stati avviati né attivati in questa consegna.

## Revisione linguistica e fonti

Arabo standard professionale con terminologia comprensibile nei mercati del
Golfo. Confronto bilingue assistito da IA contro i testi italiani/inglesi,
incluse distinzioni tra progettista, professionista incaricato, impresa,
installatore e contractor autorizzato. **Non è una certificazione di madrelingua,
una consulenza legale/tecnica o una verifica delle abilitazioni aziendali.**

La revisione conserva il processo Atelier in questo ordine:

1. richiesta riservata;
2. misure o planimetrie fornite dal cliente;
3. render 3D;
4. approvazione del cliente;
5. materiali artigianali preparati in Sicilia e spediti;
6. squadra Marenetto che costruisce e assembla sul posto.

Terminologia: Italian craftsmen, turnkey, fit-out, on-site installation team,
bespoke microcement and concrete furniture, made to order, works internationally.
La formulazione locale ne spiega i limiti, senza promettere tutte le prestazioni
professionali o autorizzazioni in un contratto generico.

Le keyword fornite dal titolare sono input redazionali, non volumi o posizioni
misurati. Non sono state create landing duplicate Dubai/Abu Dhabi/Riyadh/Doha.
I titoli ufficiali delle fonti normative italiane restano titoli di documenti
in lingua originale, marcati `lang="it"`; i loro URL e i limiti della precedente
consultazione non sono stati trasformati in nuove verifiche normative.
Le recensioni Google, se disponibili, mantengono lingua e attribuzione originali.

## Immagini e font

Nessuna nuova immagine generata o logo/hero approvato modificato. Atelier riusa:

- `bespoke-2`: tavolo scultoreo in cemento, scena illustrativa;
- `bespoke-0`: cucina con piano in cemento, scena illustrativa;
- `outdoors-2`: terrazza con pergola, scena illustrativa.

Sono WebP esistenti nell'inventario rete/App Storage, con dimensioni,
varianti responsive, `srcset`, alt locali e **didascalia IA su ogni immagine**.
Non rappresentano lavori eseguiti, clienti o un portfolio internazionale.

Font Noto Sans Arabic WOFF2 già locali, pesi variabili 400–800, subset Unicode,
`font-display: swap` e preload arabo mirato. Nessuna richiesta Google Fonts.
Email, telefoni e codice ricevuta del modulo sono isolati come contenuti LTR;
logo e fotografie non sono specchiati.

## Richiesta riservata

La CTA apre il modulo chiamata esistente con `atelier_international`.
Il paese è un campo separato dalla località, obbligatorio per questo tipo.
Attraversa contratto OpenAPI/client generati, validazione, dato JSONB, email
al titolare, vista proprietario, filtro e CSV. Le richieste storiche prive di
paese restano valide; non è necessaria una conversione dei dati.

Per Atelier il budget non viene richiesto né inviato. Marketing e WhatsApp
restano separati, facoltativi e non preselezionati. L'arabo attraversa preferenza,
versione e lingua dell'informativa, prova del consenso e conferma cliente.
Retention, idempotenza, antispam, trasporto simulato e accesso solo titolare
sono preservati. L'informativa chiamata è aggiornata senza cambiare basi
giuridiche o fornitori; il modulo progetto email-only rimane un flusso distinto.

## Verifiche e riproducibilità

Comandi e rapporti:

- `scripts/arabic-coverage.mjs`: inventario effettivo da SSR, errori, stringhe
  mancanti, link, metadati e schemi; rapporto in
  `generated-artifacts/atelier/arabic-coverage.json`.
- `scripts/arabic-site.test.mjs`: corpi integrali, impronte sorgenti/traduzioni,
  metadati, RTL iniziale, font, copertura famiglie, hreflang reciproci e indici.
- `scripts/atelier.test.mjs`: tredici edizioni, sei passi, contenuti e Service
  mondiale, senza Product/Offer/prezzi/recensioni inventati.
- suite SEO globale, gestione affitti brevi e font locali;
- test richieste in schema database temporaneo e trasporto email simulato;
- verifica visuale e del percorso riservato sul sito in esecuzione.

Le ricevute di confronto sono legate ai contenuti esatti. Rigenerarle richiede
una nuova comparazione, non basta rimuovere un blocco o cambiare un booleano.
`record-arabic-review.mjs --record-ai-assisted-comparison` registra soltanto
il confronto dichiarato: non pubblica né costituisce un'approvazione professionale.

Gli esiti finali e gli eventuali limiti operativi sono nel rapporto di consegna.
Le anteprime e l'area privata restano escluse dagli indici; le ritirate runtime
hanno precedenza sull'inventario statico. Nessuna promessa di indicizzazione.

## Esiti della copia candidata

- Build produzione e typecheck dell'intero workspace superati.
- 68 test SEO/i18n/font/servizi/privacy/affitti brevi/arabo superati.
- 9 test rete superati: 156 corpi completi, 34 scene, 102 varianti WebP;
  i controlli di pubblicabilità delle dodici edizioni precedenti non sono cambiati.
- 28 test richieste superati in schema temporaneo, inclusi paese, tipo Atelier,
  arabo, consensi, accesso titolare, filtri, CSV e trasporto simulato.
- Un solo percorso critico browser superato: modulo arabo mobile, paese mancante,
  invio sintetico intercettato, ricevuta araba, passaggio nella stessa SPA ad
  inglese e italiano, desktop/mobile senza overflow o fotografie specchiate.
- 86 URL arabi verificati HTTP 200 con metadati iniziali indicizzabili sul solo
  host canonico nel server di test; ricerca 200 ma noindex. Non è una verifica
  della produzione né un'attivazione della sua configurazione.
- Audit di 87 superfici: zero errori SSR, zero traduzioni mancanti, zero link
  interni inesistenti e nessun title/description fuori dai limiti controllati.
- Le 46 anteprime private RTL esistenti conservano il layout; la compilazione
  non genera percorsi di anteprima dai nuovi identificativi storici degli archivi.
- Il gateway isolato dei test inoltra anche le immagini pubbliche della rete:
  tutte le 102 varianti WebP restituiscono 200 con byte e SHA-256 corretti.
  Verificati HEAD, blocco POST e mancato inoltro di moduli e file privati.
- Confronto automatico con la Main integrata: 712 metadati esistenti, 544 schemi
  non-Article, 12 testi affitti brevi, 12 alt hero, 336 combinazioni immagine/lingua
  e 49 file sorgenti originali invariati.

Le fonti italiane storiche ancora sospese sono indicate negli articoli arabi
come riferimenti d'archivio, non come collegamenti pubblici pronti. I nuovi
hreflang arabi non promuovono controparti sospese; non si inventa un x-default
italiano quando non c'è una controparte italiana verificata.

La schermata autenticata del titolare non è stata percorsa nel browser.
API, permessi, persistenza, filtro paese ed esportazione sono stati verificati
nei test isolati; il browser ha verificato il modulo pubblico con risposte
intercettate. Nessuna richiesta reale è stata salvata e nessuna email inviata.
La consegna non certifica abilitazioni, conformità internazionale/nautica,
accordi con contractor o una revisione umana madrelingua.
