# Prove aggiornate — 26 novembre 2026

Questa sezione sostituisce lo stato precedente conservato più sotto.

- Typecheck completo e build di produzione superati dopo l’allineamento
  alle quattro aree del menu; controllo asset superato.
- `test:editorial`: 11 controlli superati, inclusi importazione e attivazione
  autorizzata delle 120 edizioni, impronta della consegna, idempotenza,
  vecchie revisioni preservate, autorizzazioni e riscontri privati non
  esposti. Nessun parere professionale o account Search Console inventato.
- `test:series`: 10 controlli superati, inclusi SSR delle 120 edizioni, FAQ, fonti, avvertenza finale,
  segnaposto, schemi reali e assenza di richieste video nell’HTML iniziale.
  Archivio Guide e navigazione fra puntate collegano tutte le dieci
  destinazioni attive; le card della serie hanno etichette IA e pulsanti
  nelle lingue delle rispettive edizioni.
- Le URL pubbliche della serie conservano la grafia approvata, incluse le
  barre finali delle famiglie storiche; la normalizzazione delle chiavi del
  database non modifica i canonical. Eventuali modifiche deliberate alle
  URL nel CMS non sono sovrascritte.
- Un archivio con puntate attive mantiene titoli e collegamenti delle altre
  edizioni storiche nella loro lingua, non torna alle sintesi italiane.
  Controllati SSR e anteprima inglese senza errori del browser.
- Controllo HTTP con snapshot esplicito delle 120 attivazioni: i titoli
  delle aree conservano esattamente i metadati approvati e la loro politica
  di indicizzazione. Le nuove puntate rimangono invece escluse senza
  attestazione Search Console.
- I test dell'archivio storico usano uno snapshot editoriale vuoto esplicito
  sia nel server SSR sia nel browser: non dipendono dalle revisioni presenti
  nel database condiviso. Non sono stati rimossi controlli storici.
  L'attivazione e i ritiri sono coperti separatamente da snapshot reali del
  flusso CMS e dai test HTTP della serie.
- `test:seo`: 39 controlli superati; `test:four-areas`: 7 superati.
- `test:i18n`: 9 controlli superati.
- Percorso browser mirato `playwright.series.config.ts`: **1 superato**,
  2,5 secondi di test. Rifiuto e reload senza traffico; consenso solo media
  esterni senza statistiche/marketing; persistenza del consenso al reload;
  riapertura dal footer da tastiera; revoca, rimozione del player e
  cessazione degli heartbeat; trascrizione ancora leggibile; consensi
  legacy, scadenza, evento storage e segnaposto senza domanda di consenso.
- La diagnostica del precedente click fallito non rilevava alcun evento
  click/preferenze nel documento principale e indicava il frame attivo:
  coordinate consegnate al player nella fixture senza CSS. Il test finale
  usa il vero link nativo con focus e Invio, non un evento artificiale né
  una chiamata diretta ai componenti. Le asserzioni di privacy restano.
- Tutte le richieste del player sintetico sono intercettate nel test:
  nessuna chiamata reale YouTube/analytics, nessun ID fittizio nel CMS.

La verifica normativa resta documentale e datata: non certifica il diritto
vigente nel 2026. Search Console non attestata, nessun materiale video
ricevuto e nessuna pubblicazione di produzione eseguita. Il nuovo consenso
media non concede statistiche o marketing e il segnaposto non lo richiede.
L’accesso manuale autenticato al CMS non è stato verificato: sono stati
controllati il contratto, i campi e i percorsi API.

Dopo il riavvio dei servizi: 120 guide nella risposta pubblica, 12 lingue,
zero video, nessun riscontro privato di revisione esposto e nessuna verifica
Search Console dichiarata. Le risposte SSR campione IT/EN/DE/NL/FR sono
HTTP 200 con avvertenza, fonti, etichetta IA e nessun player; la copertina
illustrativa risponde HTTP 200 `image/webp`. Il titolo corretto è nei metadati:
non confondere stringhe HTML letterali negli script diagnostici Vite con
elementi HTML effettivi del documento. Anteprima della puntata 1 controllata
visivamente, senza errori browser.

## Riproduzione

1. `pnpm --filter @workspace/api-server run test:editorial`
2. `pnpm run typecheck`
3. `PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build`
4. `pnpm --filter @workspace/marenetto-build run test:series`
5. `pnpm --filter @workspace/marenetto-build run test:seo`
6. `pnpm --filter @workspace/marenetto-build run test:four-areas`
7. `pnpm --filter @workspace/marenetto-build exec playwright test --config=playwright.series.config.ts`
8. `node scripts/series-keyword-report.mjs && node scripts/series-drafts.mjs`

