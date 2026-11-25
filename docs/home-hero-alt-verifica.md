# Alt della home — verifica prima/dopo

Data: 25 novembre 2026. **PRONTO PER REPUBLISH — nessuna pubblicazione eseguita.**

## Perimetro effettivo

Corretto esclusivamente il passaggio della lingua al calcolo dell’alt del
hero `cefalu-hero-left-1672.jpg`. Le descrizioni sono quelle già presenti in
`heroDescription`, senza riscritture o fallback italiano nelle altre lingue.
La proprietà obbligatoria `altLocale` è passata sia da `HomePage` in
`App.tsx` sia dalla composizione delle home storiche in `pages/historical.tsx`.
Quest’ultimo punto è necessario per le nove home storiche: intervenire solo
su `App.tsx` non coprirebbe tutte le dodici edizioni pubbliche.

Nessun provider linguistico ampliato. Nessuna modifica a testi, altri alt,
asset, stili, API, consensi, Secrets, indicizzazione o avvisi IA.

## Baseline e prove

Revisione iniziale: `9dc4acadfd63cbc19901706ccea8f358fb3eb113`.
L’albero di lavoro iniziale era pulito (`baseline.patch` vuoto).
Baseline nuovo e separato dalle precedenti evidenze SEO:
`generated-artifacts/home-hero-alt/`.

- `global-seo/before/`: inventario HTTP, sitemap, 699 HTML grezzi e audit browser
  acquisiti **prima** della modifica.
- `global-seo/after/`: gli stessi dati della build finale.
- `dev-before/` e `dev-after/`: dodici risposte grezze effettive dell’anteprima.
- `comparison.json`: confronto integrale dei 699 HTML, tutti i campi SEO,
  attributi immagine e hash degli undici asset del hero.
- `browser-regression.json`: esiti esatti per lingua, HTML HTTP,
  idratazione, ritorno client e cambio dal menu lingua reale.
- `home-prima-dopo.csv`, `rapporto.html`: tabella e rapporto scaricabile.
- Log dei comandi e screenshot della home inglese.

La directory generata è già esclusa da Git e pubblicazione. Un collegamento
locale `generated-artifacts/global-seo` indirizza gli script originali verso
questa directory dedicata, senza modificarli. I tentativi intermedi sono
conservati separatamente, non sostituiscono né il baseline né il candidato finale.

Il primo typecheck ha individuato il secondo utilizzatore storico del hero,
inizialmente privo della nuova proprietà obbligatoria. È stato corretto prima
della build e delle verifiche finali. La regressione eseguita sulla build
originale fallisce effettivamente a `/en/`, mostrando alt italiano anziché inglese.

## Risultati

Per tutti gli URL il controllo HTTP locale con host WWW simulato restituisce
200. Nella colonna “Prima”, **IT** significa esattamente:
«Illustrazione di Cefalù con case, mare e La Rocca».
Gli URL identificano le edizioni: non sono una verifica della produzione pubblicata.

| URL di riferimento | Lingua | Prima | Alt dopo | HTML / idratazione / ritorno client / menu lingua |
| --- | --- | --- | --- | --- |
| https://www.marenettobuild.com/ | IT | IT | Illustrazione di Cefalù con case, mare e La Rocca | OK / OK / OK / OK |
| https://www.marenettobuild.com/en/ | EN | IT | Illustration of Cefalù with houses, sea and La Rocca | OK / OK / OK / OK |
| https://www.marenettobuild.com/fr/ | FR | IT | Illustration de Cefalù avec maisons, mer et La Rocca | OK / OK / OK / OK |
| https://www.marenettobuild.com/de/ | DE | IT | Illustration von Cefalù mit Häusern, Meer und La Rocca | OK / OK / OK / OK |
| https://www.marenettobuild.com/nl/ | NL | IT | Illustratie van Cefalù met huizen, zee en La Rocca | OK / OK / OK / OK |
| https://www.marenettobuild.com/es/ | ES | IT | Ilustración de Cefalù con casas, mar y La Rocca | OK / OK / OK / OK |
| https://www.marenettobuild.com/pt/ | PT | IT | Ilustração de Cefalù com casas, mar e La Rocca | OK / OK / OK / OK |
| https://www.marenettobuild.com/ru/ | RU | IT | Иллюстрация Чефалу с домами, морем и скалой Ла-Рокка | OK / OK / OK / OK |
| https://www.marenettobuild.com/pl/ | PL | IT | Ilustracja Cefalù z domami, morzem i skałą La Rocca | OK / OK / OK / OK |
| https://www.marenettobuild.com/sv/ | SV | IT | Illustration av Cefalù med hus, hav och La Rocca | OK / OK / OK / OK |
| https://www.marenettobuild.com/no/ | NO | IT | Illustrasjon av Cefalù med hus, hav og La Rocca | OK / OK / OK / OK |
| https://www.marenettobuild.com/da/ | DA | IT | Illustration af Cefalù med huse, hav og La Rocca | OK / OK / OK / OK |

