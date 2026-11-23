# Recensioni Google Places API (New)

## Consegna e stato

Integrazione server e interfaccia nelle dodici lingue richieste. Nessuna
credenziale o account creato, modificato o richiesto in chat; nessuna
pubblicazione automatica. L'attivazione della scheda rimane al proprietario.

Il pulsante di ricerca attuale non certifica l'identità della scheda.
Con configurazione mancante, risposta vuota, limitazione locale, errore di
validazione, foto non recuperabile o timeout resta automaticamente quel pulsante.
Non si mostra una selezione parziale costruita scartando recensioni problematiche.

## Attivazione a cura del proprietario

1. Nel proprio progetto Google Cloud, verificare fatturazione e disponibilità
   di **Places API (New)**. Il servizio Legacy non è quello utilizzato.
2. Identificare e controllare la scheda ufficiale e il suo Place ID (nome,
   contatti e sede/punto di servizio). Non usare il nome commerciale come ID.
3. Configurare solo nell'ambiente del **server API**:
   - `GOOGLE_PLACES_API_KEY`: chiave riservata al server;
   - `GOOGLE_PLACE_ID`: identificativo della scheda corretta.
   Non usare prefissi `VITE_`, variabili del client, file pubblici o codice
   sorgente. Non incollare i valori in chat. Usare la gestione sicura delle
   variabili dell'ambiente di esecuzione; il progetto non contiene valori.
4. Limitare la chiave a Places API (New) tramite **API restrictions**.
   Per le **application restrictions** delle chiamate web-service usare gli
   **IP pubblici di uscita del server**, non HTTP referrer, dominio del sito,
   indirizzo locale o IP del visitatore. Verificare l'uscita effettiva anche
   dopo un cambio di infrastruttura. Se non è disponibile un'uscita stabile,
   non inventare un IP e non trattare una chiave senza restrizioni come
   equivalente: concordare una soluzione server con uscita controllata prima
   dell'attivazione. Questa consegna non modifica infrastruttura o credenziali.
5. Verificare termini applicabili all'indirizzo di fatturazione. Per clienti
   SEE si applicano termini e usi consentiti specifici: mostrare informazioni
   sulla propria sede/punto ufficiale rientra nella categoria (2), ma il
   proprietario deve verificare che la sua scheda e l'uso concreto vi rientrino.
   Non viene mostrata alcuna mappa.
6. Verificare le informative pubbliche e i rapporti con i fornitori prima
   dell'attivazione. Il blocco visualizzato collega termini Google Maps e
   informativa Google, e descrive il trasporto server delle foto. Non costituisce
   una certificazione legale o una dichiarazione generale di assenza di terze
   parti nell'intero sito.
7. Riavviare il servizio API dopo la configurazione, verificare scheda,
   conteggio, testi, autori e link in anteprima; solo il proprietario decide
   quando ripubblicare. Nessuna lingua viene approvata o sbloccata da questa
   integrazione.

Rimuovere una delle due variabili e riavviare l'API disattiva l'integrazione:
il ripiego resta disponibile. Nessun pulsante scrive direttamente una recensione;
“Lascia una recensione” apre Google, con le sue regole e il suo accesso.

## Dati, attribuzione e privacy del trasporto

- Endpoint pubblico di sola lettura `GET /api/google-reviews`; nessun input
  del visitatore può scegliere schede o URL da interrogare.
- Una richiesta server a `places.googleapis.com/v1/places/{placeId}` con
  `X-Goog-Api-Key` in header, non nell'URL. Timeout totale 6 secondi,
  nessun retry automatico. Il client attende al massimo 9 secondi.
- Field mask: `rating,userRatingCount,reviews,googleMapsUri,googleMapsLinks,attributions`.
  I campi `reviews` includono `originalText`, `authorAttribution` e il link
  individuale. Fino a cinque recensioni, nell'ordine restituito (rilevanza),
  nessun filtro per voto o riordino. `text` tradotto non viene usato.
  Una recensione di solo voto resta tale; non si inventa un commento.
