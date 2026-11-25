# Sezione professionisti — consegna

Fonti, ricerca applicata e limiti: [`professionisti-fonti.md`](./professionisti-fonti.md).
Preparazione del 25 novembre 2026; nessuna pubblicazione o notifica IndexNow.

## Percorsi localizzati

La pagina utile è `published` (sitemap, hreflang a 13). La pagina download è `draft`, `approval: null`, `sitemap: false`, noindex, esclusa da hreflang e llms; resta in `manifest.editions`. Accesso libero, senza login. Tutte le voci sono "file in arrivo" e nessun file viene servito.

| Locale | Pagina | Download (noindex) |
|---|---|---|
| it | /professionisti | /professionisti/file-in-arrivo |
| en | /en/architects-designers | /en/architects-designers/downloads |
| fr | /fr/architectes-designers | /fr/architectes-designers/telechargements |
| de | /de/architekten-designer | /de/architekten-designer/downloads |
| nl | /nl/architecten-ontwerpers | /nl/architecten-ontwerpers/downloads |
| es | /es/arquitectos-disenadores | /es/arquitectos-disenadores/descargas |
| pt | /pt/arquitetos-designers | /pt/arquitetos-designers/transferencias |
| pl | /pl/architekci-projektanci | /pl/architekci-projektanci/pliki |
| ru | /ru/arhitektoram-i-dizayneram | /ru/arhitektoram-i-dizayneram/fayly |
| sv | /sv/arkitekter-designers | /sv/arkitekter-designers/nedladdningar |
| no | /no/arkitekter-designere | /no/arkitekter-designere/nedlastinger |
| da | /da/arkitekter-designere | /da/arkitekter-designere/downloads |
| ar | /ar/lil-muhandisin-al-miamariyin | /ar/lil-muhandisin-al-miamariyin/al-malaffat |

La pagina araba segue il controllo di rilascio arabo già presente. Le aree download
vuote hanno inoltre un'esclusione esplicita dall'indicizzazione, sul server e
dopo la navigazione nel browser: l'autorizzazione generale delle lingue non
le promuove. L'anteprima resta sempre non indicizzabile.

## Inventario immagini

Sono riutilizzati tre WebP IA dell'inventario editoriale già esistente
(`src/content/network/images.json`), generati il 25 novembre 2026 e già
controllati visivamente. Nessuna nuova generazione, foto autentica non
autorizzata o opera attribuita all'impresa. Ogni immagine conserva alt
localizzato, etichetta IA visibile, dimensioni intrinseche 1024 × 576 e
varianti 480/800/1024. Il nuovo uso non trasforma l'illustrazione in una prova.

| Uso | id | n |
|---|---|---|
| Hero | stone | 0 |
| Materiali (galleria) | stone | 1 |
| Materiali (galleria) | bespoke | 1 |

Percorsi effettivi:
- `/api/network-media/stone-0-0c548a6f808da34e-1024.webp`
- `/api/network-media/stone-1-2d5b9932c1c6b592-1024.webp`
- `/api/network-media/bespoke-1-ad8c6d130333271a-1024.webp`

Prompt originali, data, SHA-256 e motivazione del controllo sono conservati
nell'inventario citato. Tutti e tre i percorsi sono stati controllati in
sola lettura tramite il servizio immagini reale.

## Limiti documentali e legali applicati

- **Materiali:** lava smaltata per i piani esposti; maiolica solo verticale
  o riparata all'esterno. Gelo, macchie, spessori e dimensioni massime sono
  «dati in verifica» in tutte e quattro le schede. Nessuna idoneità provata
  per alimenti, yacht o agenti chimici.
- **Norme EN 13755, 14231, 12372, 14157, 12371:** documenti da raccogliere e
  valutare per materiale e uso, non certificazioni. La pagina non indica
  edizioni/anni; la scheda EN 12372:2007 consultata è ritirata con sostituzione,
  come segnalato nel documento fonti.
- **Programma studi:** condizioni comunicate su richiesta; listino trade
  applicato in fattura allo studio; referente dedicato; prestito campioni,
  con soggetto che sostiene il ritiro ancora da confermare prima dell'invio;
  pubblicazione dei progetti solo con consenso e diritti. Nessuna commissione,
  percentuale o prezzo pubblico.
