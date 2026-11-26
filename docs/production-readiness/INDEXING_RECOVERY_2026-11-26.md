# Ripristino dell’indicizzazione e serie approvata

## Ambiente e limite della consegna

Verifica pubblica del 26 novembre 2026; candidato basato sul risultato integrato
della consegna multilingue già presente nel repository. Nessun Republish,
mutazione del database produttivo, modifica di Secrets, account o DNS, invio
Search Console/IndexNow o chiamata IA a pagamento è stato eseguito.

Le prove di scrittura usano **un nuovo PostgreSQL locale isolato**, accessibile
soltanto attraverso un socket Unix e privo di collegamenti ai database reali.
Le regressioni ordinarie del CMS usano i propri dati sintetici di sviluppo;
la prova della consegna multilingue usa il suo adattatore in memoria.
Questi risultati non certificano che l’operazione sia già avvenuta in produzione.

## Fatti, ipotesi e causa dimostrata

La baseline pubblica riproducibile è in
`generated-artifacts/indexing-recovery/live/`: sitemap XML conservata nella
risposta grezza compressa, elenco completo degli indirizzi, 120 risposte HTML
con intestazioni e timestamp. La revisione Git registrata identifica il
workspace osservante, **non una revisione produttiva ricavata da Git**.

- Sitemap viva: **810 indirizzi**.
- Tutte le 120 edizioni del catalogo integrato: HTTP 200, `noindex, nofollow`.
- Tutte le 24 edizioni delle famiglie acquisto/piscine: escluse dalla sitemap,
  senza hreflang; canonical WWW conservato.
- L’HTML vivo contiene uno snapshot pubblico di **120 revisioni della serie
  attive**. La vecchia risposta non espone ancora gli hash di revisione.
  L’attivazione della serie è dunque osservabile anche senza accesso operativo
  al database. Non è stata diagnosticata un’importazione mancante.
- Non è stata eseguita alcuna interrogazione del database produttivo.
  Versioni delle righe, cronologia completa e conflitti operativi richiedono
  un’ispezione autorizzata separata; non si deducono dalla sola sitemap.

La causa concreta era nella fusione dei metadati: ogni revisione guida con
`searchConsoleVerified:false` riceveva `indexing:never` e `sitemap:false`.
La regola colpiva anche contenuti attivi, autorizzati internamente, agli
indirizzi storici. La verifica di un account Search Console non è invece una
condizione tecnica per autorizzare l’indicizzazione.

Lo stato Search Console resta **non verificato**: nessuna attestazione di
proprietà, revisione professionale o madrelingua è stata inventata.

## Correzioni e continuità editoriale

Le autorizzazioni della serie sono limitate a digest, identità, lingue, episodi,
route, hash e sorgenti italiane esatti. L’indice pubblico contiene soltanto
queste impronte, non i dossier privati. Il compilatore verifica l’allineamento
in produzione senza riscrivere i sorgenti; in sviluppo non riscrive un indice
identico. Questo evita anche riavvii del renderer durante build parallele.

La stessa fusione di metadati alimenta HTML SSR, intestazioni HTTP, sitemap,
hreflang e aggiornamenti client. Per i documenti pubblici inclusi, l’header
è esplicitamente `X-Robots-Tag: index, follow`; anteprime, privato, errori e
risorse escluse conservano il blocco.

Una nuova candidata non sostituisce il puntatore alla revisione pubblica e
non rende obsolete le traduzioni della sorgente **attiva** precedente.
Quando cambia davvero la sorgente attiva, gli hash delle traduzioni attive
sono confrontati con quella sorgente e le traduzioni superate vengono escluse
dall’indicizzazione e dagli hreflang. Non vengono omesse dallo snapshot per
poi ripescare involontariamente una copia statica allo stesso indirizzo.
Un puntatore attivo senza eventi validi di approvazione/attivazione produce
indisponibilità esplicita, non una pubblicazione sostitutiva.

Restano esclusi guide di composizione non riconosciuta, traduzioni non
approvate/superate, anteprime, login, privato, tag, Progetti non approvati
e download vuoti. Ritiri e guasti di lettura non recuperano testo dal catalogo
statico, nemmeno dopo un riavvio a freddo.

## Attivazione automatica al rilascio

