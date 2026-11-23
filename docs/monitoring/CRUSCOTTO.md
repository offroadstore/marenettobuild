# Cruscotto KPI e visibilità IA

## Consegna e limiti operativi

Estensione della console esistente, nessun nuovo prodotto o tracciamento
pubblico. Budget iniziale **0 USD**, calendario **spento**, nessun runner
programmato installato, nessuna pubblicazione e nessuna API o SMTP reale
usati per il collaudo. I costi e il blocco Gemini sono in `PROVIDER.md`.

`kpi:read` autorizza i report generali; **tutti** gli input, impostazioni,
domande, risultati, campioni e filtri IA richiedono `monitoring:manage`.
Il server omette interamente questi dati dalla risposta generale e il
browser li esclude anche da eventuali cache residue. Cambiare utente
svuota già la cache applicativa. CSV non estende i permessi.

## Lettura dei numeri

Un'unica barra applica filtri a riepilogo, tabelle, serie e CSV. Una fonte
incompatibile con un filtro non fornisce numeri non filtrati: appare
“filtro non applicabile”. La matrice esplicita è esposta dalla risposta.
Selezionare una fonte disabilita i selettori incompatibili.

|Fonte|Filtri oltre al periodo|
|---|---|
|GA4|dispositivo, paese, città, pagina, canale, sorgente, lingua pagina; solo combinazioni confermate Data API|
|Search Console|dispositivo, paese, pagina, query, lingua pagina|
|Bing|nessuno di questi filtri; solo intervallo sui giorni restituiti|
|IA|provider, domanda|
|Meta Pixel|non configurata, nessun dato o chiamata|

Per minimizzare dati personali, selettori basati su tassonomie esplicite:
paesi/città/canali/sorgenti approvati, sei pagine canoniche per ciascuna
delle29 lingue del catalogo. Articoli e altri percorsi non sono inclusi
nel filtro lingua: non dedurre la lingua da query, paese o browser.
La lingua del modulo è un'altra cosa. Query e domande IA ammettono solo
un vocabolario edile controllato e località approvate, non testo libero
personale. Cambiare testo aumenta la versione, non riscrive lo storico.

Precedente intervallo di uguale durata, disattivabile. CTR, engagement e
visibilità: differenza in punti percentuali. Precedente zero o assente:
nessuna percentuale infinita. Posizione più bassa significa miglioramento.
Fonti non sommate né equiparate. IA: denominatore per provider sono soltanto
risposte valide con ricerca dimostrata; menzione letterale del marchio
distinta da citazione del dominio, assenza, grounding non dimostrato,
errore, blocco e costo incerto. Cambio domanda/versione/modello/metodo
o campione mancante rende il confronto indisponibile.

Serie IA solo nei giorni realmente osservati, rappresentate come punti,
nessuna interpolazione o zero per periodi senza campagne. Max2000
osservazioni nel report, dichiarato; domande aggregate nel periodo, evidenze
riportano la versione. Fonti citate conservate solo come domini HTTPS
sicuri, max8. Estratto limitato al marchio, mai al testo completo.
Concorrenti: solo fonti con dominio edilizio e titolo di ricerca che
dichiara settore e forma societaria; conservata regola, non titolo.
Classificazione indicativa, non registro imprese o lista completa.
Directory note sempre separate; altri domini scartati per privacy.

Ogni fonte espone fuso, recupero riuscito, ultimo giorno disponibile,
limiti/soglie/campionamento/topN/errori. Cache fallita può mostrare dati
obsoleti espliciti, senza cambiare la data di freschezza o inventare zeri.
Cache max100 chiavi/15min, backoff errori, max8 caricamenti concorrenti,
isolata per ambiente, proprietà, revisione, permessi e filtri normalizzati
incluso confronto. Dashboard max30 richieste/minuto per utente e ambiente;
cardinalità del rate limiter limitata.

## CSV

Riepilogo, serie, tabelle ed evidenze IA (solo titolare) vengono prodotti
dai dati autorizzati **già caricati**, senza nuovo fetch o esecuzione IA.
Stesso ordinamento delle tabelle; metadati di periodo, confronto, fuso,
freschezza, stato, filtri, limiti, unità, campioni e numero righe.
Le tabelle Google sono top10, non export completo. Nessuna paginazione
completa viene promessa. I valori assenti sono distinti da0, le celle
testuali sono quotate, le formule neutralizzate anche dopo spazi/controlli,
ritorni a capo rimossi. Nessuna chiave o dato personale esportabile.

## Modulo email: misura non disponibile

Il modulo attuale invia soltanto email: il vecchio database richieste non
è una fonte KPI. Il backend KPI non lo consulta e dashboard/monitoraggio
non caricano la lista lead; lo storico non viene cancellato o alterato.

È stata scelta l'alternativa autorizzata di **non introdurre un contatore
SMTP**. Senza una transazione condivisa col server email o payload/code
persistenti, un'interruzione fra accettazione SMTP e incremento non consente
di garantire un conteggio completo né di marcare affidabilmente ogni buco.
Non aggiungiamo archivi o retry per risolverlo. La fonte è quindi
indisponibile, non zero; nessuna copertura storica o confronto promesso.
Etichette, destinatario, idempotenza e trasporto email restano invariati.

