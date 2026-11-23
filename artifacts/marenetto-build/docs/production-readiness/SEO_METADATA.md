# Correzione dei metadati SEO multilingue

## Ambito

Solo metadati: nessuna modifica a logo, impaginazione o corpi degli articoli.
Nessuna pubblicazione effettuata e nessun cambiamento a consensi, secret,
stati di revisione, autorizzazioni linguistiche o regole di indicizzazione.

## Causa

Il recupero delle edizioni storiche sostituiva i metadati delle pagine principali
con etichette di navigazione come `Home | marenettobuild.com` e
`Startseite | marenettobuild.com`. La precedente normalizzazione della
pubblicazione correggeva alcuni archivi, ma non le home. L'indice Ricerca
manteneva inoltre metadati italiani nelle interfacce straniere.

## Correzioni

- Home con title e description specifici nelle 12 lingue pubbliche.
- Metadati localizzati delle altre pagine principali conservati separatamente
  dalle etichette storiche.
- Indici Guide e Ricerca con metadati locali nelle 12 lingue.
- Nome del brand `Marenetto Build`, non il dominio, anche nei title degli
  articoli e delle altre pagine storiche.
- Risoluzione condivisa da prerendering, risposte editoriali dinamiche e
  navigazione browser: title, description, Open Graph e Twitter sono già
  presenti nella risposta HTML iniziale.
- I metadati SEO specifici impostati in una revisione attiva restano
  prioritari, con normalizzazione del brand. Un titolo home ancora generico
  non prevale sulla descrizione locale del servizio.

Esempi:

- EN: `Renovation & Construction Company in Cefalù, Sicily | Marenetto Build`
- DE: `Bauunternehmen & Hausrenovierung in Cefalù, Sizilien | Marenetto Build`
- NL: `Aannemer voor renovatie en nieuwbouw in Cefalù, Sicilië | Marenetto Build`

## Prove sul candidato, non sulla produzione pubblicata

- Build di produzione completata, compreso il controllo di pulizia.
- `pnpm run typecheck`: superato.
- `test:seo`: **34/34** superati.
- `test:i18n`: **9/9** superati.
- Richieste HTTP senza eseguire JavaScript al vero server di produzione locale,
  con archivio editoriale sintetico vuoto: **363 URL** delle 12 lingue,
  **362 risposte 200** e il redirect **308** già previsto da `/en/articoli/`
  a `/en/articles/`.
- Per ogni risposta 200: un title, brand corretto, description non vuota,
  title/description Open Graph e Twitter coerenti con quelli della pagina.
- **262 URL indicizzabili** nello snapshot: zero title o description duplicati.
  Le altre pagine non sono state approvate o inserite in sitemap da questa correzione.
- Ulteriore verifica con revisione editoriale attiva sintetica: articolo,
  home inglese e tedesca e servizi inglesi corretti nell'HTML iniziale.
- Ricerca `replit|repl\.co|cartographer` in tutta `dist`: nessuna corrispondenza,
  senza escludere Clerk.
- Anteprima tedesca mobile controllata: nessun errore JavaScript rilevato.

Il dettaglio dell'audit locale è generato in
`generated-artifacts/seo-audit/metadata-http.json`; non contiene prove di una
nuova pubblicazione. Dopo il Republish verificare dall'esterno l'HTML grezzo
di home, servizi, articolo, Guide e Ricerca in più lingue.

**PRONTO PER REPUBLISH**
