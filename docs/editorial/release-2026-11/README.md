# Otto approfondimenti e sei guide — rilascio autorizzato

## Confine dell’incarico

Richiesta del titolare del **26 novembre 2026**: otto articoli commerciali e
attivazione informativa delle sei guide già preparate, tutte in IT, EN, DE, FR,
NL, ES, PT, RU, PL, SV, NO, DA, AR. La revisione assistita da IA e
l’autorizzazione interna dichiarata dal titolare non costituiscono parere
professionale, revisione madrelingua o ordine di pubblicazione autonoma.

La serie separata di dieci puntate non viene riscritta né importata.
I manoscritti originari delle sei guide restano immutati e conservati.
Il pacchetto pubblico rimuove i soli segnaposto privati e i vecchi inviti
commerciali; conserva i limiti tecnici, le FAQ e le fonti. La guida acquisto
mantiene identità, percorsi storici, normalizzazione del CMS e canonical
originali, compresi gli slash finali dove già presenti.

## Riprodurre il candidato senza database

Da workspace, in sviluppo:

```sh
pnpm --filter @workspace/marenetto-build run prepare:commercial-release
pnpm --filter @workspace/api-server run test:commercial-release
PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build
pnpm --filter @workspace/marenetto-build run test:commercial-release
node artifacts/marenetto-build/scripts/commercial-release-client.mjs
pnpm run typecheck
```

La preparazione e le prove scrivono soltanto sotto `generated-artifacts/`,
il piccolo indice delle revisioni e l’illustrazione locale. Non leggono
credenziali né aprono connessioni a database. Il collaudo CMS usa il router
reale con un adattatore SQL in memoria e identità **esplicitamente sintetiche**:
non è una sessione del titolare. Il processo HTML è quello di produzione,
collegato a un’API locale fittizia che restituisce le revisioni realmente
attivate nel collaudo.

Il pacchetto esatto è `generated-artifacts/editorial/release-2026-11/package.json`.
L’impronta radice lega contenuti sanitizzati, sorgenti italiane, identità,
lingue, percorsi CMS e canonical. Gli eventi di approvazione del CMS legano
ulteriormente l’approvazione al contenuto immutabile e alla sorgente italiana.
L’indice pubblico riconosce soltanto le revisioni autorizzate esatte: cambiare
il corpo non eredita automaticamente l’abilitazione SEO di questo rilascio.

Le 182 edizioni non sono 182 nuovi URL: 13 aggiornano la famiglia acquisto,
169 sono indirizzi candidati degli otto articoli e delle altre cinque guide.
Le guide restano secondarie, raggiungibili dalle pillar, senza nuovi ingressi
nel menu e senza promozione nella home commerciale.

## Unico passaggio autenticato residuo per Claude

1. Conservare l’archivio esatto consegnato e confrontare l’impronta radice nel
   rapporto con `package.json`. Non ricreare una traduzione nel passaggio owner.
2. Ricontrollare lo stato della serie video e le revisioni della famiglia acquisto
   nel CMS di destinazione. Il controllo automatico rifiuta qualunque revisione
   più recente diversa da una bozza originaria conosciuta. **Non forzare**:
   confrontare il contenuto nuovo, conservare gli originali e rigenerare una
   consegna verificata se c’è una collisione reale.
3. Aprire l’area CMS `/internal` dell’ambiente di destinazione nella sessione
   autenticata del titolare. Non creare utenti, cookie, token o firme artificiali.
4. Eseguire il file privato `owner-activate-console.js` negli strumenti del browser
   della sessione già aperta. Scegliere il `package.json` consegnato. Il file
   contiene l’impronta esatta attesa e svolge prima **solo letture** su tutte le
   edizioni; non viene mai distribuito nel sito pubblico.
5. Esaminare il riepilogo e confermare l’azione esplicita. Questo è il passaggio
   che modifica il CMS di destinazione: salva solo dove necessario, invia in
   revisione, approva e attiva tramite le normali API owner-only. I tre controlli
   globali di rilascio restano obbligatori; se manca un controllo o un permesso,
   fermarsi e risolvere la configurazione legittima. Nessun aggiramento.
6. Conservare la ricevuta JSON scaricata: devono risultare **182 revisioni attive**
   e hash/sorgenti coincidenti con la matrice. Un’interruzione non è un successo:
   alcune edizioni potrebbero essere state salvate o attivate prima del blocco.
   La ripetizione riprende solo revisioni esatte e invarianti; non riattiva ritiri.
