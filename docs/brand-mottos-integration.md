# Motti Marenetto — consegna e integrazioni

## Testi riutilizzabili

La fonte unica è `artifacts/marenetto-build/src/content/brand-mottos.json`:
tutti e tre i motti nelle tredici lingue IT, EN, DE, FR, ES, NL, PT, PL,
RU, SV, NO, DA, AR. Le quattro formulazioni aziendali fornite e le due
formulazioni IT/EN di ciascuna linea sono conservate esattamente.
Le altre formulazioni sono adattamenti linguistici naturali; non si dichiara
una revisione madrelingua esterna mai eseguita.

## Collocazioni applicate

- Motto aziendale nella presentazione della home corrente (`HomePage`).
- Motto aziendale nella presentazione della home storica (`HistoricalContents`).
  Si tratta di due renderer alternativi, non di due inserimenti nella stessa home.
- Motto aziendale nel footer condiviso, sotto il logo, nelle dodici lingue attive.
- Componente unico con lingua esplicita, senza traduzione automatica o fallback
  italiano/inglese; nessuna modifica a H1, metadati, logo, immagini, font o palette.

## Collocazioni differite, non dichiarate visibili

### Il Fuoco siciliano

Nel ramo esaminato non c'è una presentazione dedicata a questa linea.
Gli archivi storici delle cucine e i riferimenti generici alle cucine da esterno
non sono la presentazione del marchio “Il Fuoco siciliano”.
Quando tale presentazione sarà disponibile, inserire il valore `sicilianFire`
del catalogo nella sua introduzione, come semplice paragrafo con lingua esplicita.
Non rinominare l'azienda, gli archivi o tutte le cucine; non creare una nuova
pagina per il solo motto.

### Atelier internazionale — integrazione alla consegna già attiva

Inserire nella presentazione dedicata di Atelier il valore `atelier` del
catalogo, immediatamente dopo il testo introduttivo, con gli stessi font e colori
già previsti. IT: “Se lo immagini, noi lo costruiamo.”.
EN: “If you can imagine it, we can build it.”.
Usare gli equivalenti di tutte le altre undici lingue, non il fallback inglese.

Questa consegna integra le istruzioni locali
`.local/tasks/atelier-internazionale-arabo.md`, che già riportano la richiesta:
non modifica la scheda attiva né il suo ambiente isolato. La pagina Atelier non
è presente in questo ramo: ricezione e applicazione andranno verificate alla
consegna di quella pagina, con un'unica occorrenza nella presentazione.

### Arabo

Tutti e tre i valori arabi sono pronti nel catalogo ma non sono attivati.
Il componente pubblico esclude le lingue bloccate. Quando la consegna arabo
avrà completato le proprie verifiche e attivato la lingua, il motto aziendale
sarà disponibile nello stesso componente; verificare documento e contenuto RTL,
a capo e assenza di overflow su desktop/mobile anche per Atelier e la linea.
Non modificare ora flag, percorsi, sitemap o pagine incompiute.

## Significato e limiti

Sono espressioni del brand, non garanzie tecniche o contrattuali.
“Ovunque” riguarda la linea, non un ampliamento dei servizi edili locali:
l'edilizia resta nell'area concordata attorno a Cefalù. I singoli progetti
internazionali richiedono le verifiche già previste, non fattibilità universale.

## Prove di questa consegna

- `pnpm run typecheck`: superato nell'intero workspace.
- `PORT=4197 BASE_PATH=/ pnpm --filter @workspace/marenetto-build exec node --test scripts/brand-mottos.test.mjs scripts/localization.test.mjs scripts/seo-metadata.test.mjs scripts/historical-home.test.mjs`:
  25 controlli superati; copertura delle 12 home e dei 12 footer servizi.
- `MOTTO_PREVIEW_ORIGIN=<origine preview> pnpm --filter @workspace/marenetto-build exec node scripts/brand-mottos-evidence.mjs`:
  verifica in sola lettura delle 12 home effettivamente servite, inclusi gli
  URL storici. Due occorrenze totali prima e dopo il caricamento client,
  una per collocazione; testo nella lingua prevista e nessun errore JavaScript.
- Geometria mobile 390 × 844 verificata nelle 12 lingue: motti entro il viewport,
  nessun overflow dei paragrafi o del documento.
- Screenshot desktop 1440 × 1000 e mobile 390 × 844 della home italiana;
  ulteriori catture di hero e fascia motto/footer IT, DE, FR nei due formati.
- `/ar/` risponde 404 senza motti: non è una pagina araba attivata.
- Prove generate in `generated-artifacts/brand-mottos/`, escluse da Git e
  dalla pubblicazione. Rapporto scaricabile con testi e immagini:
  `consegna-motti.html`. Nessun modulo aperto o inviato, nessuna pubblicazione.

**PRONTO PER REPUBLISH per le collocazioni home/footer implementate e verificate,
dopo l'integrazione del ramo.** Non significa che Atelier, la linea dedicata
o l'arabo siano già visibili o pronti al rilascio.
