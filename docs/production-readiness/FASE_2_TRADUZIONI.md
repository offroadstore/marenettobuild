# Fase 2 — traduzioni complete e prove del candidato

**Candidato per il republish, con testi nuovi ancora da approvare.**
Il blocco WhatsApp è stato corretto su autorizzazione del titolare e verificato
con controlli geometrici e browser mirati; la chiusura resta subordinata alla
validazione completa configurata. Nessuna pubblicazione eseguita.
Nessuna certificazione linguistica umana viene dichiarata.

## Inventario riconciliato

L'inventario di partenza è conservato con percorsi e impronte dei documenti:
270 URL ritenute native e 80 URL classificate italiane sotto interfaccia straniera.
Le 80 URL pianificate comprendono 24 pagine principali, 14 archivi e 42 articoli.

| Lingue | URL pianificate per lingua | Totale |
| --- | ---: | ---: |
| en, fr, de, nl, es, pt, ru, pl | 4 | 32 |
| sv, no, da | 16 | 48 |
| Totale | | **80** |

Le 24 pagine storiche riguardano chi siamo, contatti e ristrutturazioni chiavi
in mano. Sono tradotte integralmente da sorgenti italiane con le correzioni
editoriali già autorizzate: paragrafi, titoli numerati, FAQ, inviti all'azione e
metadati. I 14 archivi e i 42 articoli nordici avevano già testi localizzati,
ma erano ancora dichiarati italiani nell'inventario: non sono stati spacciati
per nuove traduzioni. Sono stati confrontati e corretti, mantenendo le
composizioni informative effettivamente servite, non sostituendole con articoli
storici promozionali diversi.

Per ogni destinazione sono registrati sorgente, revisione della sorgente,
revisione del testo tradotto, lingua, percorso, titolo e descrizione.

## Risultato aggiuntivo dell'audit dei 270 URL

L'assunzione che tutti i 270 documenti fossero integralmente nativi non reggeva:
8 articoli conservavano passaggi italiani, talvolta dentro markup storico
escapato. Sono stati corretti con sostituzioni puntuali, non ripulendo o
riassumendo il resto:

- EN: articolo Microverlay.
- NL: impresa edile; pavimenti Isoplam.
- ES: impresa edile; Microverlay.
- PT: pavimenti Isoplam; Microverlay; opere in pietra e prospetti.

I percorsi esatti e ogni sostituzione prima/dopo sono in
`src/localization/phase2/supplemental.json` e
`src/localization/phase2/supplemental-comparison.json`.

**Totale unico: 350, non 358.**

- **262** URL precedenti restano idonee all'indicizzazione.
- **80** candidate pianificate sono realmente localizzate, da approvare.
- **8** edizioni prima considerate native hanno correzioni tradotte da approvare.

La temporanea esclusione delle 8 edizioni corrette è intenzionale, non una
sparizione di URL: rimangono HTTP 200, leggibili e con canonical proprio.
Non è stato riutilizzato il vecchio consenso per indicizzare parole nuove.
Un test isolato, con approvazioni **sintetiche non registrate**, conferma che
350 edizioni avrebbero equivalenti reciproci e x-default coerenti.

L'alias storico `/en/articoli/`, la ricerca, gli strumenti di revisione e le
lingue bloccate conservano le esclusioni precedenti. Non sono introdotte nuove
lingue pubbliche o pagine per città.

## Fedeltà e revisione

- Fonti documentali storiche e cataloghi di correzione precedenti non cancellati.
  I testi nuovi sono in cataloghi dedicati e caricati sia da SSR sia dal client.
- Confronto bilingue automatizzato dei testi della biblioteca, con glossario
  edilizio per 11 lingue straniere. Confrontati 230 identificatori per lingua,
  compresi i 14 alt delle copertine; revisione specifica di 154 traduzioni alt.
- Terminologia controllata per infiltrazioni meteoriche, supporto, impianti,
  cappotto, infissi, notai nel contesto italiano e riferimenti normativi.
- Gli articoli nordici conservano tutti i blocchi e i numeri del testo italiano
  rielaborato: corretta anche la separazione di paragrafi che prima risultavano
  accorpati o separati diversamente.
- Titoli ufficiali italiani delle fonti e titolo originale inglese sono
  riconoscibili tramite la lingua corretta; non sono trattati come testo
  straniero non tradotto. URL, marchi, toponimi e riferimenti CILA/SCIA restano
  quelli documentati, non vengono sostituiti da norme di altri paesi.
