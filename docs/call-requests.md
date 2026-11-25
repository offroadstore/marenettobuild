# Richieste di chiamata riservate

## Ambito e autorizzazioni

Le chiamate sono separate dalle richieste di progetto preesistenti. Il ruolo
applicativo **owner / Titolare**, già autenticato con email primaria verificata e
invito attivo, realizza il requisito super admin. Ogni operazione di elenco,
esportazione, modifica e cancellazione ha un controllo server esplicito sul ruolo;
la sola visibilità del menu non autorizza nulla. Non sono stati cambiati inviti,
ruoli globali o permessi di editor/viewer.

`call_requests` non è collegata a `project_requests`, notifiche condivise,
allegati, ricerche o KPI. Tutti i dati collegati della nuova funzione (dettagli,
note, consensi, acquisizione cliente, stato delle due email) sono nella stessa
riga e vengono cancellati insieme. Gli hash IP antispam, condivisi con il flusso
generico, non identificano una chiamata e scadono dopo 24 ore.

## Contratto e schema

Fonte: `lib/api-spec/openapi.yaml`; rigenerare con
`pnpm --filter @workspace/api-spec run codegen`.

- `POST /api/call-requests`: ricevuta senza dati personali, codice casuale,
  indicazione sintetica e stato distinto di email titolare/cliente.
- `GET /api/call-requests/config`: modalità sintetica e versione informativa;
  il modulo attende questa lettura prima di consentire l'invio.
- `GET /api/internal/call-requests`: filtri start/end inclusivi (giorni UTC),
  language (lingua preferita, altrimenti del modulo), project, country, status,
  intent e professionalProjectType.
- `GET /api/internal/call-requests/export`: stessi filtri, CSV privato
  con neutralizzazione formule, anche per valori con spazi/caratteri di controllo.
- `PATCH /api/internal/call-requests/:id`: stato, note e indicatore esplicito
  `acquiredCustomer`; **chiusa non significa cliente acquisito**.
- `DELETE /api/internal/call-requests/:id`: cancellazione completa della riga.

Applicazione compatibile e non distruttiva dello schema:
`node lib/db/scripts/migrate-call-requests.mjs`.
La migrazione è idempotente, inclusa anche nel setup dopo merge; non modifica le
vecchie richieste. Applicarla al database dell'ambiente di rilascio prima di
avviare il nuovo server. Non copiare dati o credenziali da sviluppo a produzione.

I campi obbligatori sono nome, cognome, email e cellulare in formato E.164
(`+`, prefisso non zero, 8–15 cifre totali). Si verifica il formato, non la
titolarità o raggiungibilità del numero; non viene inviato un SMS. La versione
dell'informativa deve corrispondere al contratto. Data/ora di presa visione
provengono da PostgreSQL, mai dall'orologio del browser.
WhatsApp e marketing sono scelte indipendenti e facoltative; non attivano
tracciamenti pubblicitari.

Le chiavi di idempotenza e l'impronta del contenuto sono protette con HMAC
separato dal dominio d'uso degli hash IP. Un retry con la stessa chiave e stesso
contenuto riceve la ricevuta originale; contenuto diverso produce 409. Il tempo
di apertura e la trappola antispam non fanno parte dell'impronta. Nessun dato
personale o IP grezzo è scritto nei log della funzione.

## Anteprima, email e blocchi

In sviluppo il nuovo flusso è **sempre sintetico**, anche se le approvazioni
generiche fossero presenti: i dati inseriti sono scartati e sostituiti con una
scheda dimostrativa. Non inserire dati reali. In produzione i dati reali sono
abilitati solo se sono già vere tutte e tre le approvazioni privacy, fornitori e
collaudo esistenti. Nessuna approvazione, secret o configurazione SMTP è stata
modificata.

L'invio usa la configurazione Aruba esistente, senza modificare il comportamento
delle vecchie richieste. Il destinatario della nuova notifica è fisso:
**info@marenetto.com**. Contiene dati della scheda, consensi, data server e link
WhatsApp; se WhatsApp non è autorizzato viene indicato di non usarlo. La conferma
cliente è transazionale, nelle tredici lingue del modulo, non è un'iscrizione
marketing e non promette risposta da personale che parli quella lingua.
Usa la lingua preferita, se indicata, altrimenti la lingua del modulo; la lingua
del consenso resta quella effettiva dell'informativa visualizzata.

- `pending_provider`: invio non effettuato; mancano condizioni o configurazione.
- `sending`: tentativo preso in carico in modo persistente.
- `sent`: il trasporto SMTP ha accettato il destinatario, **non** prova di lettura
  o recapito nella posta in arrivo.