- Logo Google Maps ufficiale, non ridisegnato, distribuito localmente
  dall'archivio di attribuzione ufficiale. Altezza 18 px e spazio libero
  prescritto, testo alternativo “Google Maps”. Attribuzioni di eventuali
  fornitori mantenute, incluse le loro destinazioni.
- Nome autore, avatar e profilo vicini al testo; link alla singola recensione.
  Il pulsante “tutte” usa esattamente il `googleMapsUri` della scheda.
  “Lascia” usa `googleMapsLinks.writeAReviewUri`, oppure il collegamento
  Google di scrittura con il Place ID configurato, se quel campo manca.
- Gli avatar sono recuperati dal server dagli host Google ammessi, senza
  inoltrare IP, cookie, Origin o Referer del visitatore e senza trasmettere la
  chiave Places al server immagini. Redirect rifiutati; solo PNG/JPEG/WebP
  validati, massimo 100 KB per avatar. JSON Places massimo 256 KB.
  I byte sono consegnati come immagini `data:` nella risposta corrente, non
  salvati su disco, database o App Storage. Non esiste un proxy URL arbitrario.
  Se Google cambia host, formato o redirect, il blocco ripiega sul collegamento.
- Il browser carica dal sito il logo e l'endpoint; gli avatar non hanno URL
  remoti. I link esterni usano `noopener noreferrer` e richiedono un clic.
  Nessun SDK, iframe, script o font Google aggiunto. Non vengono introdotti
  cookie, analytics o schema `Review`/`AggregateRating`.
- Google riceve comunque IP e richiesta del **server**. Dopo un clic il
  visitatore contatta Google direttamente. Non promettere anonimato o
  “nessuna richiesta terza” per altre funzionalità del sito.
- Le recensioni Google non sono una certificazione di acquisto verificato.
  Non aggiungere etichette “verificate da Google” o riscritture commerciali.

## Nessuna cache delle recensioni

Le policy consultate non prevedono un'eccezione che autorizzi a conservare
testi, foto o voti per una breve TTL. L'eccezione del Place ID e quella delle
coordinate non si estendono alle recensioni.

Non si conservano risposte completate. Si condivide esclusivamente la promessa
di una chiamata **ancora in corso**, eliminata al termine. HTTP e CDN ricevono
`private, no-store, max-age=0`, `CDN-Cache-Control: no-store` e
`Surrogate-Control: no-store`. Il client non usa React Query per questi dati,
né localStorage, polling o cache persistenti. Il risultato resta soltanto nella
memoria del componente per la visualizzazione corrente. A una nuova visita
si chiede una risposta fresca o si mostra il ripiego.

Il rendering iniziale e i build statici contengono solo il collegamento.
Le recensioni non passano dal catalogo o dagli snapshot editoriali, né dai log.
I test e le immagini di prova usano esclusivamente dati sintetici chiaramente
marcati. Non salvare screenshot di recensioni vere come fixture di regressione.
Il trasporto server degli avatar è parte della consegna corrente nell'app,
non una libreria immagini, una cache o un servizio di ridistribuzione indipendente.

## Quote, prezzi e limiti effettivi

La presenza di `reviews` attiva lo SKU **Place Details Enterprise + Atmosphere**,
non il solo SKU relativo a voto/conteggio. Verificare tariffe, eventuali soglie
gratuite e valuta nel proprio account: non assumere il vecchio credito mensile
di 200 USD. Foto dei luoghi e riepiloghi IA non sono richiesti.

Il codice limita le chiamate a **una ogni 10 secondi e 100 tentativi per giorno
UTC per processo API**, contando anche gli errori. Le richieste simultanee
condividono il solo lavoro in corso. Durante l'intervallo o oltre soglia si
mostra il pulsante, non una risposta vecchia. Non ci sono retry né polling.

Questi contatori sono in memoria: **riavvii li azzerano e più istanze hanno
contatori indipendenti**. Non sono un tetto di spesa, una quota globale o una
protezione economica completa contro abusi dell'endpoint pubblico.

Nel progetto Google impostare quote basse per il metodo Place Details, in base
al traffico atteso e alle quote effettivamente disponibili. Places API (New)
usa quote per metodo e progetto. Una quota limita le richieste, non garantisce
un massimo monetario mensile; richieste tramite altre chiavi condividono le
quote di progetto. Per un blocco operativo disabilitare l'integrazione.

