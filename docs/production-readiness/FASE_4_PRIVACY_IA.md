# Fase 4 — Privacy, cookie e trasparenza IA

Consegna candidata del 23 novembre 2026, successiva al rapporto autonomo
`FASE_3_SERVIZI.md`. Stesso ramo aggiornato dalla Main con Fase 2 e pulizia
di produzione; nessuna pubblicazione, email reale, sonda SMTP o notifica IndexNow.

## Esito e limiti di questa consegna

L’implementazione tecnica è preparata per la revisione del titolare, **non è
ancora una liberatoria per pubblicare le informative**. I nuovi testi non
ereditano le approvazioni della Fase 2 e rimangono noindex ed esclusi da sitemap,
hreflang di rilascio e feed pubblici fino ad approvazione effettiva.
I collegamenti nel footer e nel modulo consentono di esaminarli nel candidato.

Non è stata pubblicata la dichiarazione “verificati dal nostro team”: manca
la prova di una revisione umana dei contenuti da parte del titolare/team.
Al suo posto il candidato dichiara l’uso dell’IA e la revisione da documentare.
Una verifica automatica di codice o traduzioni non vale come revisione umana
del contenuto commerciale né come consulenza legale.

## Inventario dei trattamenti

| Ambito | Implementato e osservabile nel codice | Stato effettivo / limite |
|---|---|---|
| Navigazione pubblica | SSR, risorse locali, suggerimento lingua e link esterni | Richieste di servizio al dominio proprio; prova browser separata sotto |
| Preferenza lingua | localStorage `marenetto-language` | Senza scadenza applicativa, cancellabile dal browser; non è consenso |
| Statistiche | Runtime separato, categorie opzionali, consenso minimo versionato, nessun dato libero nei quattro eventi ammessi | `analyticsRuntimeHosts` è vuoto; la preview non attiva analytics. La configurazione esistente non è stata abilitata per la prova |
| Preferenza analytics | localStorage `marenetto.analytics.v1`, scelta/data/versione/configurazione, validità massima 180 giorni | Solo una configurazione valida può registrare consenso analytics; nessuna categoria preselezionata |
| Rifiuto / revoca | Arresto runtime/iframe, timer e invii; rimozione cookie `_ga*`, `_gid`, `_gat` controllabili sul dominio corrente | Non si promette di cancellare cookie di altri domini. Nuova scelta persistente e legata alla versione; prove abilitate solo nella fixture isolata |
| Modulo progetto | Nome, recapito, lingua, località, immobile, lavori, messaggio, dettagli opzionali e presa visione | Presa visione obbligatoria non è consenso marketing; nessuna nuova finalità. In preview, la modalità protetta usa dati sintetici secondo i controlli già esistenti |
| Antiabuso modulo | HMAC dell’IP e istante; limiti e lock mantenuti | Record tentativi eliminati dopo 24 ore, avvio e ogni 15 minuti; non è la conservazione dei lead |
| Richieste progetto e rapporti | Database e ruoli interni | Nessuna cancellazione reale. La regola delle richiamate non viene estesa automaticamente: per questo flusso mancano ancora periodo e gestione affidabile dei clienti acquisiti |
| Richiamate, nella Main aggiornata | Evidenze server di versione/data/lingua, scelte separate e marcatore esplicito cliente acquisito | Cancellazione a 24 mesi implementata, salvo acquisiti; non equivale alla conservazione delle richieste progetto o dei backup |
| Notifiche | Aruba SMTP e registro di consegna quando operativamente abilitati | Nessun invio eseguito. Ricezione della casella interna e contatto pubblico non sono equiparati |
| Area interna | Clerk, sessione autenticata, ruoli, allegati privati predisposti | Non sono state create sessioni reali né inviate email di accesso. Elenco effettivo dei cookie/tempi in una sessione autorizzata ancora da documentare |
| Fornitori | Hosting Replit, PostgreSQL, Clerk, Aruba e App Storage secondo configurazione del progetto | Contratti art. 28, intestatari, regioni, sub-responsabili, trasferimenti e garanzie non dedotti dal nome del software |
| Collegamenti esterni | Normali link mail, telefono, Google e WhatsApp; nessun widget preventivo inserito | Apertura volontaria del servizio esterno distinta da un incorporamento preventivo |
| Font | Dieci famiglie locali dalla Main aggiornata, inventario e licenze OFL conservati | Nessuna importazione preventiva Google Fonts, incluse quelle secondarie dello stile del marchio |

