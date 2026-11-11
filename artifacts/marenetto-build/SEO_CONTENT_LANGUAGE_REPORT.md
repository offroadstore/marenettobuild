# Marenetto Build — rapporto SEO, contenuti e lingue

> **Avvertenza successiva sulla fedeltà storica:** questo rapporto descrive controlli
> del nuovo generatore e delle rielaborazioni, non una migrazione fedele dimostrata.
> La verifica indipendente successiva trova contenuti storici differenti o mancanti.
> Vedere `HISTORICAL_FIDELITY_FINDINGS.md`. Il lavoro è stato riaperto e la migrazione
> non è dichiarata conclusa. I cinque casi browser rimasti aperti sono stati ora
> effettivamente ripetuti e superati; non confondere questo esito con fedeltà dei testi.

Data: 10 novembre 2026. Prodotto esistente; nessun rilascio o cambio dominio.

## Esito e perimetro

Sono stati preparati HTML completi della stessa UI React, un servizio HTTP con stati reali,
un inventario editoriale per pagina/lingua e bozze separate dai cataloghi storicamente
approvati. Logo, palette, hero fotografica, fotografie e slug storici sono conservati.
L’anteprima resta non indicizzabile. Nessun miglioramento di ranking è promesso.

Le nuove traduzioni NON sono dichiarate approvate. Il lavoro tecnico non sostituisce
il controllo del titolare, una revisione madrelingua o la valutazione di un professionista.

## Baseline effettivamente riconfermata

- SPA con root iniziale vuoto, generatore precedente limitato agli head e fallback
  universale alla home: riscontri confermati nel codice e nella risposta iniziale NL.
- Cambio automatico dalla radice italiana all’inglese riprodotto con browser mobile.
- Zoom bloccato da `maximum-scale=1`: riprodotto nel template.
- Precedenza dei cataloghi di anteprima sulle route normali: confermata nel runtime.
- Chiavi popolate ma ancora contenenti inglese: confermate nei cataloghi di bozza,
  soprattutto NL/PT/UK/SL/SR; non era una prova di traduzione completa.
- Direzione RTL già applicata alla struttura locale, con protezione mobile documentata:
  condizione intenzionale da preservare, non un difetto da “correggere” impostando
  ciecamente `html dir=rtl`.
- Schermata iniziale e finale a 390×844 in `generated-artifacts/seo-audit/`.

Non è stata misurata una baseline prestazionale temporale prima delle modifiche.
Non si dichiara quindi un miglioramento percentuale o un confronto prima/dopo di LCP.
I riscontri dell’audit non riprovati restano riscontri del documento, non nuove prove.

## Matrice e copertura

L’inventario contiene **667 edizioni ordinarie**:

| Famiglia | Calcolo | Edizioni |
|---|---:|---:|
| Sei pagine commerciali | 6 × 29 | 174 |
| Archivio articoli e guide | 2 × 29 | 58 |
| Ricerca | 1 × 29 | 29 |
| Quattordici articoli | 14 × 29 | 406 |

Si aggiungono **644 anteprime esplicite di revisione** e un hub editoriale.
Totale: **1.312 documenti generati**, oltre ai documenti di errore localizzati.
Le 62 mappature storiche sono conservate e normalizzate direttamente alla destinazione
finale, senza catene evitabili.

Matrice completa:
`generated-artifacts/seo-audit/route-matrix.json` e `.csv`.
Il JSON comprende sorgente, stato, prova di approvazione disponibile, lingua del corpo,
H1, metadati, canonical, alternati, collegamenti, presenza in sitemap, riscontri
automatici e verifiche mancanti. Redirect e percorsi esclusi sono registrati separatamente
nello stesso JSON. Le verifiche renderizzate sono in file distinti: una rigenerazione
del build non viene scambiata per un nuovo collaudo browser.

Le route CMS dinamiche non hanno un registro di edizioni approvate disponibile al build:
il servizio pubblico preparato le esclude con 404, anziché pubblicare una shell o
inventare contenuti. Provato il 404 dell’endpoint CMS per una pagina inesistente.
Non è stato effettuato un inventario dei contenuti privati del database di produzione.
Prima di esporre contenuti CMS reali occorre registrarne esplicitamente le edizioni
approvate: questo rapporto non certifica record non consultati.

## Regole editoriali e lingue

- `edition-inventory.ts` governa disponibilità, rendering, selettore, canonical,
  gruppi di equivalenti e sitemap; `edition-approvals.json` conserva prove per edizione.
  Date di approvazione non accertate sono `null`, non ricostruite.
- Sono conservati i record storici di approvazione dei cataloghi. Non sono estesi
  automaticamente alle nuove composizioni di pagina.
- Le 28 edizioni straniere rimangono nel percorso di completamento, riconoscibili
  come da revisionare. Il selettore non le presenta come equivalenti approvati.
- I 27 cataloghi di correzioni aggiuntive sono bozze generate con IA, marcate
  `awaiting-owner-review`, caricate soltanto sulle route esplicite di revisione.
  La presenza di una chiave, uno script corretto o un controllo automatico non
  costituisce revisione linguistica umana.