- Le copertine restano illustrative, non prove di lavori realizzati.
- Il controllo dei residui italiani esclude esplicitamente nomi propri e
  citazioni documentali; non costituisce certificazione umana di qualità.

### Eccezioni editoriali esplicite

Su istruzione del titolare di non suggerire accordi con agenzie o partner,
nelle 24 traduzioni storiche:

- «un partner affidabile» → «un referente affidabile»;
- «un unico partner» → «un unico referente».

Nella correzione portoghese dell'articolo sulle opere in pietra, la descrizione
dell'impresa stessa come «partner ideale» diventa il corrispondente di
«impresa ideale». Non viene introdotta una relazione sostitutiva.
Le formulazioni originali restano nelle fonti; le altre frasi non sono state
riscritte per attenuarle o trasformarle in promesse nuove. Le negazioni che
escludono la dichiarazione di marchi partner negli articoli informativi sono
preservate. Nessun accordo con terzi viene affermato.

## Gestione editoriale e approvazioni

Il punto di revisione è `/__localization-review`, con gli 80 candidati e gli
8 casi supplementari distinti. Il fascicolo HTML consegnato permette di leggere
affiancati sorgente e destinazione, inclusi metadati, alt, fonti e impronte.

Ogni revisione ha `approval: null`. Un'eventuale approvazione deve contenere
evidenza effettiva, data e l'impronta **esatta** della revisione approvata.
Non basta una vecchia approvazione del catalogo o il fatto che la lingua sia
pubblica. L'importazione rifiuta di sovrascrivere approvazioni già registrate.

Le revisioni attive dell'area editoriale prevalgono sulle copie statiche; un
ritiro non ripubblica il testo precedente. Se la sorgente italiana ha una
revisione attiva o è ritirata, il candidato statico dipendente non viene mostrato
come aggiornato: presenta una richiesta di nuovo confronto, non un ripiego
italiano. Le prove includono questo caso su tutte le 88 destinazioni.

L'abilitazione futura alla sitemap/hreflang usa la stessa impronta in SSR e
client. Anteprima e strumenti interni restano noindex anche dopo approvazione.

## Prove e riproduzione

Comandi del candidato:

```sh
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
pnpm run typecheck
pnpm --filter @workspace/marenetto-build run test:i18n
pnpm --filter @workspace/marenetto-build run test:seo
pnpm --filter @workspace/marenetto-build run test:phase2
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run audit:phase2
pnpm --filter @workspace/marenetto-build run audit:release
```

Le verifiche HTTP usano il vero server candidato con un catalogo editoriale
isolato e vuoto, non una scrittura nel database reale. Non vengono inviati
moduli o email. Le immagini archiviate sono controllate con richieste di sola
lettura nel workspace.

Risultati e fascicolo revisionabile sono generati in
`generated-artifacts/phase2/`; il rapporto generale HTTP resta in
`generated-artifacts/seo-audit/release-readiness.json`.
I documenti sorgente e le revisioni persistenti sono in
`docs/production-readiness/phase2/` e `src/localization/phase2/`.

### Esito del candidato verificato

- Build: superata.
- Typecheck dell'intero workspace: superato.
- `test:i18n`: **9/9**.
- `test:seo`: **22/22**, compresi i controlli del recapito pubblico e della
  verifica Google aggiunti nel progetto principale.
- `test:phase2`: **6/6**, compresa l'attivazione soltanto con la stessa
  impronta approvata e la conservazione del testo esterno alle correzioni.
- Audit delle **88 revisioni**: HTTP 200, lingua, metadati, canonical,
  noindex e assenza di hreflang non approvati; **zero errori**.
- Controllati **152 collegamenti interni** e **18 immagini** presenti nelle
  candidate; tutte le risposte controllate sono HTTP 200.
- Audit generale: **262 URL indicizzabili**, **312 collegamenti interni**,
  **27 immagini**; **zero errori**.
- Confronto dei blocchi e dei numeri dei 42 articoli nordici: superato.
- Protezione da sorgente attiva o ritirata: verificata sulle 88 destinazioni.
- Controllo visivo dell'inglese desktop e dello svedese mobile: pagine leggibili,
  nessuna eccezione JavaScript osservata. Una sequenza di newline doppiamente
  escapata rilevata nel controllo visivo è stata corretta; un'asserzione dedicata
  ne impedisce la ricomparsa nei cataloghi.
- Il catalogo editoriale pubblico del workspace risultava vuoto al momento del
  controllo: nessuna revisione attiva è stata sostituita o ritirata.