### Aggiornamento dalla Main e conferma societaria

Il candidato è stato riallineato alla Main aggiornata che comprende recensioni
Google server-only, richieste di chiamata nelle dodici lingue, metadati SEO
e font locali. La prima matrice sopra documenta anche lo stato precedente:
le precisazioni seguenti prevalgono per il candidato aggiornato.

- Il 23 novembre 2026 l’impresa ha confermato ragione sociale, P.IVA e sede
  del titolare del trattamento; fonte `CONTROLLER_CONFIRMATION.md`.
  Rimossa l’indicazione “in attesa di conferma” da configurazione centrale,
  contatti, footer, `llms.txt` e informative nelle 12 lingue. Non è una visura.
- Le richieste di richiamata hanno ora un percorso distinto: dati obbligatori,
  presa visione, consenso marketing e autorizzazione WhatsApp separati,
  evidenze server di versione/data/lingua e accesso riservato al titolare.
  La privacy generale include integralmente l’informativa di questo flusso
  nelle 12 lingue, separata dal modulo progetti che non iscrive al marketing.
- La Main implementa per le richiamate la cancellazione dopo 24 mesi di
  calendario salvo clienti esplicitamente acquisiti, con controllo all’avvio
  e ogni minuto. Questo non definisce i periodi ancora mancanti delle vecchie
  richieste progetto, dei contratti, delle email recapitate e dei backup.
  Non è stata eseguita manualmente alcuna cancellazione reale.
- Recensioni e foto Google passano dal server, senza chiamate preventive del
  browser a Google; i collegamenti esterni restano volontari. Non sono state
  richieste recensioni reali, salvati payload o screenshot di contenuti Google.
- La sorgente font attiva è quella appena unita nella Main: dieci famiglie
  locali con inventario, licenze e controlli dedicati. Nessun nuovo download
  o servizio terzo viene attivato per applicare la conferma societaria.

La mappa distingue funzionalità esistente, attivazione reale e prova in
fixture. La sessione privata e la produzione non sono certificate da prove
effettuate sul candidato.

## Informative e modulo nelle 12 lingue

36 nuove pagine SSR: privacy, cookie e uso IA in italiano, inglese, tedesco,
francese, spagnolo, neerlandese, portoghese, polacco, russo, svedese,
norvegese e danese. Data reale della nuova redazione: 23 novembre 2026,
versione iniziale. Il testo identifica la provenienza storica dei dati
societari e la successiva conferma dell’impresa, con i punti ancora da approvare,
senza inventare un DPO, fornitori
contrattualmente confermati, sedi dei dati o durate universali.

Sono descritti finalità e basi proposte, destinatari e trasferimenti da
confermare, conservazione e mancanze, diritti, reclamo al Garante e contatto.
Il footer collega privacy, cookie e pagina IA; “Preferenze cookie” è tradotto
e apre realmente il pannello. Quando non ci sono strumenti opzionali attivi,
non viene mostrato un banner di consenso inutile.

Il pannello della categoria analytics offre Accetta / Rifiuta con la stessa
presentazione e Personalizza; categoria opzionale inizialmente spenta, modifica
e revoca. Nessun consenso da scorrimento. Non sono aggiunti widget o tracker
per dimostrare il funzionamento.

Nel modulo, `privacyAccepted` resta il nome storico del campo API ma significa
**presa visione**, non consenso alla risposta né al marketing. La checkbox
resta obbligatoria e inizialmente non selezionata; il server continua a
respingerne l’assenza. Informativa breve e link completo in scheda separata
non devono perdere i campi. Anti-spam, honeypot, limiti e controlli operativi
non sono indeboliti. Nessuna finalità marketing o WhatsApp implicita.

