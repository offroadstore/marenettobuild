# Font sul dominio del sito — consegna per Republish

**Stato: PRONTO PER REPUBLISH.** Revisione locale verificata; nulla pubblicato.

## Obiettivo e confini

I caratteri sono distribuiti come WOFF2 dallo stesso dominio del sito.
Nessuna nuova famiglia, modifica al logo, al testo, al layout, ai consensi,
ai secret o ai flag di approvazione. Nessuna pubblicazione automatica.
Questa modifica elimina il collegamento del browser a Google Fonts:
**non costituisce una certificazione legale complessiva del sito**.

La verifica riguarda la revisione locale e i suoi file di produzione.
Non è una verifica del sito pubblicato dopo Republish.

## Inventario

| Famiglia | Pesi forniti | Uso conservato |
| --- | --- | --- |
| Barlow | 400, 500, 600, 700 | Sito pubblico latino, navigazione, modulo chiamata, elementi del marchio già tipografici |
| Gilda Display | 400 | Stili serif preesistenti e provenienza nell'editor |
| Manrope | variabile 400–800 | Area interna e accesso |
| Newsreader | variabile 400–500; asse ottico 6–72 | Area proprietario e stili editoriali |
| Noto Sans | variabile 400–800 | Cirillico, greco e fallback multilingue |
| Noto Sans Arabic | variabile 400–800 | Anteprime arabe |
| Noto Sans Hebrew | variabile 400–800 | Anteprime ebraiche |
| Noto Naskh Arabic | variabile 400–700 | Fallback serif arabo già dichiarato |
| Noto Serif Hebrew | variabile 400–700 | Fallback serif ebraico già dichiarato |
| Noto Serif | variabile 400–700 | Fallback serif multilingue già dichiarato |

Gli stack di sistema (Georgia, monospace, emoji e la dichiarazione JetBrains
Mono senza precedente download web) restano invariati: non vengono aggiunti
nuovi font o sostituiti i fallback del dispositivo.

48 file WOFF2, 1.683.268 byte complessivi disponibili, **non tutti scaricati
dal browser**. Conservate le dichiarazioni delle famiglie esistenti, inclusi
i fallback: la disponibilità del file non implica un caricamento preventivo.
Subset latin, latin-ext, cyrillic, cyrillic-ext, greek, greek-ext, arabic, hebrew
secondo la copertura originale delle famiglie. I segmenti math/symbols
distribuiti con alcune famiglie Noto mantengono frecce, simboli e caratteri
combinanti; non sono font aggiuntivi precaricati. Esclusi vietnamita e
devanagari, non necessari alle lingue del progetto.

I file sono copie binarie non modificate distribuite ufficialmente da Google
Fonts; le licenze SIL OFL 1.1 con copyright sono conservate in
`artifacts/marenetto-build/font-licenses/`.
L'inventario JSON nella stessa directory riporta nome, peso, subset, URL di
provenienza, dimensione e SHA-256 di ogni file.
Questi URL sono documentazione di provenienza, non risorse caricate dal sito.
Gli originali documentali storici non sono stati riscritti.

## Caricamento

- Risorse pubbliche in `public/assets/fonts/`, incluse dai normali comandi
  di build e servite a `/assets/fonts/<nome-con-hash>.woff2`.
- Dichiarazioni centralizzate in `src/styles/fonts.css`, importate dallo
  stile principale. Tutte hanno `font-display: swap`, peso e `unicode-range`.
- Vite applica il percorso base dell'artefatto agli URL CSS.
- Un solo preload iniziale `as="font" type="font/woff2"
  crossorigin="anonymous"`: Barlow 400 latin per le pagine latine;
  Noto Sans cyrillic per il cirillico; Noto Sans greek per il greco;
  Noto Sans Arabic arabic per l'arabo; Noto Sans Hebrew hebrew per l'ebraico.
- Accesso e console interna precaricano invece Manrope latin. La dimostrazione
  proprietario eredita Barlow: precarica Barlow 400 e carica Newsreader per i
  titoli su richiesta. Gli altri pesi, subset e serif restano su richiesta.
- La selezione vale anche per l'HTML iniziale pre-renderizzato, per il
  rendering editoriale attivo e per la shell interna servita dal processo Node.
- Risposte WOFF2 con `Content-Type: font/woff2` e cache immutabile annuale
  sui nomi con hash. Non servono nuovi CDN o dipendenze.

## CSP

La policy web passa da:

```text
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
```

a:

```text
style-src 'self' 'unsafe-inline'
font-src 'self'
```

Le altre direttive e la selezione esistente report-only/enforce non cambiano.
La CSP API era già priva dei due host e non è stata modificata.
Le autorizzazioni per storage, autenticazione e gli altri servizi restano intatte.

## Prove ripetibili

```sh
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
pnpm run typecheck
pnpm --filter @workspace/marenetto-build run test:seo
```

