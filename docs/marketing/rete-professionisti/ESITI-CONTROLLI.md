# Esiti del candidato — 25 novembre 2026

## Stato finale di questa consegna

**PRONTO PER REPUBLISH — candidato verificato, attivazione non eseguita.** Nessuna
pubblicazione, attivazione delle nuove edizioni o notifica ai motori.
Il titolare ha scelto di proseguire con controlli documentali e linguistici
assistiti da IA: sono ora registrate 144 revisioni con impronte del contenuto,
correzioni valutate e limiti espliciti. Non sono pareri tecnici/legali
qualificati o certificazioni madrelingua. Il titolare accetta il riferimento
regionale vigente al 28 febbraio 2025 e le modifiche successive non verificate
come limite esplicito, non bloccante. L'inventario immagini registra la
verifica visiva IA, non simula un'approvazione del titolare.

La consegna finale distingue il candidato pronto dall'attivazione:
`readiness.json` contiene le impronte e le prove; `reviews.json` resta vuoto.
Gli audit finali sono nella cartella generata `network/candidate`. La resa
SSR riguarda 144 pagine editoriali e 42 edizioni di servizi esistenti;
gli audit Lighthouse finali misurano HTML/CSS iniziali, non una nuova
prova completa di interazione o idratazione. Punteggi, URL, viewport,
ambiente e limiti effettivi sono nel dossier aggiornato.

Nella consegna finale sono passati 74 test: rete 9, SEO 39, i18n 9,
servizi/privacy 10, CMS 7, oltre a TypeScript dell'intero workspace e build
con protezione degli asset di produzione. Risolte anche l'integrazione
nel ramo storico di General contractor e le destinazioni dei link CMS
del candidato: non rimangono indirizzate alle anteprime una volta attivato.

Gli audit finali hanno rilevato un contrasto 4,38:1 nel testo dell'invito al
contatto. Correzione puntuale: `#4d514b` su `#e8dfd1`, verificata con calcolo
della luminanza relativa a 6,13:1. I punteggi Lighthouse originali restano
quelli misurati, non sono stati riscritti dopo la correzione.

Dopo il riavvio coordinato, anteprima mobile e immagini rispondono
regolarmente e il servizio editoriale torna HTTP 200. Il primo avvio web
ha registrato un 502 transitorio mentre l'API si avviava. Nei log media,
sia storici sia della rete, compaiono inoltre avvisi `MaxListenersExceededWarning`
sui flussi: non dimostrano da soli una perdita di memoria e non hanno
impedito gli HTTP 200 osservati. La causa resta da approfondire, senza
nascondere l'avviso o presentare i log come privi di segnalazioni.

Dopo l'unione con gli aggiornamenti condivisi SEO e gestione immobili sono
stati preservati entrambi i rami funzionali e rimossi blocchi duplicati
dalla riconciliazione automatica. Sono ripassati build/protezione degli
asset, TypeScript web, rete 9/9, SEO 39/39, i18n 9/9 e verifica non
distruttiva delle 144 impronte di attivazione. I 28 audit Lighthouse
rimangono le esecuzioni precedenti alla sincronizzazione, con date e
limiti dichiarati, non presunte nuove prove.

## Controlli eseguiti realmente

| Controllo | Risultato | Copertura |
| --- | --- | --- |
| Build web completa e protezione degli asset di produzione | Superata | Applicazione esistente con le integrazioni predisposte e bozze escluse |
| TypeScript | Superato | Gli altri pacchetti nel controllo del workspace; app web ricontrollata dopo la correzione di un'inferenza nel catalogo |
| Test dedicati rete dopo la revisione IA | 9/9 | 144 cataloghi/risposte SSR, unicità, FAQ/schema, link e anchor, 34 scene/102 varianti, esclusione delle bozze, revoca per revisione modificata; impronte IA correnti e nessuna promozione automatica; servizi nelle altre lingue del sito |
| Test editoriali | 7/7 | Sanitizzazione, media consentiti, 144 bozze CMS bloccate all'attivazione, revisioni e controlli preesistenti |
| Suite SEO esistente | 39/39 | Metadati, uscite pubbliche, ritiro editoriale, errori e localizzazioni esistenti |
| Suite i18n esistente | 9/9 | Inventario e cataloghi del sito |
| Suite servizi/privacy esistente | 10/10 | Modelli, dati strutturati e regole già presenti; nessuna modifica ai consensi |
| Verifiche HTTP del candidato | 662/662 | 144 anteprime native 200 e relativi URL pubblici 404, 12 anteprime servizi 200, 102 WebP 200 image/webp, link interni e uscite senza bozze |
| Percorso nel browser | Superato | Servizi → pilastro → Comfort → Infissi → richiesta, senza compilazione/invio; mobile, tastiera/focus e desktop |
| Lighthouse SEO/accessibilità | 25 audit eseguiti | 12 pagine italiane, 5 servizi IT/EN/DE/NL/FR, pilastro e Comfort in EN/DE/NL/FR |

Il primo controllo HTTP ha segnalato 13 errori nel **test**, perché attendeva
`lang="it"` invece del legittimo `lang="it-IT"` presente nell'HTML iniziale.
Corretto il confronto BCP 47, sono stati ricontrollati quei documenti e i
link italiani prima non raggiunti. I 628 risultati già validi non sono stati
spacciati per nuove esecuzioni. L'inventario finale contiene 662 esiti validi.

Le approvazioni sintetiche del test di revoca esistono solo in memoria nel
processo di test. Non sono mai state scritte nel registro di approvazioni,
nel CMS o nel sito pubblico.