### Verifiche riuscite

| Comando o controllo | Esito |
| --- | --- |
| `pnpm run typecheck` | Superato in tutto il workspace |
| Build con `PORT=4188 BASE_PATH=/` | Superata; production guard superata |
| `test:seo-global` | 5 test superati, compreso confronto esatto dell’alt nelle 12 home |
| `test:seo` | 39 test superati |
| `global-seo-audit.mjs before` e `after` | 699 URL ciascuno; stesso script, tutti gli indicatori aggregati invariati a zero |
| `global-seo-browser.mjs before` e `after` | 699 percorsi ciascuno; zero mismatch, errori, violazioni CSP o richieste esterne |
| `test:hero-alt` | Superato: 12 HTML, 12 idratazioni, 12 ritorni client, 12 cambi lingua reali |
| `home-hero-alt-report.mjs` | 699 confronti integrali riusciti; solo 11 alt cambiati e italiano invariato |
| Undici file immagine hero | Blob identici alla revisione iniziale |
| Screenshot anteprima `/en/` | Layout visibile regolare, nessun errore nel log browser |
| `git diff --check` | Superato |

La regressione verifica anche che il cambio lingua avvenga nello stesso
documento, senza ricarica, e che tutti gli attributi dell’immagine restino
identici fra HTML, idratazione e ritorno client.

## Confronto senza cambiamenti estranei

Lo script HTTP globale è identico prima/dopo, SHA-256:
`47628e61eb7ffd376727b80f844aa84840dde5f99c9c477f3d3fbde86a9a9fab`.

Il confronto integrale consente solamente:

1. la sostituzione attesa dell’alt dell’unico hero nelle home;
2. il riferimento esatto al bundle applicativo ricompilato:
   `/assets/index-pDAJvsYi.js` → `/assets/index-B7R3Vxv7.js`.

Il secondo cambiamento è un fingerprint di build, **non** un token di cache
di sviluppo. Nessuna eliminazione generica di hash, spazi, date, testo o
metadati. Anche l’italiano è identico byte per byte salvo quel riferimento.
Title, description, canonical, hreflang, JSON-LD completo, avvisi IA,
didascalie, sorgenti responsive, dimensioni, priorità e stili restano identici.

Gli HTML di sviluppo grezzi sono conservati senza sostituzioni. Contengono
strumentazione diagnostica e coordinate sorgente che possono variare; non
sono usati per dichiarare uguaglianza byte per byte della build. Non è stato
necessario ignorare alcun token Vite nel confronto certificante di produzione.

## Problemi preesistenti lasciati invariati

Cinque altre immagini per ciascuna home SV, NO e DA hanno ancora l’alt italiano
del catalogo: costruzioni, gestione proprietà, acquisto casa, giardino e pietra.
Sono quindici casi, elencati in `comparison.json`, non riguardano il hero e non
sono stati corretti. Il controllo globale di alt non vuoto non rileva la lingua
sbagliata; per questo la nuova regressione del hero usa il testo esatto.

I log di build contengono avvisi già presenti nel baseline su dimensione dei
bundle, direttive di dipendenze e import JSON. Non sono errori di build e non
sono stati affrontati in questo intervento.

## Riproduzione

Dalla radice, con baseline originale già acquisito e conservato:

```sh
pnpm run typecheck
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
node artifacts/marenetto-build/scripts/global-seo-audit.mjs after
node artifacts/marenetto-build/scripts/global-seo-browser.mjs after
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run test:seo-global
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run test:seo
pnpm --filter @workspace/marenetto-build run test:hero-alt
node artifacts/marenetto-build/scripts/home-hero-alt-report.mjs
```

Per acquisire il prima da zero occorre la revisione iniziale in una copia
separata, build con la stessa configurazione e i due auditor con etichetta
`before`, prima di modificare il sorgente e prima di sostituire gli asset.
Non eseguire `before` sul candidato finale. Per rianalizzare soltanto gli
snapshot originali: `global-seo-audit.mjs before --saved`.

Le prove usano server locali isolati, API editoriale sintetica vuota e
intercettazione delle richieste browser esterne. Nessuna modifica a dati o
impostazioni reali e nessun accesso a servizi a pagamento. Nessuna verifica
Search Console o attestazione delle risposte attualmente pubblicate.

**PRONTO PER REPUBLISH — nessuna pubblicazione eseguita.**
