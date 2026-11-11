# Verifica della fedeltà storica — stato aperto

> **Aggiornamento dopo il ripristino:** la baseline qui sotto precede il recupero.
> Sul commit `10b6187ea37c8e44fe993fea07e085f48d141cd8` sono ora verificati
> 177 percorsi originali (204 casi URL) con corpo, H1 e title identici alle fonti
> indipendenti. Restano 72 edizioni in attesa delle 25 conferme puntuali, senza
> riscritture sostitutive. Vedere `RESTORATION_STATUS.md` e il rapporto aggiornato.

Data: 10 novembre 2026. Questo documento corregge il significato della precedente
consegna tecnica: una rielaborazione completa non è una copia fedele dell’originale.

## Fonti e revisione effettiva

- Sito storico acquisito indipendentemente: `https://www.marenettobuild.com/`.
- App realmente servita e cinque casi browser verificati sul commit
  `7d6fd4b8dd54bad281a76faff27d75d795a9549c`.
- Le risposte della nuova pagina sono richieste all’handler HTTP preparato, non
  costruite leggendo il catalogo nel confronto.
- Archivio preesistente: `content/source-articles-it.json`, con data dichiarata
  2026-10-17. È conservato come terza fonte; tale data non è retroattivamente
  certificata come acquisizione verificabile.
- Il rapporto generato distingue il commit Git reale dello strumento dalle
  impronte SHA-256 dei file e dei corpi.

## Esito dell’acquisizione

361 URL acquisiti; 0 errori residui dopo la ripetizione di una richiesta fallita;
nessun limite del crawler raggiunto. Incrociati sitemap, hreflang, navigazione,
archivi, collegamenti di paginazione effettivamente esposti e nove feed pubblici.
Nessun modulo inviato e nessun dato privato richiesto.

Le famiglie italiane canoniche della sitemap sono 27, di cui 14 articoli.
Sono emersi anche 14 archivi tag pubblici fuori sitemap. Tra lingue e alias sono
stati osservati 240 corpi testuali distinti per hash normalizzato: questo non
significa 240 articoli né certificazione dell’intero database del CMS.

Per i 321 URL HTML pubblici osservati nei collegamenti:

| Esito nel nuovo | Numero |
|---|---:|
| Titolo e corpo integralmente uguali alla fonte indipendente | 0 |
| Pagina raggiungibile ma differente | 81 |
| 404 | 239 |
| 410 | 1 |

81 URL restano raggiungibili; in 43 casi il percorso resta lo stesso ignorando
soltanto lo slash finale. Raggiungibilità e conservazione del percorso NON
dimostrano conservazione del contenuto.

Le 62 mappature configurate sono state verificate singolarmente: 33 percorsi
rispondono oggi con contenuti sullo storico, 29 restituiscono 404 sullo storico.
Le varianti slash sono deduplicate in questo conteggio. Nessuna delle 239
destinazioni storiche mancanti è coperta dalle mappature esistenti.

## Provenienza dei testi

Tutte le 14 destinazioni articolo servono **rielaborazioni già presenti nel
progetto**. Non sono copie letterali del sito storico né dell’archivio registrato
come ottobre. Il precedente `MIGRATION_REPORT.md` documenta la revisione
automatizzata e la qualificazione/rimozione delle affermazioni aziendali.

Per ogni articolo il registro consegnato contiene URL della fonte attuale,
data/ora, titolo, testo completo, sottotitoli, immagini/riferimenti, allegati,
collegamenti, file grezzo originale e file della nuova risposta.

Ogni differenza è leggibile nel rapporto HTML e nei file `diffs/` dello ZIP.
Nessun articolo è stato riscritto per eliminare differenze durante questa verifica.

## Lingue e sitemap

Il sito storico espone IT, EN, FR, DE, ES, NL, RU, PT e PL, con 27 riferimenti
per lingua nella sitemap. Esistono anche vecchi URL stranieri con lo stesso
corpo italiano: sono elencati separatamente, senza scambiare questo comportamento
per una vera edizione tradotta o per un redirect HTTP non osservato.

Nessuna delle nove edizioni è certificata come migrazione fedele e completa.
Le altre venti lingue richieste restano nel percorso editoriale come nuove bozze,
non come lingue già pubblicate sullo storico.