Il collaudo browser ha inoltre trovato e corretto un difetto preesistente:
le puntate non commerciali non passavano la propria identità al selettore
lingua e rimandavano agli indici. Ora il selettore usa le edizioni equivalenti
autorizzate della stessa puntata; la navigazione client mantiene lingua e
direzione del documento. I metadati client conservano `og:locale` del SSR e
il grafo `GeneralContractor`, senza rimuoverlo quando aggiornano Article/FAQ.

Una successiva revisione realmente approvata e attivata dal titolare nel CMS
può ereditare il percorso già autorizzato della stessa identità/lingua:
l’API espone una prova pubblica booleana solo dopo avere verificato gli eventi
di approvazione e attivazione esatti. Senza questa prova il solo hash diverso
non ottiene l’indicizzazione. Le traduzioni devono comunque riferirsi
all’italiano attualmente attivo. Questa continuità ordinaria **non autorizza
l’importer automatico a promuovere un nuovo digest**; eventuali conflitti con
la composizione sigillata restano protetti e bloccano la readiness del rilascio.

È stato verificato e mantenuto l’importer già integrato, non un secondo CMS:

1. La verifica di avvio API `/api/healthz` chiama l’inizializzazione editoriale.
2. L’importazione e le normali mutazioni condividono la medesima transazione
   PostgreSQL e il medesimo advisory lock.
3. Prima di scrivere, viene verificato l’intero piano della serie contro il
   digest approvato, le identità/lingue/route e le revisioni correnti.
4. Solo i contenuti esatti autorizzati possono essere approvati e attivati
   automaticamente. Gli eventi dichiarano **sistema automatico e
   autorizzazione dichiarata dal titolare**, non una sessione owner simulata.
5. Una revisione attiva valida resta invariata, anche se esiste una candidata
   successiva. Le ripetizioni non aggiungono revisioni o eventi.
6. Un ritiro resta tale. Percorsi/alias concorrenti, revisioni o sorgenti
   divergenti non vengono sovrascritti. Un vecchio attore o evento di
   rilascio, da solo, non autorizza nulla.
7. Il controllo API non risponde pronto se non riconosce tutte le 120
   revisioni/sorgenti attese.
8. Il controllo web `/__release-readiness`, escluso dall’indicizzazione,
   legge la stessa API interna del deployment, controlla identità e percorsi
   di tutte le 120 edizioni e rende anche la vera homepage con quello snapshot.
   Un’edizione mancante o un guasto dà HTTP 503, non un falso via libera.

La connessione server usa l’indirizzo del servizio API dichiarato nello stesso
deployment. Non interroga il vecchio sito sul dominio pubblico durante la
promozione. Gli endpoint di readiness non sono sostituti della verifica
post-rilascio dell’HTML WWW.

### Conflitti e conservazione della pubblicazione precedente

In caso di conflitto di revisione/percorso già esistente, il piano automatico
della serie non promuove un’altra composizione. Le revisioni pubbliche
precedenti e la cronologia rimangono intatte; le letture verificate continuano
a usarle. La readiness segnala gli indirizzi attesi mancanti. Un digest invalido
o un errore transazionale provoca rollback completo.

Se questo accade nella destinazione reale: leggere la lista `missing` di
`/__release-readiness`, aprire `/internal` con la vera sessione del titolare,
cercare l’identità/lingua indicata e confrontare revisione attiva, ultima
candidata, percorso e sorgente italiana. Non cancellare né ripristinare sopra
una revisione più recente. Occorre una nuova autorizzazione puntuale o un
indice aggiornato e collaudato per quel contenuto; niente attivazione forzata.
Questo è un percorso di risoluzione di eventuali conflitti futuri, **non un
passaggio owner residuo necessario per le 120 edizioni qui collaudate**.

## Raccordo con la guida acquisto integrata

Il risultato effettivamente integrato della consegna multilingue mantiene le
dodici revisioni acquisto della serie in sola lettura. La presentazione
aggiuntiva autorizzata, inclusi processo SAL e metadati, è separata e ha una
propria impronta. Queste dodici revisioni, le altre 108 puntate, gli originali,
gli eventi e gli indirizzi non sono stati riscritti.

La prova della consegna multilingue continua a superare i suoi controlli su
182 edizioni interessate e 290 complessivamente attive nello snapshot isolato.
Quella consegna distingue 170 attivazioni ulteriori e 12 revisioni conservate:
la sua eventuale attivazione owner nell’ambiente di destinazione resta il
percorso già documentato in `docs/editorial/release-2026-11/HANDOFF.md`.
Questa correzione non attiva autonomamente quelle altre 170 edizioni.

