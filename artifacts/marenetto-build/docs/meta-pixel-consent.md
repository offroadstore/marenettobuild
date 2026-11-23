# Meta Pixel: confini e prove locali

## Installazione

- Pixel: `1133839426103230`.
- Verifica dominio: `5uk7oyoskduu3td99b45m9r58i1cd7`, nel primo HTML,
  non aggiunta dal client. Il renderer rimuove eventuali copie prima di
  inserirne una, anche quando riceve un documento già prerenderizzato.
- Solo dopo consenso marketing: immagini dinamiche del trasporto Pixel ufficiale
  `https://www.facebook.com/tr/`. Nessun `noscript`, hint di connessione, SDK,
  tag manager pubblicitario, CAPI o Advanced Matching.
- Il solo dominio Meta concesso dalla CSP è l’endpoint immagini esatto.
  Non sono necessari `connect.facebook.net`, wildcard o nuovi permessi script.

## Perché non l’SDK

La documentazione ufficiale descrive raccolta di URL/referrer, metadati della
pagina, pulsanti e nomi dei campi. Disabilitare `autoConfig` e non fornire dati
di matching non costituisce isolamento del codice terzo dal modulo.

Il trasporto manuale scelto non esegue codice Meta, non ispeziona DOM/campi e
non ha code o timer del fornitore da arrestare. Ogni immagine è nel DOM come
richiesto dalla documentazione; usa `referrerPolicy=no-referrer` e
`crossOrigin=anonymous`, che omette le credenziali cross-origin. I soli parametri
sono Pixel ID, evento, URL pubblico da inventario senza query/frammenti,
referrer vuoto e istante tecnico anti-cache. Non sono inviati titoli, recapiti,
testi dei link, valori/nome dei campi, codici richiesta o identificativi utente.

Questa variante non genera `_fbp`/`_fbc` e non inoltra cookie Meta esistenti.
Non vengono attribuite durate inventate a cookie che non imposta.
È una scelta di minimizzazione con capacità di attribuzione ridotte, non una
garanzia di ricezione o di attribuzione in Events Manager. Meta riceve comunque
IP e metadati tecnici della comunicazione.

## Consenso e revoca

- Statistiche e marketing sono indipendenti, inizialmente negati.
- I vecchi record analytics non vengono migrati in autorizzazioni: è richiesta
  una nuova scelta esplicita. Nessun consenso viene dedotto dal modulo.
- Le scelte durano 180 giorni e non vengono rinnovate durante la navigazione.
  Le modifiche alla versione dell’informativa invalidano la scelta, non la
  rinnovano. Scadenza, focus e visibilità della scheda sono gestiti.
- Scrittura e rilettura devono riuscire prima di concedere il consenso.
  Errori del browser mantengono entrambi gli strumenti disattivati.
  Un blocco conservativo separato impedisce che una vecchia autorizzazione
  rimasta in memoria di sola lettura venga ripristinata dal reload di revoca GA.
- Le schede si sincronizzano con gli eventi storage.
- Revocare solo marketing mantiene statistiche autorizzate; ferma nuovi invii,
  rimuove immagini pendenti e residui `_fbp`/`_fbc` accessibili nei domini e
  percorsi applicabili. Una richiesta già inviata non può essere ritirata.
  Non servono ricaricamenti per Meta: nessun suo codice è eseguito. GA conserva
  il suo ricaricamento controllato per revoca/esclusione del codice diretto.
- Le aree private e le anteprime sono escluse anche con una preferenza valida.
  Solo i percorsi presenti nell’inventario pubblico verificato producono eventi.
- Nessun replay: un invio iniziato senza consenso non genera Lead dopo un opt-in;
  revoca/nuova concessione invalidano gli invii ancora in corso.

## Eventi e pannello

- `PageView`: navigazione pubblica consentita, senza doppioni della stessa rotta.
- `Contact`: clic telefono, email o WhatsApp; non il recapito o il canale.
- `Lead`: conferma `status: sent` della richiesta email, non apertura/riepilogo,
  errore, rifiuto o semplice clic. Non prova consegna alla casella né acquisizione.
- Il modulo resta email-only, senza salvataggio dei suoi dati.
- Le superfici Meta riportano **Pixel installato, dati non collegati**:
  nessun numero inventato, Insights, campagna o audience.

## Fonti ufficiali consultate il 23 novembre 2026

- https://developers.facebook.com/documentation/meta-pixel/advanced/
  — trasporto IMG (anche creato a runtime nel DOM), autoConfig e CSP SDK.
- https://developers.facebook.com/documentation/meta-pixel/implementation/gdpr
  — `consent revoke/grant` per chi usa l’SDK e categorie di dati ricevuti.
- https://developers.facebook.com/docs/facebook-pixel/advanced/advanced-matching
  — matching manuale tramite terzo argomento di `init`, qui non utilizzato.
- https://developers.facebook.com/documentation/meta-pixel/reference/
  — eventi standard Contact e Lead.
- https://www.facebook.com/privacy/policies/cookies/
  — cookie e trattamento del fornitore.

Le API `fbq` non sono emulate né chiamate: senza l’SDK, la barriera di consenso
è prima della creazione di qualsiasi richiesta immagine.

## Riproduzione dei controlli

Build con `PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build`.
Typecheck: `pnpm run typecheck`.
Test unitari: `pnpm --filter @workspace/marenetto-build run test:marketing`.
Test browser: `pnpm --filter @workspace/marenetto-build run test:analytics`.

La suite browser usa provider intercettati e risposte del modulo simulate.
Carica anche HTML/CSS/JS di produzione e il modulo reale dai file locali,
con CSP applicata, desktop e mobile 375 px. Tutte le richieste sono soddisfatte
localmente o bloccate: non contatta il sito pubblicato, Meta o un server SMTP.

La verifica del dominio presso Meta e la ricezione reale degli eventi spettano
al titolare dopo la sua ripubblicazione. Non sono provate dalle simulazioni
locali. L’agente non pubblica, crea account, configura campagne o invia email.
