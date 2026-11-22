# Marenetto Build

Sito multilingue React/Vite con rendering HTML lato server, API Express,
PostgreSQL e autenticazione Clerk. Il sito e l'API sono due processi Node
distinti: nessun comando proprietario è necessario per build o avvio.

## Requisiti

- Node.js 22 LTS o successivo compatibile; verifiche di questo intervento con
  Node 24.
- pnpm 10, usando il lockfile del repository.
- PostgreSQL con lo schema del progetto già predisposto.
- Configurazione di Clerk e delle integrazioni effettivamente usate.

Non commettere file con credenziali. Impostare le variabili nel sistema sicuro
di configurazione dell'host; non inserirle in file pubblici o parametri URL.

## Installazione e build

Dalla radice del repository:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run typecheck

PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
pnpm --filter @workspace/api-server run build
```

La prima build produce HTML e asset in
`artifacts/marenetto-build/dist/public` e il renderer privato in `dist/server`.
La seconda prepara lo snapshot editoriale e il server API. Non eseguire un
semplice file server sulla radice del repository o sull'intera cartella `dist`:
il renderer server, i manifesti e le sorgenti non sono risorse pubbliche.

Conservare le dipendenze installate del workspace: l'attuale renderer SSR usa
anche pacchetti esterni al bundle. Non usare un'installazione ridotta con
`--prod` senza prima predisporre e verificare il relativo pacchetto di deploy.

## Avvio con Node

In un processo:

```sh
NODE_ENV=production PORT=8080 node artifacts/api-server/dist/index.mjs
```

In un secondo processo:

```sh
NODE_ENV=production PORT=3000 \
EDITORIAL_API_ORIGIN=http://127.0.0.1:8080 \
node artifacts/marenetto-build/scripts/serve-seo.mjs
```

`EDITORIAL_API_ORIGIN` deve raggiungere l'API della **stessa pubblicazione**,
non un dominio pubblico che potrebbe servire una versione precedente.
Se l'archivio editoriale non è verificabile, il server fallisce in modo chiuso:
non ripubblica copie statiche di articoli ritirati.

Configurare davanti ai processi un reverse proxy HTTPS:

- `/api` e relativi sottopercorsi → processo API, inclusa la route
  `/api/__clerk` già usata dal progetto;
- tutte le altre richieste → processo web;
- preservare gli host e impostare gli header di inoltro solo sul proxy fidato.

Il valore esistente di `trust proxy` presuppone un solo proxy fidato: controllare
questa topologia prima di usare un host diverso. TLS e HSTS vanno gestiti sul
proxy HTTPS; non rimuovere gli header di sicurezza applicativi. Non esporre
direttamente le porte interne a Internet.

## Configurazione e servizi necessari

Questa documentazione elenca nomi, mai valori di credenziali.

- **Database:** configurazione PostgreSQL del progetto. Verificare migrazioni
  e backup prima di applicare modifiche allo schema; la build non autorizza
  modifiche al database di produzione.
- **Clerk:** chiavi e proxy già previsti dal progetto. La chiave pubblicabile
  è intenzionalmente pubblica; la chiave segreta appartiene solo all'API.
  Il codice interno del pacchetto Clerk non viene riscritto né offuscato.
- **Email:** configurazione SMTP esistente. Non eseguire invii di prova né
  modificare destinatari o flag di approvazione per collaudare questa pulizia.
- **Immagini e documenti:** gli asset locali sono serviti dall'app; quelli
  nell'archivio oggetti usano Google Cloud Storage tramite l'adattatore di
  autenticazione gestito esistente. Questa dipendenza è ancora necessaria.
  Ospitare anche l'API su un'altra infrastruttura richiede un adattatore di
  autenticazione GCS compatibile: non basta copiare i nomi delle variabili.
  Questo intervento non migra oggetti, credenziali o ACL.

Il solo sito web e il renderer non dipendono a runtime dai plugin di sviluppo
o dal sistema analytics della piattaforma. Le integrazioni necessarie sopra
elencate non sono state eliminate per simulare un'indipendenza inesistente.

## Host consentiti e GA4

`artifacts/marenetto-build/src/config/public-hosts.json` contiene due
liste esplicite:

- `siteHosts`: host pubblici autorizzati;
- `analyticsRuntimeHosts`: host autorizzati del runtime GA4 separato.

La seconda lista è inizialmente vuota: non è stato inventato né autorizzato
un dominio analytics. La raccolta rimane bloccata finché non viene inserito un
host confermato e non vengono soddisfatti anche tutti gli altri prerequisiti.
Non cambiare i flag di consenso, privacy o rilascio per il solo fatto che
la build è pronta.

La build verifica tramite Public Suffix List che il runtime non condivida
il dominio registrabile del sito; l'API mantiene il proprio controllo
indipendente. Nel browser arrivano solo gli host esatti consentiti, non la
libreria Public Suffix List né una blacklist di fornitori.

Per un altro dominio occorre aggiornare coerentemente host consentiti,
origine canonica, configurazione server, DNS/TLS e impostazioni dei servizi
collegati. La selezione di un host non autorizza nuovi tracciamenti.

Il runtime GA4 viene caricato solo dopo consenso esplicito e viene rimosso
alla revoca. Istruzioni dedicate:
`artifacts/marenetto-build/analytics-runtime/README.md`.

## Controlli del candidato

```sh
pnpm run typecheck
pnpm --filter @workspace/marenetto-build run test:seo
pnpm --filter @workspace/marenetto-build run test:i18n
```

La build esegue automaticamente il controllo dei file distribuiti: niente
impronte della piattaforma nel codice applicativo, tracker, strumenti di
sviluppo, source map, percorsi assoluti interni o nomi di configurazione
server nel client. Clerk è separata in un chunk identificabile e preservata.

Il server reale risponde 404 alle mappe anche accidentalmente copiate e ai
README tecnici degli asset. `/llms.txt` risponde `200 text/plain` senza
dipendere dall'API editoriale o dal rilevamento lingua.

L'indicizzazione richiede produzione, dominio WWW canonico e l'esplicito
gate di rilascio del progetto; le anteprime restano escluse.

## Impostazioni esterne al codice

Il sistema di pubblicazione può aggiungere analytics e header **dopo** la
risposta dell'applicazione. Per questo deploy occorre disattivare
**Publishing → Adjust settings → Enable analytics** e ripubblicare.
La pulizia del bundle non equivale ad aver modificato questa impostazione.

Verificare dopo il Republish che nessuna pagina carichi il tracker aggiunto
dalla piattaforma e che `/llms.txt` risponda come previsto. Gli header aggiunti
dal proxy esterno non possono essere rimossi dal processo Node a monte:
occorre un controllo configurabile sul proxy di uscita. Non si promette
l'assenza di ogni possibile impronta dell'hosting o del framework.
