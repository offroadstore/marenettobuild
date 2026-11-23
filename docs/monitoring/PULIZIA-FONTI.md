# Pulizia Monitoraggio/Fonti — consegna

## GA4 e controlli Google

Il percorso pubblico diretto e il consenso non sono modificati:
`lib/legal-policy/direct-analytics.json` resta la fonte dell’ID pubblico.
Il default salvato segue quella configurazione. A ogni inizializzazione
il codice corregge **solo** il vecchio `G-YP31TW342Z`, nell’ambiente corrente,
se la proprietà è assente o è `properties/565537156`. La modifica è
idempotente e conserva credenziali, proprietà, stato del consenso e budget.
ID personalizzati o proprietà diverse non vengono sovrascritti.
Questo è un aggiornamento automatico alla lettura **dopo il republish**:
non è una prova di modifica o ricezione eventi sul database di produzione.

“Verifica ID nella proprietà GA4” usa Admin API e paginazione per cercare
lo stream web, senza prerequisiti del runtime isolato. Lo stato distingue
non verificato, corrispondente, discordante, errore e obsoleto (24ore);
la revisione impedisce di applicare il risultato a una configurazione
cambiata durante la chiamata. Non modifica Google o la raccolta diretta.
Il solo riscontro dello stream non certifica ricezione di eventi.

Il riquadro del runtime alternativo è mantenuto integralmente, spostato in
fondo e chiuso in “Avanzate (non in uso)”. La verifica HTML storica è
esplicitamente obsoleta, non una diagnosi attuale di Framework360.
“Riesegui sul sito pubblicato” è riservato al titolare: fetch del solo
`https://www.marenettobuild.com/`, senza redirect, cookie, esecuzione script,
massimo2MB e timeout8s. Il risultato è persistente, scade dopo24ore;
un errore conserva la rilevazione precedente come obsoleta.
Gli strumenti caricati dopo consenso non si deducono dall’HTML iniziale.

Search Console esplicita che America/Los_Angeles è il fuso fisso Google:
nessuna modifica ai calcoli dei periodi.

## IA

Vedere [prezzi, fonti e limiti](PROVIDER.md) e [avvio calendario](CRUSCOTTO.md).
Budget preesistente conservato; chiavi, flag e calendario non attivati
dalla consegna. Manuale eseguito dal server, coda DB condivisa e ripresa
al riavvio; Gemini bloccato. Il modello, il metodo e i tetti vengono
riverificati prima di ogni chiamata. Nessun retry di chiamate incerte.

Stima illustrativa per10×2: $0,23424; limite prudenziale $14,44992.
**Obiettivo del massimo sotto $1 non dimostrabile dalle API documentate**:
non è dichiarato completato e non si riducono artificialmente le riserve.
Con budget5 il pulsante è disponibile, ma gli esiti possono essere
parzialmente bloccati dal residuo. Nessuna spesa supera il limite applicativo;
eventuali altri utilizzi delle medesime chiavi sono fuori da questo ledger.

## Confini della verifica

Solo fixture sintetiche e fetch intercettati, con schema DB temporaneo.
Nessuna chiamata IA reale, email, modifica Secrets, flag o pubblicazione.
Le verifiche Google dal pannello richiedono accesso autorizzato del titolare
dopo republish. L’interfaccia autenticata è verificata con rendering fixture,
non con una sessione reale del titolare. La configurazione del calendario
è documentata, non attivata.

## Esiti sul candidato

- `node artifacts/api-server/scripts/test-monitoring.mjs`: suite DB/API,
  rendering delle superfici modificate, consenso e runtime isolato.
- `pnpm run typecheck`: riuscito su librerie, API, sito e strumenti.
- Build API: riuscita, incluso comando schedulabile.
- `PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build`:
  riuscita, compreso guard di produzione su1092asset testuali.
- Workflow API e sito avviati; `/internal` mostra correttamente l’accesso
  riservato da una sessione non autenticata. Nessun accesso del titolare
  usato per il collaudo, nessuna campagna live avviata.
