# Barra consenso cookie — verifica del 23 novembre 2026

## Intervento

- Sostituito il pannello con una barra non modale in basso. Testo italiano:
  «Usiamo cookie di statistica solo con il tuo consenso. Info».
  Solo «Info» collega `/cookie`; informative approvate non modificate.
- Solo Accetta e Rifiuta, identici per stile e dimensione, con altezza minima
  di 44 px. Dopo entrambe le scelte l'intero elemento viene smontato:
  nessun controllo Preferenze/Revoca fisso residuo.
- Il link testuale «Preferenze cookie» nel footer condiviso riapre la stessa
  superficie senza scrivere la preferenza o modificare il runtime.
  Rifiutare da una scelta accettata revoca il consenso.
- Registrazione, chiave, versione e durata di 180 giorni invariate.
  Navigazione, ripristino e refresh della configurazione non rinnovano la data.
  La scadenza viene controllata anche mentre la scheda rimane aperta.
- Le altezze effettive delle barre, compresa la safe area, determinano spazio
  a fine pagina e posizione dei contatti mobili. WhatsApp e il pulsante
  richiamata evitano gli elementi visibili; resta invariata la precedenza
  al contenuto che può nascondere il pulsante richiamata flottante.
  I contatti Chiama/Scrivici e quelli nel footer restano raggiungibili.
- Copia breve e nomi accessibili predisposti nelle 29 lingue del registro.
  Nessun cambiamento allo stato di pubblicazione delle lingue.
- Se le statistiche non sono disponibili, nessuna richiesta automatica;
  il footer apre solo la spiegazione nella stessa superficie, senza accettazione.
  Il link footer può richiuderla; Escape chiude una riapertura, senza focus trap.
- Il footer funziona anche nelle informative italiane, senza aggiungerle
  all'inventario delle pagine misurate.

## Verifiche eseguite

1. `pnpm run typecheck`: superato nell'intero workspace.
2. `pnpm --filter @workspace/marenetto-build exec node --test --test-name-pattern='analytics consent' scripts/production-cleanup.test.mjs`:
   superato, compresi i due gruppi di asserzioni sulla macchina di stato e
   sulla registrazione versionata. Verificati entrambi i valori, limite
   esatto di 180 giorni, timestamp futuro, dati malformati e invalidazione
   per variazioni sostanziali di configurazione/informativa.
3. `pnpm --filter @workspace/marenetto-build run test:analytics`:
   **6/6 superati**. Modalità diretta e alternativa isolata, accetta/rifiuta,
   reload, navigazione, deduplicazione, revoca, indisponibilità configurazione,
   blocco preview, ripristino senza rinnovo, nuova scheda, sincronizzazione
   delle due scelte e scadenza in scheda aperta.
4. Unico collaudo browser finale sul sito reale servito dallo sviluppo:
   origin pubblico simulato esclusivamente con intercettazione del browser;
   configurazione temporanea fornita dalle risposte di test; Google simulato,
   richieste esterne intercettate o abortite. **Nessuna raccolta analytics reale,
   nessuna modifica di secret, approvazioni o configurazione del server.**
   - Zero richieste Google prima della scelta.
   - Avvio solo dopo Accetta; Consent Mode v2 con consensi pubblicitari negati.
   - Barra assente dal DOM dopo la scelta; persistenza al reload e navigazione.
   - Riapertura footer senza modifica di storage o nuovo avvio provider.
   - Rifiuta dopo Accetta: arresto, cancellazione `_ga`, reload previsto dalla
     modalità diretta, preferenza rifiutata e focus restituito al footer.
   - `/internal`, `/sign-in`, `/sign-up`: nessun provider anche con scelta
     accettata; nessun accesso autenticato eseguito.
   - Preview reale: nessuna barra automatica e nessuna accettazione fittizia.
5. Screenshot desktop **1440 px** e mobile **375 px**, prima e dopo la scelta,
   riapertura footer e fine pagina: motto visibile, azioni equivalenti,
   nessuna sovrapposizione con WhatsApp o barra contatti.
   La composizione italiana ordinaria occupa due righe a 375 px:
   frase sopra, Info e azioni affiancate sotto quando necessario.
   Tedesco, olandese e francese senza scroll orizzontale.
   Ingrandimento del testo al 200% emulato tramite dimensione radice:
   riflusso leggibile su più righe, nessun taglio.
6. `/cookie` risponde HTTP 200 nell'anteprima. Il collaudo browser ha verificato
   la destinazione del link Info, non ha ricollaudato il contenuto legale.
   Superato anche il test mirato `--test-name-pattern='supplied legal file'`:
   file legale identico alla revisione registrata e versione invariata.

## Evidenze e limiti

Screenshot e rapporto dettagliato del collaudo sono in
`generated-artifacts/cookie-consent/` (output esclusi da Git e deployment):
`desktop1440-initial.png`, `desktop1440-accepted.png`,
`mobile375-initial.png`, `mobile375-accepted.png`,
`mobile375-footer-accepted.png`, `mobile375-reopened-accepted.png`,
`mobile375-de-initial.png`, `mobile375-nl-initial.png`,
`mobile375-fr-initial.png`, `mobile375-zoom200-fr.png`,
`preview-desktop-footer-explanation.png` e `REPORT.md`.

Arabo ed ebraico sono ancora bloccati: copia, direzione e font sono predisposti,
ma non è stato sbloccato né collaudato un percorso pubblico RTL.
Il controllo al 200% è un'emulazione del testo, non un test dello zoom nativo.
Gli errori WebSocket nel collaudo derivano dal blocco intenzionale di HMR.

Questa è una verifica tecnica, non una certificazione legale.
Nessuna pubblicazione è stata eseguita: il proprietario mantiene il controllo
della ripubblicazione dopo il merge.
