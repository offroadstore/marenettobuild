# Archivio editoriale: esercizio, migrazione e recupero

## Prerequisiti effettivi

- Stesso PostgreSQL già utilizzato dall’applicazione (`DATABASE_URL`), senza sostituire provider.
- Tabelle interne e account Clerk con email primaria verificata e invito attivo.
- Nuova tabella additiva `editorial_editions`: identità/lingua e percorso univoci, versione per concorrenza, revisioni/eventi/fonti originali e puntatore attivo separato.
- API e servizio web avviati attraverso i rispettivi workflow. Il web raggiunge `/api` tramite il proxy comune; il renderer lato server usa lo stesso proxy.
- La compilazione API genera il catalogo dalle fonti di progetto e lo incorpora nel bundle. Non occorre conservare `generated-artifacts/editorial/catalog.json` in Git o nelle immagini distribuite; non è una nuova fonte editoriale.

## Applicazione additiva

1. Installare le dipendenze con `pnpm install --frozen-lockfile`.
2. Eseguire `node lib/db/scripts/migrate-editorial.mjs` nell’ambiente autorizzato. Il comando non elimina né converte tabelle esistenti.
3. Avviare o riavviare l’API; il catalogo viene importato al primo accesso editoriale. L’importazione è transazionale, idempotente e non eredita approvazioni dai cataloghi. Nuove evidenze possono essere solo aggiunte agli originali.
4. Verificare l’accesso all’area interna e le nuove sezioni.

La configurazione post-merge esistente richiama anche la migrazione additiva. Non eseguire migrazioni di produzione da questo ambiente; non viene effettuato alcun deployment da questo lavoro.

Le 754 edizioni del catalogo iniziale corrispondono a 46 identità, comprese 14 identità articolo su 29 lingue (406 edizioni articolo). Le 258 fonti storiche di pagine e articoli sono separate dalle composizioni di progetto. Questi numeri descrivono i file disponibili, non certificano che il vecchio CMS sia stato recuperato integralmente. La lingua effettiva registrata resta distinta dalla lingua nell’URL.

## Consistenza e approvazione

- Ogni salvataggio aggiunge una revisione; non aggiorna in-place il testo attivo.
- Ogni scrittura controlla la versione attesa. Un blocco transazionale comune impedisce che l’approvazione di una traduzione corra contro una modifica della sua sorgente.
- Gli eventi conservano attore autenticato, data, revisione e impronte SHA-256.
- Solo owner può approvare, attivare o ritirare. Editor può scrivere/inviare/ripristinare. Viewer legge.
- Approvare richiede la lingua effettiva corretta, corpo non vuoto e sorgente invariata. Una modifica richiede un nuovo passaggio di revisione.
- L’attivazione rispetta gli stessi tre via libera esistenti: privacy, fornitori e verifiche. Non configurarli per aggirare il blocco. Il codice non li attiva.
- Le anteprime delle nuove revisioni sono solo nella console autenticata e non ricevono URL pubblici.

## Lettura pubblica e rendering

`/api/editorial/active` espone solo revisioni esplicitamente attive e marcatori di ritiro senza testo riservato. Mai bozze, originali o registri.

Il web usa la stessa risposta per il rendering HTML iniziale, l’idratazione e la navigazione client. Il payload iniziale è serializzato con escaping di `<`. Le letture HTML non sono memorizzate in cache; il client aggiorna anche al focus e ogni 30 secondi. Dopo un riavvio le revisioni sono rilette dal database. Se la lettura dello stato editoriale fallisce, il web risponde **503 senza servire il vecchio corpo statico**, anche al primo avvio e dopo una lettura riuscita. Un catalogo immutabile non basta a sapere se un articolo è stato ritirato. Il fallback storico viene usato solo dopo avere verificato lo stato attuale.

Anche il browser distingue **caricamento, stato verificato e indisponibilità**. Le console statiche non sono considerate prova di pubblicazione: navigare da esse a un articolo non mostra il corpo prima della verifica. Un aggiornamento fallito nasconde i contenuti pubblici e mostra un avviso, senza scambiare l’errore per una lista vuota. Solo HTML precedentemente verificato fornisce lo snapshot iniziale all’idratazione. I documenti già letti o copiati fuori dall’app non possono naturalmente essere revocati.

I percorsi storici restano invariati. Gli alias delle composizioni di pagina già esistenti usano la stessa revisione attiva. Articoli nuovi entrano negli archivi e nella ricerca; i titoli e i link del menu derivano dalle medesime edizioni attive. Un ritiro restituisce 404 e non riattiva la vecchia copia statica.

Il renderer Node preparato per la distribuzione include anche il bundle SSR: `pnpm --filter @workspace/marenetto-build run build` produce HTML immutabile di fallback e runtime SSR. Non serve compilare manualmente dopo ogni modifica editoriale.

**Noindex, robots disallow, blocchi di rilascio e criteri della sitemap non vengono aperti.** Le revisioni runtime non vengono promosse automaticamente a equivalenti hreflang né a voci sitemap: l’autorizzazione editoriale non equivale a un’approvazione di indicizzazione. Nessuna bozza può entrare in questi elenchi.

## Backup e ripristino

Prima di una manutenzione del database, un operatore autorizzato può usare gli strumenti PostgreSQL standard per esportare l’intero database o la sola tabella editoriale. Conservare i dump in uno spazio protetto, mai in Git, nei file pubblici o nei log. Non stampare la connessione.

Per un errore di contenuto usare prima **Ripristina come bozza**: non richiede operazioni sul database e conserva cronologia e versione attiva. Per un guasto del database, ripristinare un backup in un database separato, verificare integrità, originali, revisioni e puntatori attivi, quindi pianificare il recupero con l’operatore. Non sovrascrivere il database corrente come tentativo automatico.

La migrazione non contiene un rollback distruttivo. Disabilitare temporaneamente le superfici editoriali o tornare al codice precedente lascia la tabella e le prove intatte. Eliminare la tabella perderebbe revisioni, approvazioni e cronologia e richiede una decisione esplicita e un backup verificato.

## Controlli ripetibili

- `pnpm run typecheck`
- `pnpm --filter @workspace/api-server run test:permissions`
- `pnpm --filter @workspace/api-server run test:editorial`
- `pnpm --filter @workspace/db run check:internal-schema`
- `pnpm --filter @workspace/marenetto-build run test:seo` dopo la build web.

Per ripetere il controllo runtime su sole fixture sintetiche in sviluppo:

1. `node lib/db/scripts/verify-editorial-runtime.mjs seed`
2. Facoltativamente riavviare API e web per verificare la persistenza.
3. `node lib/db/scripts/verify-editorial-runtime.mjs check`
4. **Sempre**, anche dopo errori: `node lib/db/scripts/verify-editorial-runtime.mjs cleanup`

Il controllo può ricevere come terzo argomento l’origine di un handler web di test, continuando a usare il proxy API comune. Non eseguirlo su dati produttivi.

Il test editoriale integra le vere route con PostgreSQL e un’identità sintetica soltanto nel bundle di test. I tre flag operativi vengono temporaneamente impostati **solo nel processo isolato del test**, mai nei workflow o nell’ambiente condiviso. Le righe sintetiche sono rimosse; non vengono inviate email. Questo non vale come autorizzazione al rilascio.