Impostare avvisi di budget per costi effettivi e previsti, ad esempio a 50%,
90% e 100%, con destinatari controllati. **Un avviso di budget non è un limite
di spesa e non ferma automaticamente il servizio**; dati e notifiche possono
arrivare in ritardo. Eventuali automazioni di arresto fatturazione richiedono
un progetto separato e valutazione dell'impatto: non sono state attivate.

## Fonti ufficiali consultate il 23 novembre 2026

- [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies):
  caching, attribuzioni, logo, autori, collegamenti individuali, ordine recensioni.
- [REST Place / Review / AuthorAttribution](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places):
  campi originali, massimo cinque recensioni e attributi dei fornitori.
- [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details):
  header, field mask e SKU.
- [Google Maps links](https://developers.google.com/maps/documentation/places/web-service/maps-links):
  `googleMapsUri` e `writeAReviewUri` (le funzionalità in preview restano
  soggette ai relativi termini).
- [Security best practices](https://developers.google.com/maps/api-security-best-practices):
  restrizioni API e IP per il server, proxy protetto.
- [Usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing):
  tariffe e quote per metodo/progetto.
- [Budget alerts](https://cloud.google.com/billing/docs/how-to/budgets):
  avvisi non equivalenti a un tetto di spesa.
- [Termini SEE](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms)
  e [usi consentiti SEE](https://cloud.google.com/terms/maps-platform/eea-places-api-permitted-uses).
- [Asset ufficiali di attribuzione](https://developers.google.com/static/maps/documentation/images/Google_Maps_Attribution_Assets.zip):
  `GoogleMaps_Logo_DarkGray.svg`, copiato senza modificarne il contenuto.

## Prove ripetibili

`pnpm --filter @workspace/api-server run test:google-reviews` esegue test
isolati del servizio e del rendering nelle dodici lingue, con risposte
**simulate**, senza chiamate Google e senza credenziali reali. Copre
configurazione mancante, timeout, errori, JSON invalido, risultati vuoti,
link/immagini non sicuri, attribuzioni, ordine anche con voti bassi, testi
originali, dati non tradotti, deduplicazione e limiti, header no-store,
assenza di script/schema e richieste immagini remote nel markup.

Le prove visive simulate non dimostrano che la scheda reale sia corretta o che
la fatturazione sia attiva. Il controllo live di Google Places resta
esplicitamente **non eseguito**: nessuna chiave è stata creata per il collaudo.

### Esiti sul candidato del 23 novembre 2026

- **72 test superati**: 9 servizio/HTTP, 25 rendering e lingue, 38 regressioni
  del collegamento SSR e dell'estrazione home.
- `pnpm run typecheck`: riuscito sull'intero workspace.
- Build web di produzione: riuscito, compresi rendering server e controllo
  degli asset; build API e avvio dei due servizi riusciti.
- 841 file HTML statici controllati: niente testi di recensioni, fixture,
  schema recensioni o script Google Maps.
- Endpoint di anteprima: HTTP 200, `{"data":null}` e header no-store;
  ripiego controllato nella pagina recensioni a 1440 e 390 px. Questo esito
  non identifica la scheda e non dimostra una chiamata live a Google.
- `node artifacts/marenetto-build/scripts/google-reviews-visuals.mjs`:
  blocco sintetico, nessuno scorrimento orizzontale nelle dodici lingue a
  320, 390 e 1440 px; logo caricato e nessuna richiesta terza dal blocco
  statico isolato. Non è una misura delle altre funzioni dell'intero sito.
- Screenshot conservati fuori Git in `generated-artifacts/google-reviews/`:
  `simulated-1440.png`, `simulated-390.png` (dati esplicitamente simulati),
  `fallback-desktop.jpg`, `fallback-mobile.jpg` (anteprima, non produzione).

**PRONTO PER REPUBLISH per questa integrazione**, con il ripiego operativo.
L'attivazione e la verifica della scheda reale restano separate: il proprietario
configura il server e decide se e quando pubblicare. Nessuna autorizzazione
editoriale o impostazione analytics è stata modificata.