Esiti locali: build completata, typecheck dell'intero workspace superato,
39 test SEO/HTTP superati. Avvisi preesistenti della build su import JSON,
chunk dinamici e segnalazione sourcemap non bloccano la compilazione;
nessuna sourcemap viene pubblicata dal web.

La verifica automatica:

- controlla firme WOFF2, licenze, hash, CSS e subset;
- richiede GET e HEAD per tutti i 48 file dal vero handler HTTP di produzione;
- verifica 200, MIME, byte identici e cache, non solo l'esistenza su disco;
- controlla preload iniziali delle dodici homepage pubbliche e delle anteprime
  arabe, ebraiche e greche, oltre alle shell interne;
- verifica il percorso base anche con prefisso `/site/`;
- impedisce riferimenti Google Fonts nei sorgenti attivi e nelle risorse
  effettivamente generate per la produzione;
- prova che il blocco di build respinge import, preconnect e dns-prefetch
  reintrodotti accidentalmente.

Il controllo `test:fonts` è incluso anche in `test:seo`. La build esegue
automaticamente il controllo dei file finali, senza interrogare Google.

## Risultati browser e limiti del collaudo

- Chromium: dodici visite, sei percorsi a 1440×1000 e 390×844:
  home italiana e russa, anteprime arabe ed ebraiche, demo proprietario e
  schermata di accesso interna.
- Font richiesti solo allo stesso dominio: HTTP 200, `font/woff2`;
  nessuna richiesta ai due host Google Fonts, anche nella navigazione
  home → Servizi → home e nell'apertura/chiusura del modulo chiamata.
- Caricati da uno a sei file per schermata, anziché tutti i 48 disponibili.
  Nessun errore di decodifica o caricamento dei font.
- I caratteri realmente usati dal browser sono Barlow, Noto Sans,
  Noto Sans Arabic, Noto Sans Hebrew, Newsreader e Manrope, secondo la pagina.
- La coppia di screenshot italiana desktop prima/dopo è identica anche
  byte per byte. La coppia russa mobile mantiene impaginazione e resa visiva.
  Screenshot e tracce sono conservati in `generated-artifacts/local-fonts/`
  (output di collaudo esclusi da Git e dal rilascio).
- Anteprime RTL: confronto della stessa build prima/dopo a lingua e viewport
  identici, usando l'import Google originale solo nell'intercettazione del
  browser di prova. Per arabo ed ebraico, desktop e mobile: 111 elementi
  misurati per schermata, nessuna differenza di testo, font o geometria
  (delta massimo 0 px). Tre screenshot coincidono; nell'arabo mobile
  differisce soltanto la comparsa temporizzata del pulsante WhatsApp,
  non i caratteri o l'impaginazione. Nelle prove finali con font locali
  nessuna richiesta Google Fonts.
- Verifica binaria indipendente con `fc-scan`: entrambi i subset Newsreader
  conservano l'intervallo ottico variabile 6–72, non soltanto il nome nel CSS.
- Dopo la prova browser, corretto il solo preload della demo da Manrope a
  Barlow, effettivamente ereditato dalla pagina; confermato nel vero handler
  HTTP e ripetuti con successo build e 39 test SEO/HTTP. Non cambia la resa.

**Limite esplicito:** la console interna dopo autenticazione non è stata
collaudata con un account invitato. Verificate schermata di accesso, font
Manrope e demo proprietario; nessun invito, ruolo o flag è stato modificato
per superare i controlli di accesso. Non si dichiara una verifica dei dati
o delle funzioni autenticate.

Il modulo chiamata è stato soltanto aperto e chiuso: in questo ambiente
mostrava un avviso di servizio richieste non verificabile. Non sono stati
inviati moduli né email, né si certifica qui il recapito delle richieste.
L'avviso non riguarda il caricamento dei font.

## Manutenzione dei file

`node artifacts/marenetto-build/scripts/vendor-fonts.mjs` è un comando di
manutenzione esplicito, **non** una fase di build né una funzione del server.
Richiede rete soltanto al manutentore per acquisire file e licenze ufficiali.
Un eventuale aggiornamento richiede nuovo confronto visivo e controllo
dell'inventario; non va eseguito automaticamente a ogni rilascio.

## Passi del proprietario dopo la consegna

1. Integrare questa revisione e usare il normale Republish quando deciso.
2. Sul sito appena ripubblicato, aprire gli strumenti del browser, disattivare
   la cache e ricaricare una pagina italiana e una russa.
3. Filtrare la rete per `font` e verificare risposte WOFF2 dal dominio del sito.
   Non devono apparire `fonts.googleapis.com` o `fonts.gstatic.com`.
4. Verificare inoltre il modulo chiamata, l'accesso interno e le anteprime
   RTL disponibili, senza inviare richieste o email di prova.
5. Controllare la CSP della risposta HTML: nessuno dei due host deve essere
   presente e la modalità deve essere quella già configurata.

La Fase 6 non fa parte di questa modifica e non viene avviata automaticamente.
