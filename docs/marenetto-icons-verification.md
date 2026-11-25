# Icone Marenetto — verifica e ripetibilità

## Ambito

Solo icone, manifest, dichiarazioni comuni e consegna statica. Nessuna pubblicazione,
modifica a contenuti, SEO, consensi, permessi o al lavoro separato sulle quattro aree.
Le icone sono asset locali, senza dipendenze di rete.

SVG originale preservato byte per byte:

```text
SHA-256 prima/dopo:
24e80f51c6dabe094720b1ff978d86cfcf4b5b6fe266c1fa06d35bd0df63a4bf
```

## Risorse

Tutti gli URL della tabella sono alla root. GET e HEAD verificati con risposta 200,
MIME corretto, GET byte-identico al file, HEAD senza corpo e lunghezza coerente.

| URL | Content-Type | Dimensioni | Cache-Control |
| --- | --- | --- | --- |
| /favicon.svg | image/svg+xml | viewBox 48×48, originale | public, max-age=31536000 |
| /favicon.ico | image/vnd.microsoft.icon | tre frame PNG reali 16×16, 32×32, 48×48 | public, max-age=31536000 |
| /favicon-48x48.png | image/png | 48×48 | public, max-age=31536000 |
| /favicon-96x96.png | image/png | 96×96 | public, max-age=31536000 |
| /apple-touch-icon.png | image/png | 180×180 | public, max-age=31536000 |
| /icon-192.png | image/png | 192×192 | public, max-age=31536000 |
| /icon-512.png | image/png | 512×512 | public, max-age=31536000 |
| /icon-maskable-512.png | image/png | 512×512 | public, max-age=31536000 |
| /site.webmanifest | application/manifest+json | JSON same-origin | public, max-age=0, must-revalidate |

Nessun `immutable` aggiunto. Policy di HTML, risposte private e asset diversi dalle
icone inalterate. Allowlist esatta condivisa tra anteprima e server Node.
Preview noindex; sul rilascio autorizzato le nuove risorse seguono il regime
pubblico già previsto per il vecchio favicon. CSP e modalità inalterate:
`default-src 'self'` consente già il manifest locale.

## Geometria e fedeltà

- I raster derivano dall'intero SVG originale con sharp, senza ridisegnare i tracciati.
  Rasterizzazione almeno doppia rispetto al formato finale, senza ingrandimenti
  da raster a bassa risoluzione.
- Apple: composizione del contenitore al 84%, interno 151×151, margini 14/15 px
  su 180 px. Fondo pieno #23211f, opacità completa, nessun arrotondamento esterno.
- Maskable: contenitore al 56%, interno 287×287, margini 112/113 px su 512 px.
  Anche l'intero quadrato originale rientra nel cerchio sicuro di diametro 80%.
  Ogni pixel diverso dallo sfondo, inclusa linea arancio e antialiasing,
  è entro raggio 183,96 px, inferiore al limite 204,8 px.
- ICO: directory binaria con tre immagini indipendenti, non un file PNG rinominato.
  Frame 16: offset 54, 472 byte; frame 32: offset 526, 904 byte;
  frame 48: offset 1430, 1331 byte. Totale 2761 byte.

## Verifiche ripetibili

```sh
pnpm --filter @workspace/marenetto-build run generate:icons
PORT=4198 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
pnpm --filter @workspace/marenetto-build run test:icons
pnpm --filter @workspace/marenetto-build run test:seo
pnpm run typecheck
node artifacts/marenetto-build/scripts/icons-proxy-audit.mjs <origine-di-sviluppo>
```

Le prove coprono:

- generazione byte-identica, hash originale, dimensioni, opacità, cerchio sicuro,
  frame ICO e riferimenti del manifest;
- 1314 documenti generati dopo sincronizzazione, comprese shell, errori localizzati, 404 e 410;
- tutte le tredici lingue IT, EN, DE, FR, NL, ES, PT, RU, PL, SV, NO, DA, AR;
- SSR editoriale attivo e indisponibilità 503, shell interne anonime, richieste
  sconosciute e percorsi malformati;
- 36 richieste GET/HEAD al server di produzione attraverso gateway TCP con API
  sintetica, nei due regimi preview e rilascio simulato; altre 18 sul proxy condiviso;
- assenza di modifiche estranee in 1301 documenti/mappe/feed della baseline iniziale
  e in 1327 del progetto principale dopo la sincronizzazione finale,
  escludendo solo dichiarazioni icone e spazi tra tag nell'head.
  Nessuna esclusione per contenuti, SEO o token HMR nel confronto di produzione.

Esiti: typecheck workspace superato, build e scanner produzione superati,
test icone 3/3, regressioni SEO 39/39, gruppo consensi/sicurezza/rilascio 16/16
(con alcune prove comuni alla suite SEO).

Due test esistenti assumevano ancora l'arabo bloccato e dodici lingue.
I fallimenti sono stati riprodotti con gli script originali e la baseline;
aggiornate soltanto le aspettative dei test alle lingue già pubbliche.
Il controllo della risposta 404 resta alla frontiera HTTP, senza modificare
il comportamento del renderer delle lingue escluse.

## Evidenze e rapporto finale

Le evidenze di questa esecuzione sono in `generated-artifacts/marenetto-icons/`,
escluse da Git e dal deployment. Il rapporto HTML autonomo consegnato conserva
tabella HTTP, matrice delle lingue, immagini a dimensione reale e sotto maschera,
hash e risultati browser, oltre ai limiti dei controlli. Per rigenerarlo con
le evidenze presenti:

```sh
node artifacts/marenetto-build/scripts/icons-baseline-comparison.mjs
node artifacts/marenetto-build/scripts/icons-report.mjs
```

Il confronto richiede la copia `baseline/` acquisita **prima** delle modifiche.
La sincronizzazione ha preservato la nuova sezione professionisti arrivata nel
frattempo dal progetto principale. Le prove iniziali non sono state sovrascritte.
`baseline-main-comparison.json` verifica separatamente il progetto principale
aggiornato: template Main e sorgenti frontend identiche, compilati nella stessa
radice canonica, con esclusione dei soli tag icone richiesti. Nessuna esclusione
per nomi/hash di asset. Una build in directory isolata cambiava il rilevamento
Tailwind e non è stata usata per attestare identità.
Build, typecheck, test icone e 39 regressioni SEO sono stati ripetuti dopo
sincronizzazione. Il test browser precedente resta limitato alle dichiarazioni
comuni e ai percorsi documentati, non al collaudo della nuova sezione.
La verifica browser utilizza Chromium e snapshot sintetici, non account privati.
Esito browser: head singola nelle tredici lingue dopo idratazione, navigazione
client, back/forward e cambio lingua reale IT→EN→AR; nove risorse caricate,
zero violazioni CSP per icone e manifest. Quattro blocchi script della dipendenza
di autenticazione nella shell anonima, con CSP enforce solo nel processo di test,
sono preesistenti e non sono stati corretti né usati per certificare il login.
La differenza pixel fra Apple e SVG a tutto formato è prevista: Apple usa l'intero
contenitore originale ridotto uniformemente al 84% e centrato, non un altro disegno.
Le prove su iPhone/iPad e Android fisici non sono state eseguite; nessuna
installazione PWA completa viene certificata. Verifica delle icone effettivamente
pubblicate e loro eventuale comparsa su Google possibili solo dopo pubblicazione
del titolare e scansione dei motori. Nessuna richiesta di indicizzazione eseguita.