Non usare test o presenza del file Google per dichiarare una verifica
professionale, un dato di ranking o una verifica di proprietà dell’account.

---

# Registro storico del 25 novembre — risultati precedenti, SUPERATI

## Controlli eseguiti

- `pnpm run typecheck`: superato su librerie, API, sito, sandbox e script.
- Build web con `PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build`:
  superata, incluso controllo degli asset di produzione.
- `test:series`: sei controlli superati, inclusi rendering SSR delle 120
  edizioni, FAQ visibili, avvertenza finale, fonti senza JavaScript, lingue,
  placeholder, assenza di VideoObject fittizi, URL storici e consensi legacy.
- `test:editorial`: sei controlli superati, inclusi importazione delle 120
  bozze, idempotenza, validazione dello schema di tutti i record, nessuna guida
  nella risposta pubblica, ruoli, conflitti, revisione esatta, fonti/revisori
  mancanti, verifica Search Console e azzeramento dei riscontri dopo modifiche.
- Test i18n, Fase 3–4 e consenso trasporti: superati (15 controlli non-browser).
- `test:seo`: 39 controlli superati, inclusi HTML iniziale, schema, metadati,
  sitemap/hreflang, ritiri, host autorizzato, file Google permanente.
- Anteprima `/articoli`: caricata e controllata visivamente, nessun errore
  browser segnalato. Le guide private non vi sono state attivate.

I test di API usano dati sintetici con pulizia dei soli record sintetici;
non approvano o attivano le guide della serie. Non vengono inviati moduli,
email o notifiche IndexNow. Non è stato eseguito un accesso manuale al CMS:
i suoi campi sono verificati staticamente e tramite l’API, non con un
percorso browser autenticato.

## Browser — percorso mirato media esterni

Fixture isolata con i veri componenti del sito e richieste completamente
intercettate. ID, copertina, trascrizione e player sintetici esistono soltanto
nei test e non vengono importati nel CMS.

Il primo tentativo si è fermato perché il dominio sintetico non era nella
allowlist pubblica. La configurazione di test è stata corretta usando un host
autorizzato, sempre con intercettazione totale del traffico.

Il passaggio successivo ha confermato:

- prima del consenso: nessun iframe o richiesta terza; trascrizione leggibile;
- dopo rifiuto e ricaricamento: solo stato locale, nessuna richiesta;
- consenso soltanto ai media esterni: un player e nessuna concessione di
  statistiche o marketing; scelta conservata al ricaricamento.

Il percorso completo si è fermato alla riapertura dal footer dopo un
ricaricamento: il pannello non è stato trovato. Questo esito non è stato
spacciato per un controllo superato né attribuito senza prova al componente.

Una verifica supplementare limitata a quel punto, iniziando con consenso
media già salvato, ha confermato riapertura dal footer, checkbox selezionata,
revoca, rimozione dell’iframe e cessazione delle richieste heartbeat.
Il contatore si è stabilizzato a 15 e non è aumentato nei successivi 500 ms.
Nessun errore di pagina; avviso non bloccante su allow/allowfullscreen.
Il problema precedente non si è riprodotto nello stato isolato: la causa
della differenza non è stata identificata. Il rapporto diagnostico è in
`generated-artifacts/costruire-cefalu-madonie/browser-diagnostic.json`.

Non sono quindi dichiarati superati l’intero percorso browser, la
persistenza della revoca al reload, scadenza, consensi legacy e segnaposto
nel browser. Gli ultimi tre restano coperti dai controlli non-browser
indicati sopra, ma questo non sostituisce la prova dell’intero percorso.
La specifica originale è conservata per la successiva riproduzione mirata.
Non è stata modificata la produzione per nascondere un errore non riprodotto.

## Limiti non sostituiti dai test

- La suite generale `marenetto-route-regressions` risultava fallita per un
  timeout di idratazione di un articolo storico inglese (196 casi passati,
  uno fallito, sette saltati). Non è stata rilanciata né dichiarata verde
  nell’ambito di questo passaggio mirato.
- Un test automatico non certifica vigenza del diritto, competenza del
  revisore o qualità professionale delle traduzioni.
- Non sono stati verificati account Search Console, diritti video reali,
  miniature reali o trascrizioni aziendali, perché non ricevuti.
- Nessuna pubblicazione di produzione o autorizzazione al Republish.

## Comandi riproducibili

Prima creare il catalogo con
`node artifacts/marenetto-build/scripts/export-editorial.mjs`.
Poi `node scripts/series-keyword-report.mjs` e
`node scripts/series-drafts.mjs` rigenerano la consegna privata.
Per i controlli SSR creare prima la build web; usare quindi `test:series`.
Il test browser dedicato è `playwright.series.config.ts`: non si deve
indebolire l’allowlist di produzione per eseguirlo.
