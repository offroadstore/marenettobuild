# Migrazione storica — evidenze, non certificazione di completezza

**Leggere prima la chiusura corrente:** `../../../../docs/production-readiness/AUDIT_FINALE.md`, con backup, sicurezza, SEO, requisiti professionali e checklist. Il successivo controllo `Verifica-browser-contenuti.md` ha coperto 437/437 URL; `browser.json` e la relativa sezione di `conteggi.json` rimangono la baseline del passaggio parziale, non il totale finale.

I dieci documenti numerati costituiscono la consegna leggibile e versionabile.
`conteggi.json` è il riepilogo riproducibile; i CSV separano URL, contenuti,
lingue, redirect e dimensioni di confronto. Le risposte originali e i diff
completi sono nel pacchetto datato consegnato separatamente, non nel bundle.

## Riproduzione da workspace root

Gli archivi di ottobre non vengono modificati. Per una nuova acquisizione
scegliere **una nuova cartella datata**, mai sovrascrivere quella precedente.

```sh
PORT=19698 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
HISTORICAL_AUDIT_DIR=/home/runner/workspace/generated-artifacts/migration-NUOVA-DATA \
  pnpm --filter @workspace/marenetto-build exec node scripts/historical/acquire.mjs
```

Per completare un'acquisizione interrotta usare la stessa directory e `--resume`.
`--resume --retry-transient` riduce la concorrenza a una richiesta, attende
1,5 secondi tra URL e si interrompe al nuovo 429; salva il precedente registro.
Le risposte 429 o 5xx non diventano 404 o assenza di contenuto.

Gli altri script accettano lo stesso `HISTORICAL_AUDIT_DIR` e, se omesso, usano
il pacchetto dell'11 novembre 2026:

```sh
pnpm --filter @workspace/marenetto-build exec node scripts/historical/archive-assets.mjs
pnpm --filter @workspace/marenetto-build exec node scripts/historical/audit-locales.mjs
pnpm --filter @workspace/marenetto-build exec node scripts/historical/refresh-delivery.mjs
pnpm --filter @workspace/marenetto-build exec node scripts/historical/audit-delivery.mjs
pnpm --filter @workspace/marenetto-build exec node scripts/historical/verify-media.mjs
pnpm --filter @workspace/marenetto-build exec node scripts/historical/explore-rate-limited-routes.mjs
pnpm --filter @workspace/marenetto-build exec node scripts/historical/verify-inventory-playwright.mjs
```

`verify-media.mjs` richiede il servizio API in ascolto tramite il proxy reale.
`explore-rate-limited-routes.mjs` non ricontatta il sito storico: prova solo in
Playwright i 102 percorsi risultanti come 429 e scrive una tabella JSON/CSV,
un rapporto sintetico e screenshot selezionati.
`verify-inventory-playwright.mjs` prova tutti i 437 URL inventariati solo
nell'anteprima, confronta il DOM renderizzato con le copie salvate e separa i
testi identici, le modifiche registrate, i confronti falliti e quelli senza una
risposta sorgente HTTP 200.
Il confronto delle pagine usa un handler HTTP temporaneo del build per verificare
anche status e redirect, senza modificare l'anteprima o il dominio pubblico.
`--dimensions-only` ricalcola solo le dimensioni sugli stessi byte già verificati
via HTTP: non dichiara un nuovo controllo di rete.

## Copia delle immagini in App Storage

Questo comando è una **scrittura**, a differenza degli audit: importa soltanto
le immagini già acquisite e verificate in un prefisso dedicato, con nomi SHA-256
immutabili. Non sovrascrive dati preesistenti; verifica anche la lettura di ritorno
prima di aggiornare i due manifest di delivery.

```sh
pnpm --filter @workspace/api-server exec esbuild scripts/import-historical-media.ts \
  --bundle --platform=node --format=esm --packages=external \
  --outfile=node_modules/.cache/import-historical-media.mjs
node artifacts/api-server/node_modules/.cache/import-historical-media.mjs
```

Non inserire nel pacchetto credenziali, cookie o configurazioni dello storage.
Le API pubbliche servono esclusivamente i nomi presenti nel manifest, mai un
percorso storage fornito dal visitatore. Gli originali conservati nei cataloghi
restano invariati; la riscrittura degli URL avviene solo nel delivery.

## Confini della prova

- Un hash identico dimostra uguaglianza dei byte/testi confrontati, non diritti,
  accuratezza tecnica o qualità linguistica.
- Un controllo di chiavi non è approvazione delle nuove composizioni.
- I controlli di regressione basati sul catalogo non sostituiscono la verifica
  browser contro le risposte storiche indipendenti.
- Screenshot limitati non dimostrano copertura di tutte le pagine e viewport.
- Nessuno di questi comandi autorizza deployment, cambio dominio o indicizzazione.