Le impronte dei 270 file HTML cambiano con la ricompilazione degli asset:
non è dichiarata un'inesistente identità binaria fra le due build.
La riconciliazione verifica percorsi, stato HTTP, indicizzazione, canonical,
metadati e immagini, distinguendo le 8 esclusioni motivate.

### Limiti e cronologia dei controlli

La revisione linguistica è automatizzata, non madrelingua o professionale.
Non vengono nuovamente certificate le affermazioni tecniche degli originali
storici: le correzioni autorizzate restano applicate e le altre affermazioni
documentali non vengono promosse a nuove garanzie aziendali.

Il workflow storico `marenetto-route-regressions` risultava già fallito nei log.
La prima verifica conclusiva ha riprodotto 20 errori: tutti confrontavano due
copertine WebP già presenti con i vecchi URL PNG. La fixture indipendente è
stata allineata a quei due soli derivati, vincolando anche firma WebP e SHA-256
dei file; il confronto delle fotografie non è stato rimosso né reso generico.
L'esito della nuova esecuzione viene riportato separatamente dalla prima prova.
La seconda esecuzione ha superato quei confronti (153 test superati) e segnalato
8 aspettative ulteriori: il vecchio titolo CMS delle Recensioni e tre scenari
WhatsApp mobile, ciascuno nei due ambienti. Il titolo atteso rispetta ora il
collegamento pubblico alle recensioni Google; gli scenari mobile esercitano
il controllo nella zona fotografica libera anziché pretendere che copra un
titolo o l'header. Il viewport ordinario da 780 pixel ha ora un controllo
dedicato che confronta geometricamente sovrapposizione e visibilità.
Rimangono le verifiche di trascinamento, limiti del viewport,
apertura del collegamento e ripristino dopo navigazione. Nessuna funzione
WhatsApp o Recensioni è stata modificata per far passare i test.
La terza esecuzione ha superato i confronti delle Recensioni e la nuova prova
geometrica, ma rimangono **6 errori WhatsApp mobile**: visibilità iniziale,
trascinamento e chiusura con ripristino, in sviluppo e anteprima di produzione.
Totale effettivo: **157 superati, 7 esclusi, 6 falliti**. Il tentativo di scegliere
un viewport con zona fotografica libera non ha risolto i tre scenari nel browser
di test, pur mostrando il controllo nello screenshot. Non è dichiarato verde
`pnpm --filter @workspace/marenetto-build run test:routes`; la consegna rimane
aperta. Typecheck, permessi/schema interno e revisione del codice sono superati.

### Correzione WhatsApp autorizzata successivamente

Il titolare ha autorizzato «Correggi WhatsApp e completa». Questa decisione
non è un'approvazione delle traduzioni e non modifica il relativo registro.

La causa era funzionale: il controllo mobile si nascondeva alla prima
sovrapposizione, anche se rimaneva spazio libero vicino. Ora viene collocato
nello spazio libero più vicino, sempre dentro il viewport e senza coprire
testi, link, campi o header. Se non esiste uno spazio libero, come con un
dialogo a tutto schermo, continua a nascondersi. L'inizio del trascinamento
usa la posizione visibile per evitare salti; una navigazione azzera lo stato
come prima. Non vengono salvate preferenze o inviati messaggi.

- Ripristinato il viewport telefono originale **390 × 780**, senza adattarlo
  per aggirare la collisione.
- `test:whatsapp-placement`: **7/7** casi geometrici, compresi assenza di spazio,
  slot centrale con entrambi i bordi occupati, header, limiti del viewport e
  ostacoli fuori schermo.
- Verifica browser mirata in italiano: **5/5** scenari superati: visibilità,
  trascinamento senza apertura involontaria e clic successivo, chiusura e
  ripristino dopo navigazione, assenza di sovrapposizione, precedenza del
  dialogo a tutto schermo.
- La verifica completa configurata viene eseguita nuovamente per la chiusura:
  i precedenti fallimenti sopra sono cronologia, non prove della correzione.

Nei log del servizio immagini restano avvisi `MaxListenersExceededWarning`
preesistenti: le risposte immagini verificate sono HTTP 200.

Non sono stati modificati secret, SMTP, flag privacy, servizi premium, area
operativa o procedure di pubblicazione. La futura risposta reale di produzione,
il database editoriale di produzione e l'effettiva indicizzazione Google non
sono certificati dalle prove isolate del candidato.