L’arabo già autorizzato resta disponibile secondo il suo catalogo, compresi
i reciproci collegamenti delle famiglie condivise. La serie non viene estesa
all’arabo: la sua matrice resta **10 × 12 = 120**.

## Candidato e inventario

Il candidato del processo HTTP di produzione, configurato WWW/HTTPS con
indicizzazione pubblica, è collegato allo snapshot proveniente dalla prova
di attivazione PostgreSQL isolata.

| Misura | Vivo acquisito | Candidato |
|---|---:|---:|
| URL unici in sitemap | 810 | 930 |
| Edizioni acquisto/piscine richieste in sitemap | 0 | 24 |
| Edizioni complete della serie in sitemap | 0 | 120 |
| URL della baseline persi | — | 0 |
| Recuperi di URL preesistenti | — | 24 |
| URL realmente nuovi della serie | — | 96 |

**834 URL ripristinati + 96 realmente nuovi = 930**, non 954.
Il diff rispetto alla baseline difettosa contiene 120 aggiunte:
24 recuperi più 96 nuovi indirizzi. Le 24 comprendono 18 URL del recupero
storico e sei traduzioni SV/NO/DA già pubblicate dal catalogo successivo.
Usare soltanto il vecchio archivio a nove lingue ne conterebbe erroneamente 18.

Non si maschera una mancanza con il totale: il controllo confronta ogni singolo
indirizzo e l’intera matrice di identità, episodio, lingua, revisione/hash,
sorgente italiana, autorizzazione, stato attivo e indicizzabilità.
Ogni voce della sitemap è richiesta realmente via HTTP e controllata per
200, meta/header robots, canonical WWW e hreflang reciproci verso URL inclusi.
Per le 120 edizioni vengono verificati anche tutti i blocchi del corpo
approvato, FAQ visibili e schema, H1 unico, alt e destinazioni dei link locali.
L’etichetta IA per immagine resta una dichiarazione aggiuntiva visibile, non
una differenza arbitraria del manoscritto.

Title e description della serie sono unici e localizzati. L’unica
semplificazione automatica elimina il suffisso di brand ridondante dai
titoli della serie che superano 60 caratteri; non tronca frasi. Le
eccezioni ai target indicativi 50–60 / 140–160 caratteri Unicode sono
censite **per URL** con testo, conteggio e motivazione nel file
`seo-length-exceptions.json`. Sono mantenute sintesi brevi già corrette e
qualificazioni necessarie, senza riscrivere contenuti o legalità per una quota.
La presentazione acquisto della consegna integrata rimane invariata.

## Evidenze e riproducibilità

Cartella esclusa da Git e dalla distribuzione:
`generated-artifacts/indexing-recovery/`.

- `live/baseline.json`, `live/sitemap.json`, `live/raw/`: baseline pubblica.
- `live/observed-active.json`: snapshot pubblico osservato nel documento vivo.
- `database-results.json`: esiti del database isolato.
- `candidate-active.json`: snapshot pubblico prodotto dalle revisioni attivate
  nel database isolato, con i dossier privati rimossi come nell’API reale.
- `candidate/audit.json`, `candidate/inventory.csv`, `candidate/sitemap.xml`,
  `candidate/raw/`: inventario e risposte del candidato.
- `historical-before-after.csv`: le 24 edizioni richieste, prima/dopo.
- `series-before-after.csv`: tutte le 120 edizioni, prima/dopo.
- `seo-length-exceptions.json`: eccezioni motivate alle lunghezze indicative.

Comandi principali, dalla radice del workspace:

```sh
PORT=4188 BASE_PATH=/ node artifacts/marenetto-build/scripts/export-editorial.mjs
pnpm --filter @workspace/api-server run test:series-release
NODE_ENV=production pnpm --filter @workspace/api-server run build
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
pnpm run typecheck
pnpm --filter @workspace/api-server run test:editorial
pnpm --filter @workspace/api-server run test:commercial-release
pnpm --filter @workspace/marenetto-build run test:seo
pnpm --filter @workspace/marenetto-build run test:series
pnpm --filter @workspace/marenetto-build run test:indexing-continuity
pnpm --filter @workspace/marenetto-build run test:i18n
node artifacts/marenetto-build/scripts/indexing-candidate-audit.mjs
```

