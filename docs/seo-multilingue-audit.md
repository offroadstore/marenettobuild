# Audit SEO multilingue — 25 novembre 2026

## Perimetro e origine delle prove

Il baseline deriva dalla versione integrata disponibile alla partenza:
`d47c6f21a8b8c50c0170dddf8e8997daa70a5c90`.
L’inventario HTTP della sitemap comprende 699 URL native nelle dodici lingue
IT, EN, FR, DE, NL, ES, PT, RU, PL, SV, NO, DA. Include la gestione immobili
già integrata, non anticipa le fasi ancora separate e non attiva l’arabo.
Non sono state create nuove URL.

Il processo di produzione locale è interrogato come host WWW ufficiale,
con una sorgente editoriale isolata vuota e pubblicazione simulata **soltanto
nel processo di prova**. La lettura dell’API editoriale di sviluppo ha
confermato uno snapshot vuoto. Non sono stati modificati flag reali,
approvazioni, domini, consensi, account o Secrets. Non è una verifica della
produzione pubblicata. I test separati delle revisioni attive e dei ritiri
coprono dati sintetici, indisponibilità e riavvio.

L’archivio consegnato contiene sitemap, HTML iniziale di ogni URL, inventari
JSON/CSV e risultati client prima/dopo. I file generati restano fuori da Git
e dai pacchetti di pubblicazione; il rapporto e l’archivio sono consegnati
separatamente come documenti scaricabili.

## Riproduzione sul candidato

Dalla radice del workspace:

```sh
pnpm run typecheck
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
node artifacts/marenetto-build/scripts/global-seo-audit.mjs after
node artifacts/marenetto-build/scripts/global-seo-browser.mjs after
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run test:seo-global
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run test:seo
pnpm --filter @workspace/marenetto-build run test:analytics
```

Il crawl HTTP avvia e chiude server isolati; il browser usa gli HTML
archiviati e gli asset della stessa build. Tutte le chiamate ai fornitori
sono intercettate: nessun invio email, chiamata AI, pagamento o consenso
reale. Le prove dei consensi inviano risposte sintetiche anche al modulo.

Le regressioni di lingua, servizi, trasferte, informative e gestione immobili:

```sh
PORT=4189 BASE_PATH=/ pnpm --filter @workspace/marenetto-build exec node --test \
  scripts/localization.test.mjs scripts/phase2.test.mjs \
  scripts/legal-pages.test.mjs scripts/phase34.test.mjs \
  scripts/travel-coverage.test.mjs scripts/consent-gating.test.mjs \
  scripts/service-offers.test.mjs scripts/privacy-notices.test.mjs \
  scripts/property-management.test.mjs scripts/marketing.test.mjs
```

Per rianalizzare il baseline già acquisito, senza ricrearlo dal candidato:

```sh
node artifacts/marenetto-build/scripts/global-seo-audit.mjs before --saved
```

Non eseguire `before` senza `--saved` sul candidato finale: sovrascriverebbe
il baseline con il codice nuovo. Per riacquisire realmente il passato serve
la revisione originale, in una copia di lavoro separata, con la stessa
sorgente editoriale di prova. Non basta cambiare l’etichetta del rapporto.

Il generatore del rapporto legge i due inventari, i risultati browser e
`generated-artifacts/global-seo/checks.json` (esiti realmente osservati);
produce il documento HTML autosufficiente, CSV e fingerprint dei file
modificati con hash SHA-256:

```sh
node artifacts/marenetto-build/scripts/global-seo-report.mjs
```

## Risultati misurati

| Pagine interessate | Prima | Dopo |
| --- | ---: | ---: |
| Title fuori 50–60 caratteri Unicode | 577 | 0 |
| Description fuori 140–160 caratteri Unicode | 534 | 0 |
| Title / description duplicati | 0 / 0 | 0 / 0 |
| Immagini di contenuto senza alt adeguato | 71 | 0 |
| Salti nella gerarchia delle intestazioni | 47 | 0 |
| H1 mancanti o multipli | 0 | 0 |
| Problemi nei controlli JSON-LD | 159 | 0 |
| Link interni o frammenti non validi | 699 | 0 |
| Hreflang non reciproci | 0 | 0 |

I 159 problemi erano Article mancanti, non errori di parsing JSON.
Le sette pagine storiche segnalate esternamente non sono state identificate
arbitrariamente. Con le soglie originariamente segnalate, il baseline misura
314 title oltre 65, 34 description sotto 70 e 65 oltre 165: non coincide
con la segnalazione del proprietario (86, 48, 34) e non pretende di essere
un export Search Console.

I collegamenti del baseline fuori dal main non erano tutti stati acquisiti:
i controlli aggiunti sui medesimi snapshot distinguono link verificabili
nelle risposte già archiviate e link non misurati. La colonna dedicata non
è un errore del sito e non è dichiarata zero retroattivamente.

## Criteri e limiti

- Title e description: punti di codice Unicode normalizzati NFC; frasi
  complete selezionate senza tagli meccanici. Gli intervalli non garantiscono
  una specifica resa nei risultati Google.
- Parole: `Intl.Segmenter` nella lingua della pagina, solo main; esclusi
  nav/footer e blocchi comuni ad almeno il 35% delle pagine della lingua
  (minimo otto). Conservati anche conteggio grezzo e blocchi esclusi.
- Articoli: obiettivo orientativo 900–1500. Servizi: 600–900. Il rapporto
  dettaglia le eccezioni per URL; non sono stati gonfiati testi o duplicati
  contenuti per città. Indici, contatti, informative e pagine di supporto non
  hanno quote. Le descrizioni sintetiche delle offerte non sono nuovi
  approfondimenti di servizio.
- Fonti interne: testi storici e relative revisioni già integrate,
  traduzioni già presenti, contenuti servizi/trasferte e gestione immobili.
  Sono fonti editoriali interne, non verifiche tecniche indipendenti.
- Gli originali storici e la provenienza sono immutati. La rappresentazione
  pubblica cambia soltanto attributi alt e livelli H2/H3, senza cambiare
  le parole. I fratelli mantengono lo stesso livello.
- JSON-LD: controlli locali di sintassi, escaping, tipi usati, URL, riferimenti
  e corrispondenza visibile di Article/FAQ. Non certificano tutto Schema.org
  o l’idoneità a un rich result. Nessuna Review/AggregateRating generata.
- I testi legali e la versione dei consensi non sono stati riscritti.
  I test verificano la provenienza autorizzata e lo scanner resta invariato.

## CSP e verifica esterna residua

Le policy integrate erano già coerenti con il trasporto GA4 diretto,
il pixel immagine Meta e Clerk: nessuna nuova origine ampia o script inline
eseguibile è stata introdotta. Il default rimane report-only.
L’enforcement è stato provato solo nelle risposte intercettate del candidato.

Dopo il Republish, a cura del titolare, restano da controllare le risposte
pubbliche della medesima revisione, gli strumenti Google/Meta, gli eventuali
sette URL segnalati, le sessioni Clerk reali e l’eventuale successiva decisione
di enforcement CSP. I test locali non sono una certificazione di invio eventi,
non cancellano avvisi di Search Console e non attestano conformità giuridica.

**PRONTO PER REPUBLISH — nessuna pubblicazione eseguita.**