- Priorità corretta per NL/PT/UK/SL/SR; proposta PT-PT coerente e serbo cirillico.
  Sono state corrette anche le frasi inglesi residue nelle altre bozze.
- Le normali pagine straniere della libreria dichiarano il corpo italiano originale,
  con `lang=it` e direzione LTR. Le bozze tradotte sono link separati.
- Il rendering iniziale carica il catalogo prima del render; il browser usa lo stesso
  catalogo prima di idratare. Le date originali sono espresse in ISO, senza inventare
  revisioni, per evitare differenze ICU/CLDR tra server e browser.

## Consegna HTTP e SEO

Il build produce il corpo completo, H1, collegamenti e head della stessa applicazione
React. Il servizio Node preparato serve il documento corrispondente, non sempre la home.
Il fallback delle aree di autenticazione resta separato dai contenuti pubblicabili.

- 200 per i documenti riconosciuti.
- 308 per slash/alias giustificati; parametri di campagna consentiti conservati,
  parametri personali arbitrari non propagati; frammenti conservati dal browser.
- 404 per percorsi sconosciuti e CMS non registrato; 410 per `/translation-ok`.
- Canonical, title, description, Open Graph, Twitter e lingua iniziale specifici.
- Hreflang limitati agli equivalenti pubblicati con prova, reciproci e auto-riferiti;
  nessun alternato tra originali italiani e bozze straniere.
- **22 URL italiani oggi eleggibili** nella sitemap preparata: sei pagine, due archivi
  e quattordici articoli. Ricerca e strumenti di revisione esclusi.
- `https://preview.invalid` è il segnaposto sicuro quando manca un’origine confermata:
  non è un dominio di produzione da indicizzare.
- JSON-LD Organization/WebSite/Breadcrumb e Article pertinente, senza qualifiche,
  recensioni, polizze, autori professionali o date di modifica inventati.

La radice italiana non viene più sostituita dalla lingua del browser: appare soltanto
un suggerimento ignorabile. URL e scelta esplicita restano autorevoli. Nessuna
differenziazione intenzionale tra persone e bot.

## RTL, accessibilità e grafica

AR/HE hanno lingua corretta nell’HTML iniziale e struttura locale RTL prima e dopo
idratazione. `html` resta LTR per conservare la protezione mobile già documentata.
Telefono ed email sono isolati in LTR; logo e fotografie non sono specchiati.
Il limite allo zoom è rimosso.

Controllati Chromium mobile, assenza di offset/overflow a 390 px, tastiera/focus del
selettore, menu e contatti nelle regressioni esistenti. Una prova automatica non è
una prova con screen reader. Nessuna nuova certificazione WCAG è dichiarata.
WebKit/iOS reali e tecnologie assistive non sono stati collaudati in questa sessione;
per questo la protezione RTL esistente non è stata abbandonata.

## Recapiti e informazioni aziendali

Il titolare ha confermato **info@marenetto.com** il 10 novembre 2026.
Footer, contatti, link mailto e dati strutturati usano il dato centralizzato.
Telefono e link tel/WhatsApp conservano il recapito aziendale esistente.

Un `mailto` valido e la conferma dell’indirizzo da mostrare NON provano il recapito
dei messaggi. Non sono stati inviati messaggi reali o verificate credenziali SMTP.
Identità legale completa, sede, partita IVA e area servita restano da riconfermare:
non sono inserite come fatti verificati nei dati strutturati. I valori storici non
confermati non sono riproposti come fatti nel footer: compare una richiesta di conferma
esplicita, identificata come nota editoriale italiana anche nelle interfacce straniere.

## Articoli: intervento e documenti mancanti

Tutti i quattordici testi integrali esistenti sono mantenuti, non sostituiti da riassunti.
Il build verifica ogni blocco del testo integrale contro l’HTML, anche nelle bozze
tradotte, e fallisce se mancano blocchi o il corpo tradotto resta identico all’italiano.
Si tratta di una verifica di presenza, non di accuratezza linguistica o tecnica.
Le domande esistenti sono rese visibili come checklist; è disponibile anche un
promemoria italiano scaricabile per l’acquisto. Date originali e avvisi IA rimangono.
Le fonti conservano la data documentale esistente: non si dichiara una nuova
verifica professionale o una consultazione esterna non effettuata.

