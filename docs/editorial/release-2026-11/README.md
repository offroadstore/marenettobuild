# Otto approfondimenti, sei guide e serie — attivazione al deploy

## Confine dell’autorizzazione

Richiesta del titolare del **26 novembre 2026**: completare le 182 edizioni
approvate, con revisione assistita da IA, ed eseguire l’attivazione automatica
al prossimo normale deploy. Non è un ordine di pubblicazione autonoma o di
modifica immediata della produzione. Le normali API di approvazione restano
owner-only e l’importer privato di bozze resta disabilitato in produzione.

Il precedente handoff che richiedeva una sessione owner è sostituito da
[HANDOFF.md](HANDOFF.md). Esiti, limiti ed eccezioni sono nel
[rapporto finale italiano](FINAL-REPORT.md).

## Pacchetti e autorizzazioni distinte

- Pacchetto commerciale: 14 famiglie × 13 lingue, IT/EN/DE/FR/NL/ES/PT/RU/PL/SV/NO/DA/AR.
- Serie: dieci puntate × dodici lingue, **senza arabo**.
- Dodici acquisto sono condivise e in sola lettura. Il pacchetto comporta
  170 promozioni e 12 conservazioni, non 182 nuovi URL.
- Snapshot complessivo: **290** coppie identità/lingua, non 302.
- Digest radice commerciale storico:
  `dea2b40f25e1d52ff10369140b4180cc4036b427bd48999ba095facb7dfc8ca3`.
- Digest storico della serie:
  `1dd9d90422515b715a125e4798aec6736948bb53f452258d5ee2bad8a081fe44`.
- `deployment-authorization.json` lega separatamente il payload completo,
  le 120 destinazioni e il prima/dopo dei soli URL/title autorizzati.
  `refinements.mjs` contiene le scelte localizzate esplicite.

Nessun digest storico viene sostituito per autorizzare un manoscritto alterato.
Le presentazioni acquisto hanno la propria impronta. Anche i nuovi title della
serie sono presentazioni, senza creare revisioni CMS di testi invariati.
Revisioni successive realmente approvate prevalgono; le traduzioni devono
legarsi alla **vera sorgente italiana attiva**, non all’ultima bozza.

Il titolare ha successivamente autorizzato «Autorizza i dieci casi esatti»
per gli import privati acquisto elencati nel CSV dei conflitti di sviluppo.
`private-import-authorization.json` lega esclusivamente quei dieci stati
originari a contenuto semantico, hash, sorgente e percorso; le fixture
conservano la prova dei testi precedenti. Non è un'approvazione di altre
bozze: ogni revisione viene mantenuta, non riscritta, e ritiri, modifiche
successive, collisioni o un'undicesima edizione rimangono bloccanti.

## Riproduzione isolata

Dal workspace; PostgreSQL locale disponibile (`initdb` e `pg_ctl`), mai il
database configurato dell’app:

```sh
node artifacts/marenetto-build/scripts/export-editorial.mjs
pnpm --filter @workspace/api-server run test:series-release
pnpm --filter @workspace/api-server run test:commercial-release
PORT=19698 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/marenetto-build run build
NODE_ENV=production pnpm --filter @workspace/api-server run build
node artifacts/marenetto-build/scripts/indexing-candidate-audit.mjs
node artifacts/marenetto-build/scripts/global-seo-audit.mjs after \
  --snapshot generated-artifacts/indexing-recovery/candidate-active.json
node artifacts/marenetto-build/scripts/prepare-audit-resources.mjs \
  https://www.marenettobuild.com
node artifacts/marenetto-build/scripts/global-seo-browser.mjs after \
  --snapshot generated-artifacts/indexing-recovery/candidate-active.json
node artifacts/marenetto-build/scripts/release-152-journey.mjs
node --experimental-strip-types --test artifacts/api-server/tests/internal-permissions.test.mjs
node artifacts/api-server/scripts/test-editorial.mjs
pnpm run typecheck
node artifacts/marenetto-build/scripts/release-evidence-report.mjs
```

Il baseline pubblico, in sola lettura e con risposte grezze compresse, è
riproducibile così (ottenere nuovamente il dominio effettivo prima di usarlo):

```sh
node artifacts/marenetto-build/scripts/indexing-baseline.mjs \
  https://www.marenettobuild.com generated-artifacts/indexing-recovery/live
```

Il test PostgreSQL crea un cluster isolato su socket Unix, non legge l’URL del
database dell’app e lo arresta al termine. Il test delle API owner usa identità
esplicitamente sintetiche e un adattatore in memoria. L’audit HTTP usa il
processo web di produzione con lo snapshot **effettivamente attivato nel test
PostgreSQL**, non una fixture limitata alla serie. Il browser usa HTML e asset
locali e blocca trasporti esterni e scritture.
Il comando completo `test:permissions` include anche il test di monitoraggio,
che usa uno schema temporaneo nel database configurato: non è incluso in questa
ricetta che promette di non usare quel database. Non confonderlo con i test
editoriali e di permesso isolati sopra.
La ricetta ordinaria non esegue il programma di acquisizione degli import
privati: quella acquisizione in sola lettura è già stata svolta una volta,
dopo la decisione esplicita del titolare, e non fa parte di alcuna build.

Le build ordinarie, anche di sviluppo, verificano gli indici senza rigenerarli.
Ogni compilazione lavora in una cartella temporanea distinta e pubblica il
catalogo completo con rinomina atomica: API/web possono compilare in parallelo.
`--authorize-deployment` è un comando di manutenzione esplicito, non parte della
build o un’autorizzazione generica a contenuti futuri.

Le prove sono sotto `generated-artifacts/`, esclusa da Git e dal deploy.
Gli UUID isolati cambiano; gli hash dei contenuti devono restare deterministici.

## Contenuti e limiti conservati

Restano visibili dichiarazioni IA per immagine, fonti datate, FAQ e avvertenze
da verificare con il tecnico incaricato. Nessuna certificazione professionale,
madrelingua o Search Console è inventata. Il diagramma già autorizzato non è
una fotografia di un lavoro reale. Nessun nuovo media, portfolio, menu,
analytics, consenso o testo legale viene introdotto da questa attivazione.

Input commerciali dichiarati dal titolare, non stime di volume o classifiche:
house/villa in Sicily, villa with pool Sicily, haus Sizilien kaufen, huis
Sicilië, maison Sicile bord de mer, outdoor kitchen, pool house, microcemento.
Non autorizzano ripetizioni forzate, promesse di prezzo/rendimento o pagine
locali inventate.