Il primo comando prepara il catalogo senza database. La prova PostgreSQL
richiede gli eseguibili locali `initdb`/`pg_ctl` e crea ogni volta un cluster
nuovo; non legge `DATABASE_URL`. Le prove della consegna multilingue richiedono
il loro pacchetto già preparato, come descritto nel relativo HANDOFF.

## Checklist ripetibile dopo il Republish del titolare

Questa checklist **non è stata eseguita su una produzione ripubblicata**.
Il titolare decide separatamente quando eseguire il Republish dopo l’unione
del codice.

1. Confermare che API e web della nuova revisione superino i propri controlli
   di avvio, senza sostituirli con la sola liveness. Nessun login owner è
   necessario per la serie esatta autorizzata.
2. Acquisire una nuova baseline grezza, senza sovrascrivere quella precedente:

```sh
node artifacts/marenetto-build/scripts/indexing-baseline.mjs \
  https://www.marenettobuild.com generated-artifacts/post-release-baseline-DATA
node artifacts/marenetto-build/scripts/indexing-post-release.mjs \
  https://www.marenettobuild.com generated-artifacts/post-release-verifica-DATA
```

3. Attendere dal secondo comando esito senza errori: almeno 930 URL unici
   salvo altre aggiunte integrate, nessuna rimozione della baseline,
   esattamente tutte le 120 edizioni attese presenti, 24 indirizzi preservati.
   Con ulteriori attivazioni della consegna multilingue il totale può crescere:
   il diff per indirizzo rimane la prova, non il solo conteggio.
4. Controllare su ogni URL sitemap HTTP 200, meta e header `index, follow`,
   canonical WWW autoreferenziale, hreflang reciproci solo fra pagine incluse.
   Confrontare hash/revisione e sorgente dell’API nuova con la matrice;
   lo script verifica anche lo snapshot incorporato nelle 120 risposte.
5. Verificare in browser una nuova visita senza JS, idratazione, cambio lingua
   e collegamento fra puntate; controllare errori CSP e assenza di nuove
   richieste di consenso o tracking introdotte dalla correzione.
6. In caso di differenze inattese, conservare tutti gli esiti grezzi e fermare
   ulteriori attivazioni; non cancellare ritiri e non modificare i testi per
   far salire un conteggio. Confrontare lo stato reale del nuovo deployment.
7. Solo dopo questi controlli si può dichiarare il recupero **produttivo**
   dell’accessibilità e dei segnali SEO. L’effettiva scansione, indicizzazione,
   posizione o ricomparsa in Google restano decisioni del motore di ricerca.

## Esito finale

**PRONTO PER REPUBLISH**, limitatamente al candidato verificato e alla
composizione autorizzata descritta sopra. Nessun Republish è stato eseguito.

- Typecheck dell’intero workspace e build API/web nell’ambiente previsto:
  superati. Nessun manoscritto, originale storico, contenuto arabo, Secret,
  DNS o dato produttivo modificato.
- Regressioni: 39 SEO/HTTP/indisponibilità, 10 serie, 6 continuità
  dell’indicizzazione, 11 editoriali API, 10 raccordo multilingue,
  10 PostgreSQL isolato (incluso avvio tramite il vero endpoint API di
  readiness), 9 i18n, 1 prova DOM client multilingue: tutte superate.
- Browser: SSR senza JavaScript della prima puntata; idratazione; cambio
  IT → DE sulla stessa puntata; navigazione client verso le piscine storiche;
  cambio DE → IT sulla stessa piscina; acquisto storico IT → DE.
  Nessun ricaricamento documentale, errore di idratazione o violazione CSP
  nel percorso corretto. Le anomalie iniziali e la verifica mirata dopo la
  correzione sono entrambe conservate.
- Tutti i 930 URL della sitemap del candidato verificati singolarmente;
  120 corpi approvati e FAQ, 24 percorsi storici, nessuna perdita rispetto
  agli 810 URL della baseline viva. La reciprocità hreflang completa deriva
  dalla scansione HTTP di tutti gli URL, non dalle poche visite del browser.

Il riepilogo definitivo, le eccezioni SEO motivate per URL, i CSV e i log
grezzi sono nel rapporto HTML e nell’archivio allegati. I digest e l’inventario
dei file sorgente identificano il candidato; non sono spacciati per la
revisione Git della produzione attuale. L’attivazione reale del nuovo
deployment e la successiva risposta di Google restano da verificare **solo
dopo** un eventuale Republish deciso ed eseguito separatamente.
