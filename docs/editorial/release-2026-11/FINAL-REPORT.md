# Rapporto italiano — candidato del 26 novembre 2026

## Stato: PRONTO PER REPUBLISH

Non è stato eseguito alcun Republish né modificato il database produttivo.
Il percorso automatico del prossimo normale avvio è implementato, senza login
owner, console del browser o endpoint pubblico privilegiato. Il titolare ha
autorizzato separatamente «Autorizza i dieci casi esatti» dopo la consegna del
CSV dei conflitti privati di sviluppo. L'eccezione ora lega solo quelle dieci
coppie identità/lingua ai percorsi, hash, contenuti e sorgenti esatti.
Le revisioni precedenti sono conservate e le nuove edizioni sono attive
nell'anteprima di sviluppo, non in produzione. Readiness HTTP 200, 290 edizioni
pubbliche coincidenti col candidato isolato e zero conflitti residui.

## Baseline realmente osservato

Acquisizione in sola lettura del sito WWW il 26/11/2026: **930 URL sitemap**,
risposte HTML/header grezze conservate, robots e snapshot pubblico delle 120
edizioni della serie. Le 120 impronte pubbliche osservate coincidono con le
impronte approvate della serie. Questo non permette di dedurre lo stato delle
bozze private produttive e non sostituisce il controllo dopo il rilascio.

Base della revisione: `e38befd2a8cf721d3a5926db3968e151cf984693`, più le modifiche
del candidato di questa consegna. L'inventario globale registra data,
impronta delle modifiche, impronta dell'auditor e snapshot effettivamente letto;
le risposte grezze e i manifest permettono di identificare il candidato senza
presentare la base Git come un commit finale già integrato.

## Identità e conteggio corretto

| Insieme | Edizioni |
|---|---:|
| Pacchetto, 14 famiglie × 13 lingue | 182 |
| Acquisto condiviso con la serie, in sola lettura | 12 |
| Attivazioni del pacchetto, araba acquisto compresa | 170 |
| Serie, 10 puntate × 12 lingue | 120 |
| Unione distinta attiva nel candidato PostgreSQL isolato | 290 |
| Nuovi URL realmente aggiunti al baseline pubblico | 169 |
| URL serie rinominati uno-a-uno | 96 |
| URL nuovi nel diff, rinominati compresi | 265 |
| URL rimossi dal diff, tutti sostituiti uno-a-uno | 96 |
| Sitemap finale del candidato | **1.099** |

Quindi **930 − 96 + 265 = 1.099**, non 930 + 182. I tredici URL acquisto
restano quelli pubblici previsti, inclusa la versione araba già esistente.
Le puntate storiche 4 e 7 conservano i rispettivi 24 URL.
Le altre otto puntate hanno 96 URL descrittivi nelle dodici lingue della
serie; la serie non viene estesa all'arabo.

## Attivazione e conservazione

Importazione, promozione e migrazione usano la transazione e il lock editoriale
esistenti. Tutte le precondizioni vengono analizzate prima delle scritture di
rilascio; gli errori provocano rollback. Il piano opera su copie, non promuove
contenuti solo per un attore o evento plausibile e preserva le revisioni
successive veramente approvate, verificando le traduzioni contro la sorgente
italiana **attiva**, non contro l'ultima bozza.

L'attore è dichiaratamente automatico, con autorizzazione interna del titolare
del 26/11/2026 e revisione assistita da IA: non vengono inventate sessioni,
firme, qualifiche professionali, revisori madrelingua o verifiche Google.
Le normali operazioni CMS restano owner-only dove previsto; l'importer privato
di bozze mantiene il proprio blocco in produzione.

Le impronte storiche non cambiano:

- serie: `1dd9d90422515b715a125e4798aec6736948bb53f452258d5ee2bad8a081fe44`;
- pacchetto compilato: `dea2b40f25e1d52ff10369140b4180cc4036b427bd48999ba095facb7dfc8ca3`.

Route e presentazioni SEO sono autorizzate separatamente, con evidenza
prima/dopo per ogni edizione della serie. Il titolo SEO non sostituisce
manoscritto o H1. Gli indici approvati sono verificati da tutte le build
ordinarie, anche di sviluppo; la rigenerazione richiede il comando esplicito
di authoring. Le build parallele pubblicano un catalogo completo tramite
staging separato e rinomina atomica.

Ritiri, corruzione o indisponibilità restano fail-closed anche a freddo:
nessun fallback statico rimette in pubblico ciò che non è verificabile.
La readiness legge il pacchetto e la serie sullo stesso deployment dopo
l'importazione, non il vecchio dominio pubblico.

## Risultati del candidato, non della produzione