- `uncertain`: errore SMTP o tentativo interrotto; non viene dichiarato spedito.
- `simulated`: solo trasporto iniettato nei test isolati, senza rete SMTP.
- `failed`: valore previsto dal contratto per un fallimento certo; gli errori
  ambigui sono classificati conservativamente come `uncertain`.

Ogni destinatario viene reclamato atomicamente una volta; retry HTTP e worker
concorrenti non inviano due volte. Il lock sulla riga durante il trasporto
impedisce che una cancellazione completi mentre un invio è in corso. Non esiste
garanzia exactly-once tra database e SMTP: dopo un esito ambiguo non si ritenta
automaticamente. Il titolare deve verificare la propria casella, senza
presumere che il cliente abbia ricevuto la conferma.

All'avvio del server e ogni minuto, i messaggi live ancora `pending_provider`
vengono elaborati (massimo 20 schede per passaggio) solo con tutti i blocchi
soddisfatti. I tentativi `sending` fermi da oltre 10 minuti diventano `uncertain`,
mai un nuovo invio. Le schede sintetiche non entrano nel trasporto reale.
I test sostituiscono il trasporto con una funzione locale: nessuna email reale
è stata inviata per verificare questa funzione.

## Conservazione e cancellazione

All'avvio del processo API e ogni minuto PostgreSQL elimina le richieste
anteriori a `now() - interval '12 months'`, salvo `acquiredCustomer = true`
che identifica esclusivamente un rapporto contrattuale effettivo.
Non si usa una stima in giorni e lo stato commerciale non influenza la deroga.
Lo stesso indicatore può essere corretto dal titolare; se viene tolto a una
scheda già scaduta, la successiva manutenzione la elimina.

Non è un cron esterno: funziona quando il processo API è in esecuzione. Dopo
un'interruzione o un periodo di sospensione, il primo avvio recupera le scadenze
arretrate, senza attendere traffico verso l'elenco interno. Gli errori di
manutenzione sono segnalati senza dati personali e il minuto successivo riprova.
Le schede acquisite richiedono una distinta gestione contrattuale/fiscale:
la deroga non autorizza conservazione illimitata per ogni scopo.

La cancellazione non può ritirare messaggi già consegnati a caselle email,
copie esportate dal titolare o backup gestiti dai fornitori. Per una richiesta
di cancellazione occorre gestire separatamente anche questi canali, secondo
le politiche dei fornitori e gli obblighi applicabili.

## Provenienza, conversioni e informative

Solo il percorso esatto presente nel catalogo noto del sito può essere
conservato. Query, frammenti, URL esterni, percorsi privati o sconosciuti vengono
scartati. Sono ammessi solo `utm_source`, `utm_medium`, `utm_campaign`, con
token brevi alfanumerici/trattino/underscore, senza email, lunghe sequenze
numeriche o termini sensibili. Non conservare nomi, email o identificativi
persona nei codici campagna; non vengono acquisiti gclid/fbclid, referrer
integrali, utm_term/utm_content o parametri arbitrari.

`generate_lead` usa il runtime GA4 preesistente: configurazione valida,
consenso cookie corrente, pagina ammessa e richiesta non sintetica. La ricevuta
serve soltanto alla deduplicazione locale; codice, contatti e contenuti del
modulo non attraversano il confine analytics.

`call-conversions.ts` prepara gli adattatori Meta/Google Ads con consenso
specifico distinto e payload fisso privo di dati personali. Rimangono
**non configurati e non autorizzati**: nessun tag/account/advertising è attivato,
né la casella marketing né il consenso analytics li abilitano. Un'eventuale
integrazione futura deve usare il runtime isolato e un'informativa/consenso
adeguati, non iniettare script nel contesto autenticato principale.
Non vengono accodate conversioni negate da recuperare dopo un consenso futuro.

L'addendum chiamate è separato e versionato (`call-2026-11-25-professional`), visibile prima
dell'invio e richiamabile dal footer nelle tredici lingue IT/EN/DE/FR/ES/NL/PT/PL/
RU/SV/NO/DA/AR. Non sostituisce né approva le informative generali oggetto di altro
lavoro: nessuna dichiarazione inventata di identità legale, sede, hosting,
fornitori approvati o localizzazione dei dati. La revisione linguistica e legale
del titolare resta distinta dalla verifica funzionale e i blocchi esistenti
restano invariati.

## Verifiche ripetibili

`pnpm --filter @workspace/api-server run test:call-requests` crea uno schema
PostgreSQL casuale, senza fallback al `public`, usa solo dati sintetici e
smonta schema e server alla fine. I test sostituiscono autenticazione, trasporto
e inventario percorsi solo nel bundle di test; nessuna porta di test o bypass
è presente nell'app distribuita. Copre validazioni/consensi, honeypot, salvataggio
concorrente/idempotenza, limiti persistenti, 401/403, filtri, note/acquisizione,
CSV, email simulate in tredici lingue, errori/interruzioni, conservazione e
cancellazione. Comprende i test di preparazione conversioni e blocco senza
consenso/configurazione.

