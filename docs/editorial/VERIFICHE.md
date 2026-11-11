# Verifiche dell’archivio editoriale

## Controlli superati

- **Typecheck dell’intero workspace**, compresi API, web, client generato e schema.
- **Regressione completa dei percorsi dopo le correzioni finali**: `pnpm --filter @workspace/marenetto-build run test:routes`, 125 test superati e 5 esclusioni previste, nessun errore; include Vite e handler preparato, idratazione di tutte le edizioni esposte e le nuove prove di ritiro nella navigazione client.
- **Permessi interni** già esistenti e test editoriali server.
- **Cinque test editoriali**: HTML/URL non sicuri, approvazioni legate alle impronte esatte, sorgente modificata, lingua effettiva, ritiro del catalogo senza nuova approvazione e integrazione HTTP/PostgreSQL.
- **Importazione idempotente**: 754 edizioni, 29 lingue; il secondo accesso non duplica righe. Ogni dettaglio importato viene validato contro il contratto API, anche le fonti storiche senza titolo.
- **API reali con dati sintetici**: accesso anonimo, viewer/editor/owner, creazione, percorso duplicato, conflitto di versione, salvataggio, revisione, approvazione, attivazione consentita e bloccata, modifica della sorgente, conservazione della revisione attiva, ritiro e ripristino.
- **Schema interno**: controllo delle tabelle preesistenti superato; migrazione editoriale additiva applicata e ripetibile.
- **Build web completa**, compresi fallback immutabile e renderer runtime.
- **Tre controlli HTTP/SEO preesistenti**: tutte le edizioni disponibili via HTTP, redirect/errori, canonical, noindex e correzioni autorizzate senza alterare gli originali.
- **Tre regressioni SSR aggiunte**: revisione selezionata e alias Unicode con un solo H1; archivio modificato che usa la revisione araba e non quella italiana; ritiro di un articolo esistente senza ripiegare sul corpo statico precedente.
- **Due regressioni HTTP di indisponibilità**: articolo esistente ritirato, riavvio del processo web con API irraggiungibile e 503 senza testo storico; stessa protezione dopo una precedente lettura riuscita.
- **Quattro prove browser di navigazione**, due in Vite e due nell’handler preparato: da una console statica senza snapshot, navigazione client a un articolo storico mentre la verifica è pendente e poi indisponibile; con un marcatore di ritiro verificato viene mostrato 404. Nessuna nuova richiesta HTML e nessuna esposizione del corpo storico.
- **Persistenza dopo riavvio dei servizi**: fixture IT/AR attive salvate prima del riavvio, poi rilette dall’API e dal rendering HTML.
- **Runtime in anteprima e handler preparato per il rilascio**: stesso id di revisione, corpo e SEO nell’HTML; alias; archivi italiano/arabo; ricerca; nessun testo di bozza nel payload pubblico; noindex, sitemap e hreflang conservativi.

L’attivazione riuscita è verificata nelle vere route, nel solo processo isolato del test con override temporaneo dei flag. Le fixture del controllo HTML impostano direttamente puntatori sintetici e non certificano un’attivazione dalla console. Nessun flag dei servizi condivisi è stato modificato.

## Singola prova browser desktop e mobile

Con un account owner sintetico e verificato:

- Creazione articolo IT con titolo, URL, sommario, corpo, categoria, tag e SEO; salvataggio e conservazione dopo reload.
- Anteprima riservata e 404 del percorso pubblico mentre l’articolo è una bozza.
- Conferma sulle modifiche non salvate, sia annullamento sia scarto.
- Invio in revisione e approvazione con attore, data e impronte nel registro.
- Tentativo di attivazione con **503 esplicito** per via libera mancanti; approvazione conservata, senza aggirare il blocco.
- Creazione AR con percorso esplicito e lingua effettiva corretta; confronto affiancato su desktop, editor RTL e documento LTR.
- Modifica della sorgente IT e indicazione di obsolescenza in AR.
- Ripristino di una revisione come nuova bozza, mantenendo le precedenti.
- Mobile 390×844: nessun overflow orizzontale dell’intero documento; la matrice ha un proprio contenitore a scorrimento.
- Passaggio da HTML a visual con payload XSS: il probe non è stato eseguito. Il payload è stato rimosso prima di salvare: la prova browser **non** dimostra un salvataggio XSS; la pulizia server è coperta dai test API/unitari.

La prima membership sintetica aveva maiuscole diverse dall’email primaria normalizzata da Clerk. È stata corretta soltanto quella riga sintetica. Le email invitate vanno normalizzate secondo il criterio di accesso già esistente.

Tutte le righe editoriali e le membership create per le prove sono state eliminate; nessun contenuto reale è stato approvato, ritirato o modificato. Nessuna email reale è stata inviata.

## Cosa questi controlli non certificano

- Nessun deployment, test sul database produttivo o apertura ai motori.
- Nessuna autorizzazione privacy, fornitori o rilascio acquisita automaticamente.
- Nessuna certificazione della completezza storica, dei claim tecnici, delle traduzioni, delle licenze o degli aspetti legali.
- La prova browser non sostituisce una revisione professionale delle 29 lingue.
- La prova interattiva dell’intero flusso editoriale è stata una sola. Le regressioni automatiche mirate di sicurezza e la suite generale dei percorsi sono state eseguite successivamente sulle correzioni finali; non sono una revisione professionale dei contenuti.