| Articolo / tema | Documenti, consensi o revisione mancanti |
|---|---|
| Acquistare e ristrutturare | Documenti del caso concreto, sopralluogo e verifiche del tecnico e del notaio; la checklist non li sostituisce |
| Impresa edile a Cefalù | Identità/ruoli aziendali confermati, esempi reali autorizzati e perimetro degli incarichi |
| Infiltrazioni e umidità | Diagnosi, misure e relazione del singolo immobile; nessun esito garantito senza indagine |
| Garanzie e polizza decennale | Eventuali polizze aziendali effettive, condizioni/esclusioni e verifica legale; nessuna copertura dichiarata |
| Cappotto o intonaco termico | Stratigrafie, dati del supporto, schede applicabili e valutazione del tecnico competente |
| Pavimenti esterni Isoplam | Scheda del sistema scelto, supporto, pendenze/drenaggio, giunti e manutenzione specifici |
| Microcemento Microverlay | Schede e ciclo applicabile, condizioni del supporto, campionatura e conferma dell’applicatore |
| Gestione e manutenzione | Incarico, frequenze, responsabilità, accessi/chiavi e consensi del proprietario |
| Garden design | Foto reali autorizzate, rilievi, vincoli, acqua/drenaggio e progetto competente quando necessario |
| Pietra e prospetti | Stato delle murature, vincoli e titolo dell’intervento; progetto strutturale ove richiesto |
| Pavimenti in resina | Sistema, compatibilità/umidità del supporto, posa e manutenzione documentate |
| Piscine e laghetti | Progetto, vincoli/autorizzazioni, sicurezza e manutenzione del caso concreto |
| Cucine in muratura | Rilievi, carichi, impianti e documentazione dei professionisti competenti |
| Deformazioni strutturali | Rilievi/monitoraggio, diagnosi e progetto del professionista abilitato; nessuna prescrizione a distanza |

Queste richieste non sono portfolio, testimonianze o qualifiche inventate.
Il riesame periodico futuro delle fonti resta distinto dal lavoro editoriale presente.

## Prove e limiti

Le evidenze eseguite sono conservate in `generated-artifacts/seo-audit/`:

- `http-results.json`: richieste HTTP reali a ogni documento del manifest; body/H1,
  canonical, robots, alternati, redirect, 404/410 e sitemap. Nessun JavaScript necessario.
- `rendered-results.json`: primo passaggio completo sulle 1.311 edizioni, H1 stabili;
  54 errori di idratazione individuati, non nascosti.
- `rendered-recheck.json`: ricontrollo mirato delle 54 route interessate dopo la
  normalizzazione delle date. Non è presentato come un secondo passaggio completo.
- `isolated-form-results.json`: quando prodotto dal collaudo, dati sintetici e
  risposte intercettate; nessuna chiamata reale all’API richieste o consegna email.
- `lab-metrics.json` e `throttled-lab-metrics.json`: misure locali con contesto
  dichiarato; non sono INP o Core Web Vitals sul traffico reale.

Comandi riproducibili:

```sh
PORT=4189 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
pnpm --filter @workspace/marenetto-build run test:seo
pnpm --filter @workspace/marenetto-build run test:i18n
pnpm run typecheck
pnpm --filter @workspace/marenetto-build run test:routes
pnpm --filter @workspace/marenetto-build exec node scripts/measure-seo-lab.mjs
```

Build, HTTP, suite localizzazione (9/9) e typecheck dell’intero workspace superati.
Il riepilogo finale generato allegato riporta gli esiti browser e le misure effettive,
senza trasformare file non prodotti o test non terminati in risultati positivi.

Le regressioni preesistenti sono state eseguite a gruppi: 15 verifiche di layout,
campagne e ricostruzione storica superate; successivo gruppo con 62 superate e cinque
asserzioni non superate. Queste ultime riguardavano il documento scaricabile trattato
dal vecchio crawler come pagina HTML, il messaggio precompilato italiano di WhatsApp
e le sue etichette EN/AR. Corretti il trattamento dei download, il messaggio italiano
originale e le etichette operative nelle 29 lingue; conferma economica tramite HTTP
dell’asset e dei link/attributi iniziali, non un altro passaggio browser completo.
Un’ulteriore riesecuzione mirata ha superato navigazione mobile della home e moduli
sintetici isolati nelle sei lingue indicate. Non si presenta l’ultima esecuzione
browser dei cinque casi come positiva senza averla ripetuta.

Il bundle principale resta superiore a 500 kB: il warning del build non viene nascosto.
I cataloghi sono caricati per lingua e le correzioni/bozze soltanto in revisione;
le immagini fotografiche approvate non sono state rimpiazzate per migliorare un punteggio.

Le regressioni di moduli/footer/menu/mobile articoli/URL storici si sovrappongono a
verifiche già proposte separatamente: questo lavoro non le dichiara automaticamente
completate e non crea task duplicati.

## Revisione del lavoro e rilascio

Il codice modificato è rintracciabile nel commit di consegna associato al lavoro:
entry server, inventario/registro, runtime, builder/handler HTTP, metadati, contatti
e suite relative. Non si anticipa un identificatore di commit che non esiste ancora.
I file generati sono esclusi da Git; gli allegati consegnati restano separati dal codice.

Usare `SEO_RELEASE_CHECKLIST.md` per il futuro dominio definitivo. Pubblicazione,
dominio, Search Console, Google Business Profile e apertura ai motori non sono attivati.
Le approvazioni mancanti e i limiti sopra indicati sono prerequisiti reali,
non informazioni ricostruite o prestazioni promesse.