Per il singolo collaudo browser, dopo aver acquisito una ricevuta **sintetica**
univoca, `node artifacts/api-server/scripts/simulate-call-delivery.mjs CALL-…`
esegue lo stesso servizio di consegna con trasporto locale. Accetta soltanto una
riga sintetica esistente, non può elaborare richieste live, non carica un
trasporto SMTP reale e non cambia flag o secret. Il pannello mostra quindi
`simulated` dopo ricarica. Eliminare soltanto la scheda creata dal collaudo.
Questo helper non è incluso nell'applicazione distribuita.

Il collaudo locale non certifica consegna SMTP reale, ricezione GA4 reale,
approvazioni privacy o attivazione pubblicitaria. Pubblicazione esclusivamente
a cura del proprietario dopo merge e controlli di rilascio.

### Esito del collaudo del 23 novembre 2026

- Typecheck completo del workspace e build frontend superati.
- 26 verifiche dedicate (API/database, conversioni e interfaccia iniziale in 12
  lingue), più suite permessi/monitoraggio, recensioni Google, i18n e SEO superate.
- Unico passaggio browser su mobile 390×844: errori e consensi, invio sintetico,
  ricevuta senza falsa conferma email, trasporto simulato, accesso titolare,
  note/stato/cliente acquisito persistenti dopo ricarica, CSV e conferma di
  cancellazione. Controllo aggiuntivo desktop e apertura inglese nello stesso
  passaggio. Tutte le schede e appartenenze temporanee sono state eliminate.
- Il passaggio ha individuato il rifiuto dei filtri data: le stringhe HTTP
  sono ora convertite prima della validazione generata. Aggiunte verifiche API
  positive per data iniziale, finale, intervallo inclusivo e CSV con date,
  oltre ai casi già presenti per date invalide e intervalli invertiti.
  Correzione confermata senza ripetere l'intero passaggio browser.
- Resi leggibili anche su mobile i selettori dei filtri interni.
- Nessuna email reale inviata, nessun flag/secret modificato, nessuna
  pubblicazione eseguita.

## Richieste di studi professionali

La sezione per architetti e interior designer riutilizza queste stesse API,
tabella, autorizzazioni e consegna email: non è un secondo archivio lead.
Il progetto `professional_studio` richiede il paese già esistente e un oggetto
`professional` con studio, tipo progetto (villa/hotel/resort/yacht/other), fase,
prodotto, materiale, misure/disegni descritti in testo, scadenza e uno o entrambi
gli intenti `samples` e `block_selection`. Il budget resta facoltativo. I testi
preliminari possono dire «da definire». Non sono caricati file e nessun URL
presente nelle descrizioni viene scaricato dal server.

Il contratto generato controlla tipi, limiti e categorie. Il servizio controlla
anche i campi vuoti dopo il trim, gli intenti ripetuti e l'assenza di un brief
professionale nascosto nelle richieste di altra categoria. L'ordine delle due
caselle non cambia l'identità del contenuto per un retry. La versione
dell'informativa corrente è richiesta per ogni nuovo invio; le versioni
precedenti restano leggibili nelle schede storiche.

I dati strutturati restano nel JSON della medesima riga, senza nuovi schemi o
migrazioni distruttive. Dettaglio privato, esportazione individuale, CSV e
notifica al titolare includono il brief; i filtri categoria, paese, lingua,
intento e tipo progetto sono combinabili. Il CSV ha colonne separate per tutti
i campi professionali, sempre neutralizzate contro formule. Le richieste
professionali seguono la stessa cancellazione a dodici mesi e la medesima
deroga contrattuale esplicita; non è prevista conservazione separata del brief.

In anteprima si conservano solo i valori testuali sintetici fissi; le categorie
di progetto e gli intenti non personali permettono di verificare i filtri.
Nome studio, paese, misure, scadenza, messaggio, budget e recapiti digitati
vengono scartati come nel flusso preesistente. Non si fa passare un invio
sintetico per una richiesta commerciale effettivamente ricevuta.

La conferma automatica professionale è tradotta nelle tredici lingue e dichiara
espressamente che non è il riscontro umano, un preventivo o un'approvazione
degli esecutivi. L'impegno del proprietario è un **primo riscontro entro
24 ore lavorative**: non definisce orari di apertura, fuso, presidio nei festivi
o un termine di consegna dei prodotti. La notifica al titolare riporta
lo stesso distinguo.