- **Principio «Nessun compenso nascosto…»:** frase italiana conservata
  letteralmente e tradotta nelle altre dodici lingue. La nota adiacente
  distingue la dichiarazione dell'impresa da una certificazione legale.
  La sola fattura non garantisce compatibilità deontologica: vanno verificati
  incarico, interessi del committente e codice applicabile. Il limite del
  codice italiano sui compensi da terzi interessati è segnalato; nessun
  via libera internazionale è stato inventato.
- **Mancanze dichiarate:** nome del referente, progetti documentati, documenti
  scaricabili e prove dei singoli lotti. Cava, numero del blocco e video sono
  campi predisposti, non un registro o evidenze reali.
- **Visite:** solo su appuntamento; l'unico riferimento autorizzato allo
  stand è la frase richiesta dal proprietario. Nessuna fiera nominata.
- **FAQ:** spedizioni/dazi, imballi, garanzia e consegne extra-UE sono
  disciplinati dall'offerta per commessa/destinazione, senza inventare
  Incoterms, importatore, dazi inclusi, durate o consegne garantite.
- **Risposta:** prima risposta umana entro 24 ore lavorative, distinta
  dalla ricevuta automatica e da preventivo/esecutivi.
- **Ambito:** fornitura e montaggio nel mondo, distinti dai cantieri edili
  concentrati entro circa 60 km da Cefalù.

## Metodo linguistico

L'italiano è la fonte. Le dodici altre edizioni sono adattamenti completi,
con terminologia di settore locale, non involucri in lingua straniera.
La verifica semantica assistita da IA ha confrontato i limiti materiali
e, separatamente, nove gruppi di condizioni commerciali/legali in tutte
le tredici lingue: non sono emerse omissioni o inversioni sostanziali.
Le varianti sinonimiche «scelta/indicata dall'impresa» non sono state
scambiate per dichiarazioni di prestazioni tecniche certificate.

Non è stata svolta una certificazione indipendente madrelingua, legale o
tecnica. La verifica resta dichiaratamente assistita da IA; le condizioni
del singolo incarico richiedono la valutazione pertinente.

## Modulo e gestione della richiesta

Riutilizza il modulo e l'infrastruttura richieste, senza nuovi archivi lead.
Conserva nome, cognome, email, telefono, preferenza WhatsApp e lingua.
Il tipo `professional_studio` aggiunge studio, paese obbligatorio, tipo
villa/hotel/resort/yacht/altro, fase, prodotto, materiale, descrizione di
misure/disegni, scadenza, budget facoltativo e uno o entrambi gli intenti
campioni/selezione blocco. Sono disponibili aiuti «da definire».

I pulsanti di apertura preselezionano l'intento. I campi attraversano schema
API, validazione condizionale, archivio richieste esistente, dettaglio owner,
filtri per intento/tipo/paese, CSV ed email. Nessuna migrazione: il documento
professionale è parte dei dati della stessa richiesta.

Sono preservati antispam, idempotenza, UTM minimizzati, consensi separati,
retention di 12 mesi e cancellazione. Informativa estesa nelle tredici
lingue e versione `call-2026-11-25-professional`. In anteprima i dati
inseriti vengono scartati: resta solo un record sintetico, con tipo progetto
e intenti verificabili. L'email automatica distingue ricevuta, prima risposta
umana e preventivo/esecutivi.

**Allegati:** nessun upload né storage attivato. Il modulo accetta solo testo.
Per introdurre file privati servono prima autorizzazione del proprietario e
valutazione di costi, autorizzazioni, controlli di contenuto/tipo/dimensione
e cancellazione. Non vengono scaricati URL arbitrari né allegate email
non valutate. Nessuna modifica SMTP, secret o flag.

## Verifiche automatiche concluse

- Build completo Vite/SSR/SEO e controllo asset: superato.
- `pnpm run typecheck`: superato nell'intero workspace.
- `pnpm --filter @workspace/api-server run test:call-requests`: **34/34**.
  Inclusi persistenza su schema temporaneo, dati sintetici, tutti i tipi
  progetto/intenti, filtri, autorizzazioni, CSV sicuro, email nelle tredici
  lingue, idempotenza, retention e cancellazione.
- `pnpm --filter @workspace/marenetto-build run test:professionals`: **7/7**.
  HTML HTTP reale per le 13 pagine e 13 risorse vuote, titoli/description,
  H1, schema, FAQ visibili, canonical WWW, hreflang reciproci, sitemap,
  llms, link e immagini; nessun file fittizio. Inclusi controlli contro la
  regressione dei checkbox e degli elementi fissi.