## Inventario e trasparenza delle immagini

Inventario riproducibile con `pnpm --filter @workspace/marenetto-build run
audit:images`, dopo build. Output JSON e CSV in
`generated-artifacts/privacy/image-inventory.*`.
Comprende URL, occorrenze con pagina/lingua/tipo, sorgenti responsive, copertine,
anteprime social, sfondi HTML/CSS e asset conservati ma non attivi.
Classificazione con fonte e azione; diritti non documentati dichiarati tali.

Le famiglie `approved-hero-*` derivano dall’illustrazione IA fornita dal
titolare; la conversione AVIF/WebP/JPEG non è un nuovo intervento IA.
Le famiglie `cefalu-hero-*` includono ritocchi IA locali documentati. Il master
e il logo non sono stati alterati per aggiungere testo.
Gli altri asset storici non diventano “fotografie autentiche” per assenza
di prova contraria: sono classificati di origine incerta.

Etichetta individuale visibile localizzata per le immagini IA note
(“Immagine elaborata con IA”), e indicazione di origine da verificare per le
immagini storiche incerte. Etichette nella presentazione del hero, nelle
schede, nelle copertine e nel corpo HTML: non semplici alt, tooltip o metadati.
La nota generale nel footer resta complementare.
Il portfolio premium non è riempito con queste immagini. Un’etichetta non
autorizza a usare un’illustrazione come prova di un lavoro eseguito.

## Fonti e verifiche giuridiche

Consultate il 23 novembre 2026:
- https://www.garanteprivacy.it/faq/cookie
- https://ai-act-service-desk.ec.europa.eu/it/ai-act/article-50

L’esenzione dei cookie tecnici non è attribuita automaticamente a qualsiasi
analytics. L’articolo 50 non viene descritto come obbligo indistinto di
etichettare ogni testo commerciale IA. La trasparenza più ampia implementata
segue la scelta del titolare; non è una certificazione di conformità.

## Dati e decisioni necessari prima del via libera

1. **Confermato dall’impresa il 23 novembre 2026:** identità del titolare,
   ragione sociale, P.IVA e sede: Marenetto s.r.l. unipersonale, IT06471740826,
   SS 113 Settentrionale Sicula 73b, 90015 Cefalù (PA). È una conferma del
   titolare, non una verifica anagrafica indipendente.
2. Approvare basi e bilanciamento antiabuso, registro dei fornitori,
   accordi, regioni/trasferimenti e garanzie applicabili. DPO solo se esiste.
3. Approvare periodi/criteri per richieste, clienti e contratti, notifiche,
   evidenze di presa visione/consenso, log e backup. Il flusso richiamate
   già distingue esplicitamente i clienti acquisiti e applica i 24 mesi;
   non estendere automaticamente questa regola alle richieste progetto.
   Provare ogni eventuale nuova procedura con anteprima su dati sintetici, senza
   cancellare dati reali senza un’autorizzazione informata.
4. Completare l’inventario in una sessione interna autorizzata, senza
   messaggi di prova. Non dedurre cookie realmente attivi da una lista SDK.
5. Fornire diritti/provenienza degli asset incerti, originali probatori dei
   lavori reali e autorizzazioni di riuso. Per la galleria, checklist Fase 3.
6. Revisionare i nuovi testi nelle 12 lingue e documentare chi/data/contenuti
   della revisione umana. Solo allora utilizzare la frase richiesta con
   “verificati dal nostro team” e approvare le nuove edizioni per rilascio.

La casella **info@marenettobuild.com non è verificata**: il contatto pubblico
rimane **info@marenetto.com**. Nessun test reale, rinomina, cambio SMTP,
interrogazione RCPT o deduzione da record DNS/MX.

## Prove tecniche

- Typecheck dell’intero workspace: superato.
- Build web SSR e controllo degli asset di produzione: superati.
- Otto controlli mirati servizi/privacy: superati (24 servizi, 36 informative,
  12 home con etichetta IA, modulo, font locali, schema, geografia e crawler).