- **1.099/1.099** URL sitemap HTTP 200 e indicizzabili nella configurazione
  di produzione, con canonical assoluto HTTPS/WWW autoreferenziale.
- **182/182** edizioni del pacchetto presenti una volta e con corpo effettivo
  verificato, sorgenti e presentazioni corrette; hreflang reciproci alle
  tredici edizioni complete più x-default.
- **120/120** edizioni della serie verificate, 24 URL storici conservati.
- **192/192** varianti dei vecchi URL, con/senza slash, HTTP **301** diretto
  al nuovo canonical; query campagne e parametri aggiuntivi conservati.
  Gli alias non entrano in sitemap. I redirect storici estranei non sono
  indiscriminatamente trasformati in 301.
- Tutte le 14 famiglie sono raggiungibili dagli archivi Guide e dalle pillar
  pertinenti nelle 13 lingue, arabo compreso. Non è stata aggiunta una nona
  famiglia commerciale. Riutilizzati i collegamenti dinamici delle pillar.
- Nessun link interno nell'inventario punta ancora ai 96 vecchi URL canonici.
- Audit globale HTML iniziale: **zero** title/description fuori dai limiti,
  duplicati di title/description, link rotti o non verificati, errori H1,
  gerarchie scorrette, alt inadeguati, JSON-LD non valido o hreflang incoerenti.
- I sette title della puntata a distanza coincidenti con la guida commerciale
  sono stati distinti con testi localizzati. I title corretti sono inferiori
  a 65 caratteri Unicode, senza troncamento automatico.
- **1.099/1.099** pagine controllate anche tramite navigazione client con asset
  di produzione, HTML catturato e snapshot attivo reale del candidato;
  zero discrepanze, errori pagina, violazioni CSP o richieste esterne.
- **18 passaggi** desktop/mobile a 390 px: archivio → casale → pillar →
  EN → DE → AR → EN, puntata migrata e canonical; nessuna discrepanza,
  overflow orizzontale o errore di ritorno RTL → LTR. Il browser riproduce
  localmente la destinazione registrata del redirect; il vero HTTP 301 è
  provato separatamente dal collaudo HTTP, non simulato come evidenza server.
- Le immagini pubbliche già esistenti utilizzate dal browser sono acquisite
  in sola lettura con HTTP 200 e tipo immagine, senza nuovi media né chiamate
  a provider a pagamento. Nessun invio di form, email o richiesta commerciale.
- **21 test PostgreSQL isolati** superati: avvio fresco, stato preesistente,
  solo candidati, già applicato, bozze successive, basi precedenti esatte,
  acquisto aggiornato con italiano attivo reale, traduzioni obsolete,
  ritiri/ripartenze, digest/payload/presentazioni manomessi, riordino jsonb,
  ordine array, approvazione mancante, eventi plausibili, collisioni,
  migrazioni ripetute, concorrenza, guasto di scrittura e rollback/riprova;
  dieci riconciliazioni esatte con cronologia conservata, mutazioni successive,
  undicesima edizione non autorizzata, collisione sull'alias privato arabo e
  ritiro di una delle importazioni autorizzate.
- **10 test API/CMS del pacchetto** e **11 regressioni editoriali API**
  più **6 test dei permessi** superati in isolamento; **83 regressioni web** superate, compresi i
  controlli editoriali, route, quattro aree, arabo, legali e consensi.
- Typecheck dell'intero workspace e build di produzione API/web nell'ambiente
  supportato superati; compilazione parallela verificata. Nessuna riscrittura
  autonoma dei testi legali, modifica analytics/consensi o attivazione portfolio.