I 22 URL italiani della nuova sitemap sono una selezione editoriale del nuovo
progetto: sei pagine commerciali, due archivi e quattordici articoli rielaborati.
Non rappresentano il recupero completo delle 27 famiglie storiche, dei tag o delle
edizioni straniere. Le altre edizioni richiedono recupero dei testi, corrispondenza
degli URL, decisioni sulle differenze e approvazione specifica. L’indicizzazione
non viene comunque attivata.

## CMS pubblico

Il CMS storico è Framework360. I nove feed espongono sei elementi ciascuno e
non sono un elenco completo. Gli archivi tag non sono ignorati come 404
“migrate”: sono contenuti pubblici mancanti nel nuovo, con originali acquisiti.

Il grafo pubblico acquisito è chiuso rispetto ai collegamenti osservati, ma
nessuna esportazione del CMS è stata fornita. Il residuo di eventuali contenuti
pubblicati ma non collegati non è quantificabile con certezza.
Per chiudere questo controllo serve soltanto l’elenco/esportazione dei contenuti
pubblicati: URL, lingua, titolo, corpo, stato pubblico, canonical, media e allegati.
Non servono account, lead, messaggi dei clienti o altri dati privati.

## Cinque verifiche browser

Rieseguite il 10 novembre 2026 alle 11:35:44 UTC sul commit app sopra indicato:
**5 superate, 0 fallite, 0 saltate, 0 instabili**, durata circa 20 secondi.

```sh
pnpm --filter @workspace/marenetto-build exec playwright test \
  --config=playwright.config.ts --project=production-preview \
  tests/migration-routes.spec.ts tests/whatsapp-access.spec.ts \
  --grep 'ogni pagina pubblica|opens wa.me|English and Arabic' --reporter=json
```

Evidenza completa: `five-browser-results.json`, con i singoli risultati.
Questa volta non si tratta di verifiche HTTP sostitutive. Non sono stati ripetuti
in questa sessione tutti gli altri casi browser, WebKit/iOS, screen reader,
test di consegna SMTP o una verifica professionale dei testi.

## Decisioni e lavoro ancora necessario

Gli originali contengono affermazioni che le rielaborazioni avevano modificato.
Sono archiviati senza alterazioni. Il rapporto segnala 50 blocchi mediante termini
da verificare: è un filtro automatico, non una dichiarazione che siano tutti falsi.

Esempio concreto, articolo sulla garanzia decennale, blocco 3:

> Noi di Marenetto Build crediamo che la qualità si misuri nel tempo. Per questo,
> offriamo ai nostri clienti la possibilità di attivare una assicurazione decennale
> postuma: una tutela concreta che protegge il tuo investimento per 10 anni dalla
> fine dei lavori.

Questo testo non viene riproposto automaticamente come capacità aziendale attuale
verificata. Occorre la decisione del titolare sul trattamento degli originali,
poi il ripristino dei contenuti e degli URL delle nove lingue senza nuovi prefissi
e senza redirect generici che nascondano l’assenza di un’edizione.

**La migrazione resta aperta.** Il recupero dell’archivio e la correzione dei test
non equivalgono al ripristino fedele dei contenuti effettivamente serviti.
Grafica, logo, palette e hero approvati non sono stati modificati. Nessuna
pubblicazione, modifica del dominio o apertura all’indicizzazione è stata effettuata.

## Riproduzione ed evidenze

```sh
pnpm --filter @workspace/marenetto-build exec node scripts/historical/acquire.mjs
# Solo per riprovare acquisizioni incomplete senza scartare quelle riuscite:
pnpm --filter @workspace/marenetto-build exec node scripts/historical/acquire.mjs --resume
pnpm --filter @workspace/marenetto-build exec node scripts/historical/compare.mjs
pnpm --filter @workspace/marenetto-build exec node scripts/historical/report.mjs
```

Gli output sono in `generated-artifacts/historical-fidelity/`, esclusi da Git e
consegnati separatamente come rapporto HTML, registri CSV e archivio ZIP con fonti
grezze, metadata e diff. Le acquisizioni non consultate non sono certificate.