- `pnpm --filter @workspace/marenetto-build run test:seo`: **39/39**.
- `pnpm --filter @workspace/marenetto-build run test:i18n`: **9/9**.
- `pnpm --filter @workspace/marenetto-build run test:arabic`: **7/7**,
  incluso noindex dopo navigazione dalle pagine professionali alle risorse.
- `pnpm --filter @workspace/marenetto-build run test:atelier`: **3/3**;
  conservato il percorso separato a sei passi.
- Screenshot desktop italiano 1440 × 1000 e arabo mobile 390 × 844:
  interfaccia caricata, immagini dichiarate, testo localizzato e RTL.

È stato fermato il precedente collaudo generale delle rotte, avviato
automaticamente su una sessione Vite ormai obsoleta durante la rigenerazione
del client API: non è conteggiato come prova superata. Il collaudo browser
finale dedicato al nuovo flusso è riportato separatamente a conclusione.

## Collaudo browser del nuovo flusso

Un unico passaggio desktop italiano, mobile arabo e controllo apertura inglese,
con richiesta sintetica e senza SMTP reale:

- Apertura dei due pulsanti con intenti corretti; campioni e blocco selezionabili
  insieme; campi, «altro», aiuti «da definire» e budget facoltativo presenti.
- Privacy, marketing e WhatsApp inizialmente non selezionati. Invio vuoto:
  errori localizzati e nessuna richiesta trasmessa.
- Invio valido con entrambi gli intenti e progetto hotel: risposta 201 e
  ricevuta dichiaratamente sintetica, senza falsa conferma di email inviata.
- Il record è stato verificato per codice esatto: progetto/intenti conservati,
  versione privacy attuale e consenso registrato dal server; recapiti e testo
  inseriti scartati e sostituiti con valori sintetici. Cancellato solo quel
  record; archivio tornato vuoto. Nessuna modifica ai membri interni.
- Tastiera: focus confinato nel dialogo e ritorno al pulsante dopo Escape.
  RTL di documento e dialogo corretto; nessun overflow del documento a 390 px.
- Download arabo: sei etichette «file in arrivo», nessun download fittizio.
  FAQ apribili e chiudibili; apertura del modulo inglese localizzata.

Il collaudo ha rilevato due problemi di impaginazione, poi corretti:
checkbox del dialogo influenzati da una vecchia regola CSS e sovrapposizioni
dei contatti fissi sul testo. Checkbox nativi ora accessibili anche al puntatore;
campo antispam nascosto con clipping anziché spostato di 9999 px; controllo
ostacoli esteso a termini/descrizioni. La barra contatti mobile ridondante è
nascosta soltanto sulle nuove pagine; header e footer restano invariati.
La verifica mirata finale è limitata a queste correzioni, senza un nuovo invio.

Esito della verifica mirata: corretti entrambi i difetti. I checkbox reali
rispondono a puntatore e tastiera; lo sfondo del dialogo non ha più overflow
(1425/1425 px desktop, 390/390 px arabo), né scorrimento laterale. Nell'intera
pagina araba il pulsante callback non copre il testo; la barra mobile è
nascosta come previsto. Nessun nuovo dato o invio è stato creato.
Un'ulteriore interferenza preesistente di WhatsApp con il copyright in fondo
pagina è stata risolta includendo quella riga fra gli ostacoli del controllo;
regola e algoritmo verificati con controlli locali, senza un altro collaudo completo.

**Limite dichiarato:** la continuazione nell'area titolare non è stata
verificabile nel browser: il servizio di identità ha rifiutato il dominio
sintetico `.invalid`. Non è stato creato un account esterno né usato un
indirizzo reale. Restano quindi distinti il collaudo pubblico riuscito e
i test API/dati (34/34) su dettaglio, filtri, CSV, permessi e cancellazione.

## Conferme e materiali ancora da fornire

1. Nome del referente.
2. Soggetto che sostiene il costo del ritiro campioni, prima di dettagliarlo.
3. Rapporti tecnici autentici pertinenti a campione, fonte, finitura e uso.
4. File scaricabili reali e progetti con diritti documentati.
5. Evidenze di tracciabilità per i singoli lotti.
6. Eventuale autorizzazione agli allegati: nessuna concessa o presunta.