- 39 test SEO HTTP/editoriale, metadati e font dopo il riallineamento alla Main:
  superati, inclusi esclusione dei ritirati, indisponibilità dello stato e
  fail-closed di `llms.txt`.
- Nove controlli i18n e sei controlli di regressione della Fase 2: superati.
- Screenshot candidato della nuova sezione premium: acquisito.
- Un solo passaggio browser mirato: esito riportato nell’allegato tecnico
  al termine della prova. Nessun invio reale.

### Esito del passaggio browser mirato e correzioni

Viewport 390 × 844, percorso arredi → richiesta → informativa e preferenze,
più home, articolo e pagina IA inglese. Confermati testi, quattro FAQ,
preselezione arredi, checkbox inizialmente vuota e collegamenti localizzati.
Rete: tutte le richieste osservate sul dominio di preview; nessun host
Google Fonts, mappe, widget WhatsApp o analytics. Le numerose richieste
`src`, `node_modules`, `@vite` sono strumenti di sviluppo, non asset distribuiti.
Nessun cookie o sessionStorage rilevato nel campione pubblico; un solo flag
localStorage degli strumenti di preview, non un consenso applicativo.

Nella fixture isolata, **3/3 scenari superati**: accetta/rifiuta/revoca,
persistenza e configurazione cambiata/scaduta; nuova personalizzazione con
checkbox inizialmente spenta, salvataggio del rifiuto senza chiamate,
abilitazione volontaria e rimozione di iframe/cookie controllabili alla revoca.
Provider e invii sono intercettati: non è un test GA4 reale o di produzione.

La prova ha rilevato e consentito di correggere tre problemi del candidato:
- Il componente Link intercettava il normale click anche con `target=_blank`.
  Il collegamento privacy del modulo ora è un elemento HTML `a` nativo:
  apre la scheda separata senza smontare il modulo. Test di regressione
  sul componente nativo e HTML SSR; nessun dato reale inviato.
- Il pannello aperto ora è fisso, scorrevole e posto sopra la barra contatti,
  non dietro di essa; l’inattività non impedisce di chiudere le preferenze.
- La didascalia IA del hero è in una fascia immediatamente successiva,
  collegata con `aria-describedby`, non sovrapposta ai pulsanti. Master e
  geometria fotografica non sono modificati.

Non è stato avviato un secondo passaggio browser: le correzioni sono
verificate con sorgente, SSR, typecheck/build e screenshot mobile.
La sessione privata rimane esplicitamente non verificata.

### Verifica dopo la conferma societaria

Gli otto controlli mirati verificano ora anche la conferma del titolare nelle
12 lingue, la presenza dei dati centrali e l’informativa richiamate completa
nella privacy generale. Typecheck, build, 39 controlli SEO/font, nove i18n
e sei controlli Fase 2 superati sul candidato riallineato.

In sviluppo la nuova tabella richiamate non era ancora presente, come
verificato con una sola lettura di metadati. È stata applicata la migrazione
non distruttiva già presente nella Main: creazione di tabella e indice,
senza toccare le vecchie richieste o cancellare record. Nessun invio email
o test SMTP; i processi di sviluppo mantengono i blocchi live esistenti.
Questa verifica non riguarda lo schema o i dati della produzione.

Nel registro dei controlli configurati era presente un esito negativo di
`marenetto-route-regressions`: la stessa asserzione, ripetuta su nove larghezze
e due ambienti, esigeva ancora la vecchia nota IA soltanto nel footer.
L’asserzione è stata aggiornata alla nuova richiesta del titolare, mantenendo
tutti i controlli geometrici e aggiungendo l’etichetta individuale del hero.
Non è stata rilanciata l’intera suite browser in questo passaggio; non viene
quindi dichiarata superata dalla sola modifica dell’aspettativa.

Sono prove del candidato locale. Non attestano quale revisione sia su WWW,
ricezione email, indicizzazione, conformità legale, approvazione dei testi
da parte del titolare o funzionamento di account/fornitori non provati.

**Stato: consegna tecnica disponibile per revisione; via libera al republish
non ancora rilasciato per i punti sopra elencati.**
