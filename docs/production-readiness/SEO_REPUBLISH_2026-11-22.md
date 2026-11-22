# Indicizzazione WWW — candidato verificato il 22 novembre 2026

## Stato

**PRONTO PER REPUBLISH. Nessuna pubblicazione eseguita dall'agente.**

Il titolare ha richiesto l'indicizzazione esclusiva della pubblicazione HTTPS su
`https://www.marenettobuild.com`. Le prove seguenti distinguono il candidato
dalla versione già pubblicata.

## Causa e configurazione

- Mancava la Configuration di produzione `MARENETTO_PUBLIC_INDEXING=true`.
  È stata impostata come variabile non segreta, esclusivamente in produzione.
- Confermata la Configuration `VITE_PUBLIC_SITE_URL=https://www.marenettobuild.com`.
  I metadati client non usano più `https://preview.invalid` come ripiego.
- Rimossi i conflitti fra gli effetti client che potevano ripristinare noindex,
  canonical o hreflang dopo il caricamento e la navigazione.
- Secret e flag relativi a privacy, fornitori, modalità reale e invio email
  non sono stati modificati.

La guardia richiede processo di produzione, Configuration esplicita, HTTPS e
hostname WWW esatto. Anteprime `.replit.dev` / `.replit.app`, API, area interna,
demo, errori, revisioni e copie linguistiche non tradotte rimangono noindex.

## Indicizzazione del candidato

- **270 URL**, tutti HTTP 200, canonical e `og:url` assoluti e corrispondenti.
- Nessun noindex o `X-Robots-Tag` sui documenti indicizzabili.
- `robots.txt` consente la scansione pubblica e dichiara
  `Sitemap: https://www.marenettobuild.com/sitemap.xml`.
- Anche robots, sitemap e immagini pubbliche WWW non hanno il vecchio header
  noindex applicativo. Le API conservano la loro esclusione.
- Sitemap XML, hreflang reciproci e `x-default` italiano usano lo stesso insieme
  di edizioni. Le home delle 12 lingue autorizzate sono presenti.
- **80 URL** con navigazione straniera ma contenuto italiano restano accessibili
  e noindex, fuori da sitemap e hreflang. Non sono nuove traduzioni approvate.
- Titoli e descrizioni dei 270 documenti risultano non vuoti e senza duplicati.
  Le descrizioni mancanti utilizzano testo già presente nella pagina; i titoli
  generici degli archivi sono localizzati senza inventare affermazioni tecniche.

## Altre correzioni e prove

- Corretto il collegamento portoghese `/contatos` verso `/pt/contatti/`.
- Eliminati 81 elementi `<img>` vuoti e privi di sorgente, non fotografie.
  Le immagini recuperate, i loro alt e le didascalie restano conservati.
- Verificati **312 collegamenti interni** e **27 immagini**: nessun errore HTTP,
  nessun img privo di attributo alt. Gli alt vuoti delle miniature decorative
  associate allo stesso titolo non sono immagini prive di alt.
- Schema `GeneralContractor`, sottotipo LocalBusiness, con nome, indirizzo a
  Cefalù, telefono, immagine e area servita dai dati già esposti dal sito.
  JSON-LD verificato su tutti i 270 documenti. Non sono state inventate
  valutazioni, certificazioni, coordinate o ulteriori aree operative.
  Questo controllo tecnico non certifica la ragione sociale o l'indirizzo
  presso fonti anagrafiche: restano i dati storici visibili.
- Due PNG storici da **4.707.064 byte complessivi** sono sostituiti nel rendering
  da WebP di **579.898 byte**, circa **−88%**, con lato massimo 1600 px.
  Gli originali rimangono disponibili agli URL precedenti. Nessun cambiamento
  al logo corrente, alle immagini hero o alla composizione delle fotografie.
  La maggiore immagine referenziata verificata pesa ora 567.431 byte.
- Browser: **16 pagine**, comprese le home nelle 12 lingue, servizi, archivio,
  articolo e richiesta; zero eccezioni JS e zero errori console.
  Verificato anche il passaggio da una copia linguistica noindex alla home
  indicizzabile tramite navigazione client.
- Moduli nelle **12 lingue**: errore simulato, dati conservati, successivo successo
  e riuso della chiave di idempotenza. Tutti gli invii sono stati intercettati
  nel browser: **nessuna richiesta reale salvata, nessuna email inviata**.
  Queste prove non certificano la ricezione SMTP reale.

## Redirect: produzione osservata e candidato

Prima del republish:

```text
https://marenettobuild.com/       308 → https://www.marenettobuild.com/
https://www.marenettobuild.com/   200, ancora noindex
http://marenettobuild.com/        301 → https://marenettobuild.com:443/
http://www.marenettobuild.com/    301 → https://www.marenettobuild.com:443/
```

Il canonical e `og:url` della home pubblicata erano già WWW: il problema
`preview.invalid` rimaneva nel ripiego dei componenti client, non nella home SSR.

Il candidato emette **301** per il cambio host apice → WWW e per il protocollo
inoltrato HTTP; mantiene 308 per la sola normalizzazione degli alias storici.
Percorso e query sono conservati secondo le regole dei redirect.

Il primo salto HTTP → HTTPS è emesso dall'edge, non dal codice. L'ingresso
HTTP sull'apice mantiene quindi due salti complessivi prima di WWW. Non è stato
configurato un inoltro esterno né dichiarata una catena a salto unico.

## Verifiche eseguite

- Build e `pnpm run typecheck`: superati.
- `test:seo`: **19 passati**.
- `test:i18n`: **9 passati**.
- `audit:release`: 270 URL, 312 link, 27 immagini, **zero errori**.
- Primo controllo browser: 16 pagine e 12 moduli simulati, **zero errori**.
- Controllo finale dei metadati browser dopo le ultime correzioni: 16 pagine,
  **zero errori**. I moduli non modificati non sono stati reinviati.

Risultati dettagliati locali, esclusi da Git: `generated-artifacts/seo-audit/`
(`release-readiness.json`, `release-browser.json`, `release-browser-metadata.json`).
L'audit HTTP usa il vero server candidato con un catalogo editoriale isolato;
non certifica la futura disponibilità del database di produzione.

Nei log del servizio immagini sono comparsi avvisi Node `MaxListenersExceededWarning`
durante le letture ripetute. Le richieste verificate risultano comunque 200,
senza errori browser: l'avviso non è una prova di perdita di memoria, ma richiede
un'indagine separata sullo streaming. La build termina con successo pur mantenendo
gli avvisi già presenti su import JSON e sourcemap di tooltip; non sono stati
presentati come errori console delle pagine pubbliche.

## Dopo il Republish del titolare

Controllare dall'esterno HTTPS WWW, il 301 dell'apice, robots, sitemap e almeno
una pagina per lingua, prima e dopo esecuzione JavaScript. Verificare che
anteprima e area interna conservino noindex. L'abilitazione tecnica alla
scansione non garantisce i tempi o la scelta di indicizzazione di Google.
