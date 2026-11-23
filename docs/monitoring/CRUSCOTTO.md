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
3. **Controlla ora** accoda sul server del sito e sveglia un esecutore
   asincrono locale: nessun worker esterno, firma o heartbeat richiesto.
   Il browser può essere chiuso. Il riavvio del server riprende solo i job
   mai chiamati; un timer ogni30s aiuta il recupero mentre il processo è
   attivo, ma **non viene presentato come scheduler affidabile su Autoscale**.
4. Per il calendario predisporre una **Scheduled Deployment** dello stesso
   codice. Build standard: `pnpm install --frozen-lockfile` e
   `pnpm --filter @workspace/api-server run build`; run finita dalla root:
   `pnpm --filter @workspace/api-server run ai:scheduled`.
   Il build produce `artifacts/api-server/dist/ai-scheduled.mjs`; il comando
   non apre porte, chiude il pool DB e termina. Non usare il server web
   come comando schedulato. Nessuna Scheduled Deployment è stata attivata.
5. Condividere **esplicitamente lo stesso database di PRODUZIONE** e le tabelle migrate:
   `DATABASE_URL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` nei Secrets,
   senza copiarne valori in codice o documenti. Gemini non è necessario.
   `NODE_ENV=production` è impostato dal comando, `REPLIT_DEPLOYMENT=1`
   deve essere presente perché eseguito come deployment, non in preview.
   Nessuna chiave trigger aggiuntiva serve per la CLI.
   **Attenzione:** non presumere che una Scheduled Deployment riceva
   automaticamente il database della pubblicazione Autoscale: la
   [documentazione dei tipi di pubblicazione](https://docs.replit.com/features/publishing/deployment-types)
   distingue le connessioni. Il tecnico deve verificare/configurare la
   connessione allo stesso DB tramite le impostazioni supportate, non
   usare il database di sviluppo o crearne uno vuoto.
   Se non è possibile condividere direttamente tale connessione, usare
   nella Scheduled Deployment il comando già disponibile
   `node scripts/monitoring-ai-tick.mjs` verso il dominio pubblico finale.
   Solo in questo caso la firma HMAC è indispensabile per autenticare il
   comando cross-deployment: predisporre `MONITORING_AI_TRIGGER_KEY`
   (64cifre hex, stesso valore sui due deployment) nei Secrets e
   `MONITORING_AI_ENDPOINT` in Configuration con l’URL HTTPS esatto
   `/api/monitoring/ai/tick`, senza query. Nessun heartbeat richiesto
   per manuale o calendario; il server usa comunque la propria coda DB.
   Non è un servizio worker esterno da acquistare. Nulla è stato attivato.
6. Pianificazione raccomandata: ogni5minuti, più gating interno lunedì
   09:00–09:14 **Europe/Rome**. Se la UI consente il fuso Europe/Rome,
   usare `*/5 * * * *` con quel fuso; essendo ogni5minuti è comunque
   indipendente dall’ora UTC e copre cambio ora legale e recupero della
   coda. Solo nella finestra locale si accoda una nuova campagna settimanale.
   Il resto del tempo recupera soltanto job già accodati. Configurare un
   timeout che consenta fino a30job×60s più overhead (es.35minuti se
   disponibile); una terminazione anticipata lascia checkpoint durevoli,
   non causa retry di chiamate a esito incerto. L’overlap dei comandi è
   serializzato via DB. Risorse/costo dei job programmati sono **separati**
   dal budget API e vanno verificati dal titolare prima dell’attivazione.
   L’endpoint HTTP firmato precedente resta opzionale e necessario soltanto
   per l’alternativa cross-deployment, mai per usare pulsante o CLI locale.
7. Solo il titolare imposta un budget positivo. “Controlla ora” e calendario
   usano la stessa coda e lo stesso ledger, senza un interruttore live
   indipendente dal budget. Il calendario richiede la selezione nel pannello
   **e** la Scheduled Deployment effettivamente predisposta.
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