7. Il titolare esegue il Republish tramite Claude separatamente. L’agente di
   questa consegna **non** lo esegue. Dopo il rilascio verificare risposte reali
   WWW/HTTPS, sitemap/hreflang, propagazione, cache e assenza di ritiri; non
   promettere indicizzazione, ranking, rich result o citazioni IA.

L’attivazione autenticata nell’ambiente di destinazione è distinta
dall’autorizzazione editoriale già dichiarata il 26/11/2026: non si chiede di
simulare una nuova revisione professionale. L’infrastruttura isolata ha
collaudato il passaggio completo senza modificare dati reali.

## Illustrazione e diritti

Unico asset nuovo: diagramma schematico vettoriale originale, redatto con
assistenza IA in `project-diagram.svg` e rasterizzato localmente in PNG.
Nessun volto, opera, immobile, cliente, località o materiale riconoscibile;
nessuna fotografia di terzi, licenza acquistata o immagine di un lavoro reale.
Ogni edizione ha alt e didascalia nella propria lingua e l’etichetta IA
individuale del renderer. Le nuove liste non fingono fotografie di copertina:
il campo immagine resta vuoto nelle 170 revisioni di questo pacchetto; le dodici
acquisto conservano le illustrazioni autorizzate e le etichette della serie già
integrata. Portfolio/Progetti rimane disattivato.

## Serie integrata e guida acquisto condivisa

**Ordine nell’ambiente di destinazione.** Il preflight richiede le dodici
revisioni della serie effettivamente attive, non soltanto il codice integrato in
Git. Se il codice della serie è già in esecuzione, il titolare può applicare il
pacchetto e poi eseguire il suo Republish del codice finale. Se non lo è ancora,
il titolare esegue prima il Republish del codice integrato tramite Claude:
l’avvio applica la politica già autorizzata della serie; quindi, nella sessione
owner del nuovo CMS, applica il pacchetto esatto per le altre 170 edizioni.
Questi contenuti sono runtime: non occorre un secondo Republish per attivarli.
Non dichiarare concluso il rilascio delle 182 edizioni al solo primo avvio;
conservare il preflight/ricevuta e completare i controlli esterni dopo entrambe
le operazioni. Nessuna di queste azioni di destinazione è stata eseguita qui.

Conteggio degli indirizzi: 109 definizioni nuove (104 articoli e cinque guide
arabe), 60 percorsi delle guide già candidati privati e conservati, tredici
indirizzi storici acquisto conservati. I 169 percorsi previsti per la prima
attivazione pubblica includono i 60 già definiti: non sono 169 definizioni nuove.

Il pacchetto finale conserva in sola lettura le dodici revisioni acquisto della
serie: stesso hash, testo, scheda guida/video, versione CMS ed eventi di
approvazione. Il preflight esige che siano già attive e corrispondano esattamente;
non le crea, salva, approva o riattiva. Le altre 108 edizioni della serie restano
inalterate. La nuova edizione araba si lega alla vera sorgente italiana più recente.

Solo per la famiglia condivisa la presentazione autorizzata aggiunge il processo
SAL e lo schema illustrativo e sostituisce il contatto mailto nel corpo con
l’unica richiesta al modulo locale. Non riscrive il manoscritto o la scheda della
serie. Title/description brevi e presentazione hanno un’impronta distinta, compresa
nella radice; la bandiera di sola lettura è vincolata alla stessa impronta.
L’autorizzazione SEO delle quattordici famiglie non inventa verifiche Search Console
e non cambia l’esclusione dall’indicizzazione delle altre puntate.

La ricevuta distingue 170 attivazioni e dodici revisioni conservate: 182 edizioni
interessate. Lo snapshot complessivo di collaudo è di 290 edizioni, perché include
le 108 edizioni estranee già attive. Le prove confrontano l’intera serie prima/dopo.
Il confronto finale delle superfici escluse usa il ramo principale comprendente
la serie, non attribuisce a questa consegna le modifiche ai consensi già integrate.

## Intenti del titolare

Input ricevuti, **non risultati di ricerche o stime di volume**: house/villa in
Sicily, villa with pool Sicily, haus Sizilien kaufen, huis Sicilië, maison Sicile
bord de mer, outdoor kitchen, pool house, microcemento. Sono distribuiti secondo
il contesto delle lingue e degli argomenti; non diventano ripetizioni forzate,
pagine per paese/città o presunte classifiche osservate.
