# Integrazione delle pagine legali italiane

Aggiornamento successivo: il titolare ha approvato e fatto implementare
modulo email-only e GA4 diretto. I limiti funzionali del modulo descritti in
questo rapporto storico sono superati dal
[rapporto aggiornato](email-direct-analytics-2026-11-23.md).

## Provenienza e fedeltà

- Repository: `offroadstore/marenettobuild`, ramo `legal-pages`.
- Revisione: `bfb16ed74b0b5adba8d31869328aa34a91b8c2b2`.
- Importato soltanto `artifacts/marenetto-build/src/content/legal.ts`, senza merge del ramo.
- SHA-256: `a9a70c11f52983c86923c2f4f9ae0ea3873359d8ca04b166f3f35ff8eef53715`.
- Confronto con il file remoto: identico byte per byte, senza sostituzioni locali.
- Versione dell'informativa: `2026-11-23`.

## Risultato

`/privacy` e `/cookie` sono edizioni esclusivamente italiane, con il layout
esistente e tutti i blocchi originali resi come titoli H2, paragrafi ed elenchi.
Sono incluse nel prerender e nella sitemap di produzione. H1, introduzioni,
testi e descrizioni legali originali sono mantenuti integralmente.

## Limite della nuova importazione

Il titolare ha richiesto l'importazione immediata del nuovo testo e piani
separati prima di modificare modulo e analytics. Il testo ora descrive un modulo
che invia soltanto email senza salvare richieste. Questa importazione non
implementa quel comportamento: il modulo attuale continua a usare il flusso
database e la ricevuta con codice. Anche l'affermazione sull'assenza di dati dei
clienti nell'area riservata non è certificata da questo aggiornamento.
Il disallineamento è stato comunicato prima della consegna; la prontezza tecnica
delle pagine legali non certifica la corrispondenza dell'informativa ai trattamenti.
Nessuna attivazione analytics, modifica di runtime, cancellazione dati o invio
di email è stata eseguita in questa revisione.

Il footer contiene Privacy e Cookie e analytics accanto al copyright, seguiti
dalla frase originale AI_NOTICE. Le altre informative ed etichette IA rimangono.
Nel modulo il collegamento privacy apre una nuova scheda senza modificare
checkbox o campi e senza inviare la richiesta.

Il pannello analytics collega `/cookie` anche da inattivo. Server e browser
condividono metadati legali verificati rispetto a LEGAL_VERSION; non ci sono
importazioni runtime fra artefatti. Il browser sul dominio canonico rifiuta
metadati legali obsoleti.

Il controllo di produzione originale è ripristinato senza eccezioni legali alla
parola «Replit». Anche la precedente frase hosting viene rifiutata nei formati
HTML, JS e JSON. Restano invariati i blocchi su tracker, domini, strumenti di
sviluppo, font remoti, mappe e percorsi interni.

## Verifiche eseguite

- `pnpm run typecheck`: superato, per tutto il workspace.
- `PORT=19698 BASE_PATH=/ pnpm --filter @workspace/marenetto-build --fail-if-no-match run build`:
  superata, comprensiva di prerender SSR, bundle server e controllo degli asset testuali.
- `test:legal`: 4/4 superati; confronto byte per byte con la revisione importata,
  semantica e testo completo, HTTP produzione/preview,
  sitemap, canonical, assenza di traduzioni, policy browser e test negativi scanner.
- `test:seo`: 39/39 superati.
- `test:i18n`: 9/9 superati.
- `node artifacts/api-server/scripts/test-monitoring.mjs`: 7/7 superati
  fra backend, UI e runtime isolato; provider simulati e database di test isolato.
- Browser `tests/analytics.spec.ts`: 2/2 superati con provider interamente simulato.
- Browser `tests/legal-pages.spec.ts`, progetto `vite-development`: 1/1 superato.
- Verifica browser live tramite proxy con preferenza en-US: entrambe le pagine
  restano italiane dopo hydration, accesso diretto e navigazione. Popup senza
  opener; nome, email e stato della checkbox invariati nei due stati.
- API attiva tramite proxy: `enabled: false`, URL
  `https://www.marenettobuild.com/cookie`, versione `2026-11-23`.
- Nessuna richiesta Google Analytics/runtime nella prova live; nessun modulo inviato.
- Risposte produzione simulate sul server distribuito: HTTP 200, canonical WWW,
  robots `index, follow` e nessun X-Robots-Tag contraddittorio.
- Preview: HTTP 200 sulle pagine legali, robots e header `noindex, nofollow`.
  Percorsi privati e lingue non approvate restano esclusi.

## Limiti e rilascio

Non è stata effettuata una certificazione legale dei testi né un audit esteso
dei trattamenti. Non sono state create traduzioni, modificate credenziali,
approvazioni o impostazioni persistenti di attivazione analytics. L'allowlist
del runtime resta vuota. Nessuna modifica a DNS, logo, hero, motti o pubblicazione.

Nella prova browser è stata osservata una ricarica isolata dell'anteprima,
accompagnata da perdita della connessione HMR. Ripetendo il percorso senza
ricariche, tutti i controlli di conservazione dei campi sono passati. Non è
stata attribuita al collegamento privacy né verificata come problema di produzione.

La nuova importazione integrale ha superato nuovamente typecheck, build,
4 test legali e 39 test SEO, senza eccezioni legali allo scanner. Nei log della
suite generale `test:routes`, già avviata separatamente, risultano 4 errori su
home, hydration e percorsi linguistici; questa correzione puntuale non ne
certifica la risoluzione.

Il Republish resta un'azione del titolare. Queste verifiche non dichiarano già
aggiornato il sito pubblicato e non completano gli altri lavori su privacy e
trasparenza IA.