## Ripresa con controlli assistiti da IA

Il confronto linguistico ha coperto dodici pagine per ciascuna delle dodici
lingue e i testi condivisi dei servizi. Le segnalazioni sono state valutate:
non sono state applicate proposte che avrebbero eliminato spiegazioni utili
degli istituti italiani o introdotto equivalenze professionali improprie.
Sono stati corretti termini francesi e russi, tre confronti fuori ambito
in SV/NO/DA e 24 alt non sufficientemente aderenti al provino. Due dei
confronti fuori ambito sono stati trovati dalla scansione letterale, non
dal modello linguistico: non si dichiara pertanto una revisione infallibile.

La verifica documentale distingue orientamento generale e valutazioni
necessarie sul singolo caso. Aggiunti la modulistica del Genio Civile di
Palermo aggiornata il 4 novembre 2026, la guida impiantistica camerale del
4 marzo 2026 e i controlli del Notariato. Il testo ARS del 2016 non è stato
spacciato per coordinamento vigente; un supplemento GURS del 2026 non è
stato recuperabile né con il lettore né con una richiesta HTTP diretta.
Questi limiti non sono stati convertiti in un'approvazione.

La ripresa ha rieseguito test rete, TypeScript dell'app e build. Le altre
prove sopra riportate appartengono alla consegna precedente, non sono
nuove esecuzioni dopo le correzioni di testo. Report completo e CSV delle
144 revisioni sono in `generated-artifacts/network/ai-review`, fuori da Git.

Le suite generali osservate nei log avevano inoltre due errori: la pagina
servizi rumena cercava un catalogo rete inesistente, e il controllo permessi
importava i test editoriali senza il runner necessario. Corretti entrambi,
senza eliminare test o usare una traduzione di ripiego. La verifica rumena
SSR è ora nel test rete; lo screenshot successivo controlla anche la pagina
caricata nel browser. Non si dichiara rieseguita l’intera suite browser
generale di centinaia di pagine.
Sono invece passati i comandi effettivi `test:permissions`, inclusi test
editoriali e monitoraggio, e `check:internal-schema`, senza modificare
le regole di accesso dell'applicazione.

## Lighthouse: ambiente e limiti

- Ambiente: anteprima di sviluppo gestita, non il sito pubblico.
- Viewport: mobile 390×844, scala 1, senza simulazione di rallentamento
  aggiuntiva; versione e orario effettivi in ogni risultato.
- SEO grezzo: **69/100** sui 25 URL. Il rilievo è `is-crawlable`: noindex
  intenzionale nell'HTML, header del server e protezioni del proxy di
  anteprima. Non sono stati rimossi per ottenere un punteggio artificiale.
- Accessibilità: **96–97/100**. Rilievi nei componenti condivisi preesistenti:
  contrasto del riepilogo dell'informativa sulle richieste di chiamata;
  corrispondenza fra testo del logo e nome accessibile; in alcune edizioni,
  nome accessibile del selettore lingua.
- Nessun audit è stato presentato come certificazione di conformità.
  Questi 25 URL non equivalgono a un audit browser di tutte le 144 edizioni
  e di ogni pagina servizi storica.

Gli esiti Lighthouse integrali con URL, lingua, viewport, timestamp,
versione, punteggi e dettagli sono in
`generated-artifacts/network/lighthouse`; il dossier contiene la tabella
riassuntiva, senza occultare i rilievi.

## Percorso browser: limiti effettivi

La prova ha confermato una H1, immagini e didascalie IA visibili, caricamento
lazy dopo scorrimento, assenza di overflow e colonne desktop non sovrapposte.
L'anchor FAQ è stato attivato da tastiera con focus visibile e destinazione
libera dalla barra contatti. È stato verificato anche il metadato tedesco
dopo l'idratazione: nessuna riscrittura errata sotto `/articles/`.
Il controllo dei percorsi pubblici ha confermato che la sezione non appare
per errore nella navigazione normale.

Non sono stati aperti chat WhatsApp, inviati moduli, modificati consensi o
approvati contenuti. Il confronto testuale integrale dei 144 corpi è una
prova SSR automatica, non una lettura umana nel browser di tutti i testi.
L'interfaccia CMS autenticata non è stata percorsa con questo tester;
integrazione, import e blocchi sono stati controllati con i test editoriali.

## Materiale consegnato

- Dossier HTML autonomo con tutte le 144 bozze, aggiornamenti servizi,
  matrice/provenienza, provino, prompt, impronte e risultati.
- Inventario CSV delle 34 immagini con varianti, origine, data e stato.
- Registro CSV delle fonti consultate, con ambiti e limiti.
- Inventario JSON delle edizioni e delle rispettive impronte di revisione.

Originali, provini, output di build e report pesanti restano fuori da Git.
I WebP applicativi sono in App Storage, senza migrazione di asset esistenti.

## Cosa manca per dichiarare la disponibilità al Republish

Occorrono evidenze pertinenti alle revisioni esatte: verifica tecnica/legale
delle fonti e delle affermazioni, verifica linguistica delle edizioni e
registrazione della revisione delle immagini. Il dettaglio delle fonti che
non attestano da sole la vigenza completa è in `CONSEGNA-E-VERIFICHE.md`.
Non basta convertire queste prove automatiche in dichiarazioni di
approvazione professionale.

Una volta raccolte le revisioni, correggere gli eventuali rilievi, aggiornare
le impronte e i registri per lingua e ripetere solo i controlli interessati.
Il Republish resta un'azione del titolare.