Le verifiche browser usano fixture di trasporto, non contenuti fittizi:
le pagine e lo snapshot sono quelli realmente prodotti dal database isolato.
Non costituiscono un controllo del sito dopo il Republish.
La suite configurata `marenetto-route-regressions` ha eseguito 284 casi:
276 superati, 7 esclusioni previste dalle condizioni dei test e un timeout
nella categoria storica desktop a 1440 px, durante l'attesa del caricamento
completo delle risorse. La stessa prova è stata ripetuta su server stabile,
senza cambiare applicazione o test, ed è passata in 9,7 secondi (21,1 secondi
incluso l'avvio): complessivamente 277 casi verificati e 7 esclusioni.
L'uscita iniziale del comando completo rimane documentata come fallita,
non viene trasformata retroattivamente in un successo. I controlli configurati
`internal-access` e `typecheck` sono terminati con successo.

Durante una prova diagnostica del trasporto browser è avvenuto anche un GET
in sola lettura al nuovo URL non ancora pubblicato (404 sul sito vivo): non
viene confuso con l'esito del candidato. Il percorso finale offline non ha
risposte dal vivo. Il collaudo delle immagini comprende anche le varianti
responsive `srcset`: **114 risorse pubbliche esistenti**, con verifica del tipo,
dell'impronta e decodifica dei pixel;
una risorsa non acquisita non viene sostituita con una risposta JSON fittizia.

## Eccezioni documentate e conflitti

**115 metadati** sono fuori dall'intervallo preferenziale più stretto, ma
restano nei limiti accettati. Il CSV/JSON delle eccezioni riporta URL,
conteggio e causa. Descrizioni approvate brevi ma compiute vengono conservate
per non aggiungere affermazioni nuove o testo riempitivo: non sono errori di
indicizzabilità e non giustificano promesse sui risultati Google.

**Dieci conflitti di sviluppo riconciliati**, prima individuati senza scritture:

- acquisto IT, EN, DE, NL, FR, ES, PT, PL e RU: singolo import privato,
  nessuna revisione attiva, contenuto diverso dalle basi autorizzate;
- acquisto AR: base nota, ma vecchio percorso privato diverso da quello
  pubblico autorizzato.

Non si deduce l'approvazione dal solo evento `import`. È stata acquisita la
decisione esplicita del titolare sui dieci casi del CSV, separata
dall'autorizzazione originaria del pacchetto. Il nuovo manifest conserva
hash registrati e digest semantici dei contenuti, sorgenti e destinazioni.
Il normale avvio transazionale ha aggiunto soltanto le revisioni già approvate,
senza cancellare o alterare le vecchie. La cronologia delle dieci importazioni
risulta conservata; un secondo preflight restituisce 290 conservazioni e nessuna
nuova attivazione. Il vecchio percorso privato arabo diventa un alias, mentre
il canonical arabo già pubblico resta invariato.

L'anteprima ora risponde correttamente e lo screenshot aggiornato mostra il
contenuto effettivo. `conflitti-sviluppo.csv` resta l'inventario **prima**,
non viene riscritto per cancellare il problema; `riconciliazione-dieci-import.csv`
e `continuita-candidato.json` documentano l'esito successivo. Il confronto
verifica l'identità di tutte le 290 coppie, percorsi, hash revisione/sorgente
e contenuti pubblici con lo snapshot del candidato già sottoposto ad audit:
gli audit HTML e browser restano validi, senza simulare un nuovo controllo
produttivo. Qualsiasi caso diverso, bozza successiva, modifica di contenuto,
sorgente, percorso o ledger continua a bloccare la riconciliazione automatica.

## Evidenze e riproduzione

Eseguire i comandi dal README e conservare gli output sotto
`generated-artifacts/`. Gli output grezzi non entrano in Git né nel deploy.

- `indexing-recovery/live/`: baseline con data, sitemap, robots, HTML/header
  grezzi compressi e snapshot pubblico osservato.
- `indexing-recovery/candidate/`: audit, inventario e risposte grezze candidate.
- `indexing-recovery/commercial-matrix.csv`: 182 attivazioni/conservazioni,
  hash revisione/sorgente/presentazione e stato HTTP/indice.
- `indexing-recovery/series-before-after.csv`: 120 edizioni, confronto effettivo.
- `indexing-recovery/historical-before-after.csv`: continuità puntate 4 e 7.
- `indexing-recovery/redirects.csv`: 192 prove HTTP, vecchio → nuovo, codice
  e Location; 96 migrazioni distinte.
- `indexing-recovery/seo-length-exceptions.json`: eccezioni motivate per URL.
- `global-seo/after/`: sitemap, inventario CSV/JSON, 1.099 HTML iniziali,
  esiti client, risposte delle immagini pubbliche già esistenti.
- `release-152-tests/`: log build/typecheck/test, prova PostgreSQL estesa,
  percorso browser desktop/mobile e screenshot, conflitti di sviluppo.
- `release-152-delivery/riconciliazione-dieci-import.csv` e
  `continuita-candidato.json`: chiusura dei dieci conflitti autorizzati e prova
  che l'output pubblico non cambia rispetto al candidato collaudato.

Il controllo in sola lettura `node
artifacts/api-server/scripts/check-deployment-release.mjs` elenca i conflitti
del database configurato senza chiamare l'importazione o effettuare scritture.
L'omissione ricorsiva dei casi già segnalati serve solo a enumerare i conflitti
indipendenti: non è una migrazione autorizzata né un risultato di readiness.

## Passaggio a Claude

Seguire [HANDOFF.md](HANDOFF.md). Non richiedere la vecchia sessione owner
per il pacchetto esatto. Non eseguire Republish finché questo rapporto non
riporta esplicitamente **PRONTO PER REPUBLISH** senza conflitti bloccanti,
come questa versione del rapporto.
Il titolare pubblica tramite Claude; il controllo produttivo successivo
rimane separato e non è dichiarato già eseguito in questo rapporto.