## Pipeline durevole e avvio futuro (non eseguito)

1. Il post-merge applica la migrazione additiva `ai-visibility.sql`.
   Nessun dato cliente/payload entra nelle nuove tabelle. Ambiente
   development e production sono partizionati anche con lo stesso DB.
2. Su deployment pubblicato verificare separatamente fatturazione,
   modelli, termini e costi correnti. Non bastano le chiavi presenti.
   L'anteprima è bloccata anche con NODE_ENV=production e budget positivo:
   serve inoltre `REPLIT_DEPLOYMENT=1`.
3. Predisporre un runner **esterno**, una volta al minuto, che esegua
   `node scripts/monitoring-ai-tick.mjs` verso il deployment finale.
   Il codice applicativo non usa timer, cron in memoria o keep-alive:
   è compatibile con autoscale/spindown. **Non è stato configurato.**
4. Quando il titolare deciderà di attivarlo, configurare nel runner e
   nel server un segreto dedicato `MONITORING_AI_TRIGGER_KEY` di64 cifre
   esadecimali tramite Secrets. Non riutilizzare la chiave di cifratura
   OAuth `MONITORING_TOKEN_KEY` e non inserirlo in URL o log.
   Nel runner configurare `MONITORING_AI_ENDPOINT` con HTTPS del deployment
   finale e percorso esatto `/api/monitoring/ai/tick`, senza query.
   Ottenere l'origine reale dalle impostazioni del deployment, non dalla
   preview. Nessuna credenziale viene creata o cambiata dalla consegna.
5. Il runner firma HMAC-SHA256, chiave decodificata hex, stringa esatta:
   `POST\n/api/monitoring/ai/tick\n<minuto Unix>`. Header
   `x-monitoring-minute` e `x-monitoring-signature`; finestra±1minuto,
   confronto costante. Nessun body o segreto nella richiesta.
   Timeout90s, nessun retry immediato. Non usare un browser per richiamarlo.
6. Il checkpoint autenticato aggiorna heartbeat durevole, pronto per180s;
   processa al massimo un job per minuto. Reinvii nello stesso minuto
   non avanzano una seconda chiamata. Il runner non abilita il calendario
   e, a budget0, non causa richieste IA.
7. Solo il titolare imposta un budget positivo. “Controlla ora” e calendario
   usano la stessa coda e lo stesso ledger, senza un interruttore live
   indipendente dal budget. Il calendario richiede anche heartbeat fresco.
   Lunedì09:00–09:14 Europe/Rome (finestra tecnica per il trigger), una sola
   campagna per settimana. DST gestita con Intl/IANA. Se la finestra è
   saltata, non si recupera nessuna settimana arretrata.
8. Una sola campagna in coda e almeno un'ora fra campagne. Lock transazionale
   della configurazione serializza avvii e prenotazioni; indice univoco
   settimana/ambiente impedisce doppioni. Ogni domanda/provider è un job
   separato, senza contesto condiviso. Prezzi/modello/metodo non verificabili,
   budget residuo insufficiente o prerequisiti mancanti bloccano il job.
9. Prima del fetch prenotazione atomica del massimo nel mese Europe/Rome.
   L'adapter ricontrolla deployment, policy e prenotazione persistita
   (ambiente, provider, domanda/versione, modello, metodo, stato e mese).
   Nessuna chiave letta prima di questa autorizzazione. Chiamate a cavallo
   del cambio mese non riusano una prenotazione del mese precedente.
10. Timeout60s. Lease scaduta120s, crash, errori e risposte non fatturabili
    con certezza diventano esiti incerti con prenotazione trattenuta.
    Nessuna ripetizione automatica a pagamento, né recupero dei job in
    esecuzione a esito ignoto. I job ancora in coda scadono dopo24ore.
    Un runner ripartito continua solo i checkpoint mai chiamati, senza
    ricreare campagne o recuperare settimane.

Lo “speso” è soltanto quello riconciliato; prenotazioni comprendono costi
ignoti e non vengono liberate per far ripartire i controlli. Budget inferiore
agli impegni blocca ulteriore spesa, non annulla chiamate già inviate.
Il nuovo mese non azzera o riscrive i ledger storici. Nessun controllo
copre altri usi delle stesse chiavi fuori da questa applicazione.
Pulizia dei soli job terminali/campagne vuote oltre400giorni al checkpoint,
senza cancellare prenotazioni del mese corrente. Non esistono payload pieni.

## Collaudo

`pnpm --filter @workspace/api-server run test:permissions` include fixture
DB in schema temporaneo e fetch intercettati per GA4, Search Console,
Bing e tre IA; credenziali reali rimosse dall'ambiente del processo test,
sostituite solo da stringhe sintetiche. Copre permessi, zero/preview,
concorrenza, lease/riserva, mese/DST, filtri/cache, dati mancanti,
classificazione minima, CSV, rendering UI e assenza tabella lead nel KPI.
`pnpm --filter @workspace/api-server run test:project-requests` verifica
SMTP simulato e idempotenza invariati. Nessuno di questi test autorizza
chiamate reali, invii SMTP o l'accensione del calendario.
