# Passaggio a Claude — prossimo normale Republish

## Istruzioni sostitutive del precedente handoff

La richiesta del titolare del **26/11/2026** autorizza l’attivazione automatica
circoscritta a questo esatto pacchetto durante il prossimo avvio del deploy.
**Non occorrono una sessione owner, una console del browser o una seconda
attivazione manuale.** Il vecchio percorso autenticato non è più un prerequisito.
L’agente non pubblica e non modifica il database di produzione.

Lo stato di consegna e le verifiche effettivamente concluse sono nel
[rapporto finale](FINAL-REPORT.md). Non dedurre lo stato della produzione da
un test del candidato o dalla sola integrazione del codice.

## Cosa esegue l’avvio

Un’unica transazione PostgreSQL, con il lock editoriale già esistente, verifica:

- 182 coppie identità/lingua del pacchetto, 14 famiglie × 13 lingue;
- 120 edizioni della serie, senza estenderla all’arabo;
- sovrapposizione di 12 acquisto in sola lettura: **290 edizioni distinte**;
- digest storici originali, payload completo, sorgenti italiane attive,
  contenuti dopo jsonb, approvazioni e presentazioni separate;
- 96 migrazioni URL descrittive (otto puntate × dodici lingue), senza cambiare
  alcun URL delle puntate 4 e 7 né i tredici indirizzi acquisto;
- ritiri, collisioni, revisioni successive, idempotenza e concorrenza.

Le revisioni acquisto e le altre 108 revisioni della serie non vengono
reimportate per cambiare un URL o un title. I title corretti sono una
presentazione SEO autorizzata separatamente dal manoscritto immutato.
Una composizione successiva realmente approvata conserva i propri testi,
metadati e sorgente italiana, non la vecchia presentazione.

Readiness API e web controllano **questo stesso deployment** dopo la
transazione, mai il vecchio sito pubblico. Un errore non viene trasformato in
un successo; ritiri e indisponibilità non ripristinano copie statiche.

## Checklist del titolare tramite Claude

I dieci import privati inizialmente discordanti sono stati riconciliati con
autorizzazione separata del titolare, «Autorizza i dieci casi esatti».
Le vecchie revisioni sono conservate; non servono una nuova sessione owner
né un'applicazione manuale. Non estendere questa eccezione a casi diversi.

1. Confrontare il rapporto finale e le matrici con la revisione integrata.
   Non rigenerare autorizzazioni per far passare un contenuto diverso.
2. Eseguire soltanto il normale Republish quando il candidato è dichiarato
   **PRONTO PER REPUBLISH** nel rapporto. Non usare `owner-activate-console.js`.
3. Se la readiness non passa, non forzare il rilascio, non eliminare ritiri e
   non cambiare flag generali. Esaminare il conflitto e conservare l’ultima
   versione pubblica valida. La transazione incompleta viene annullata.
4. Dopo il Republish, svolgere il controllo produttivo separato già previsto:
   URL reali WWW/HTTPS, 182 edizioni, 120 puntate, 301 diretti, robots, sitemap,
   canonical, hreflang anche arabi, cache e navigazione.
5. Conservare gli esiti produttivi con data e revisione effettivamente servita.
   Non presentare le prove isolate allegate come controlli già fatti sul vivo.

Nessun invio Search Console/IndexNow, email, API a pagamento o modifica a
Secrets/account/DNS fa parte di questa procedura. Nessun risultato Google,
parere professionale o revisione madrelingua viene dichiarato.
