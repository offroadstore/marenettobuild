# Fasi 3 e 4 — consegna del candidato

## Perimetro

Questa consegna segue la richiesta aggiornata del proprietario: venti pagine
territoriali distinte, indice delle zone, servizio arredi mondiali, pagina
sull'uso dell'intelligenza artificiale, pagina Sicilia e trasferte e verifica del blocco degli strumenti
non tecnici prima del consenso. Non introduce pubblicazioni, modifiche ai
Secrets, invii email o attivazioni di nuovi fornitori.

Le venti località sono autorizzate dal proprietario come area ordinaria, non
come limite esclusivo. Entro circa 60 km da Cefalù si svolgono sopralluoghi e
preventivi ordinari; oltre tale area l'impresa valuta progetti di dimensione
adeguata con trasferta del proprio team e preventivo dedicato che comprende
trasferta e logistica. L'elenco non certifica distanze stradali misurate,
filiali locali o disponibilità automatica per ogni immobile.
Castel di Tusa è una località del comune di Tusa.

Gli arredi su misura restano offerti nel mondo previa verifica del progetto
e della logistica. La successiva decisione del proprietario autorizza anche
trasferte edili condizionate nel resto della Sicilia, Italia e all'estero:
non si dichiarano lavori già eseguiti o autorizzazioni locali ottenute.

## Nuove URL italiane

Percorsi relativi al dominio pubblico già configurato:

- `/zone-servite`
- `/zone-servite/cefalu`
- `/zone-servite/lascari`
- `/zone-servite/campofelice-di-roccella`
- `/zone-servite/collesano`
- `/zone-servite/gratteri`
- `/zone-servite/isnello`
- `/zone-servite/castelbuono`
- `/zone-servite/pollina`
- `/zone-servite/san-mauro-castelverde`
- `/zone-servite/castel-di-tusa`
- `/zone-servite/termini-imerese`
- `/zone-servite/caccamo`
- `/zone-servite/polizzi-generosa`
- `/zone-servite/petralia-sottana`
- `/zone-servite/petralia-soprana`
- `/zone-servite/gangi`
- `/zone-servite/geraci-siculo`
- `/zone-servite/cerda`
- `/zone-servite/sciara`
- `/zone-servite/trabia`
- `/arredi-su-misura-cemento-microcemento`
- `/uso-intelligenza-artificiale`
- `/sicilia-e-trasferte`

L'inventario completo delle URL tradotte viene consegnato separatamente nel
file `FASE-3-4-URL.csv`. Le lingue non attive non vengono abilitate.

## Materiali reali da fornire per la galleria arredi

I segnaposti non sono progetti realizzati e non contengono fotografie inventate.
Per sostituirli servono:

- fotografie originali autorizzate alla pubblicazione, con provenienza;
- descrizione del pezzo e distinzione tra progetto, campione e lavoro consegnato;
- materiali, finiture e dimensioni effettive;
- contesto d'uso e indicazioni di manutenzione verificate;
- dettagli di trasporto, accesso e montaggio applicabili al singolo progetto;
- autorizzazione del cliente se l'opera o la sua collocazione sono identificabili.

Non sono necessari prezzi pubblici. Non attribuire ai segnaposti date,
destinazioni, clienti o prestazioni tecniche non documentate.

## Privacy e trasparenza

La nuova pagina IA descrive testi, traduzioni, immagini illustrative e render,
i limiti della generazione e la responsabilità della supervisione umana.
Non certifica una revisione professionale o umana già avvenuta per ogni
contenuto. Le immagini illustrative non sono prove di lavori eseguiti.

Il rimando reciproco è aggiunto nella presentazione della privacy italiana,
senza riscrivere il file legale fornito dal proprietario o cambiarne versione,
basi giuridiche, periodi di conservazione e approvazioni. Le pagine legali
restano italiane secondo la precedente istruzione specifica; la nuova pagina
informativa IA è invece tradotta nelle lingue attive.

I controlli del consenso usano i trasporti effettivi del client con browser e
rete simulati: nessuna chiamata a Google o Meta è necessaria per provarli.
Statistiche e marketing sono categorie indipendenti. Il controllo riguarda
il codice candidato, non una certificazione legale né una prova della futura
pubblicazione.

## Verifiche

Verifiche eseguite il 24 novembre 2026 sul candidato, senza pubblicare:

| Controllo | Esito |
| --- | --- |
| `pnpm run typecheck` | Superato, intero workspace |
| `PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build` | Superato; controllo produzione su 1.380 risorse testuali |
| `pnpm --filter @workspace/marenetto-build run test:phase34` | 9 test superati |
| `pnpm --filter @workspace/marenetto-build run test:seo` | 39 test superati |
| `pnpm --filter @workspace/marenetto-build run test:i18n` | 9 test superati |
| `pnpm --filter @workspace/marenetto-build run test:legal` | 4 test superati |
| `node --test artifacts/marenetto-build/scripts/marketing.test.mjs` | 4 test superati |
| Controllo visivo anteprima | Cefalù e Sicilia/trasferte a 375 px; arredi a 1.365 px; nessun errore della pagina in console |

I controlli specifici coprono 24 famiglie di pagine in 12 lingue, per **288
nuove URL**: contenuti nel primo HTML, un solo H1, title/description unici,
canonical, Open Graph, hreflang reciproci, sitemap, contatti e collegamenti
interni. I paragrafi editoriali dedicati alle località sono verificati come
distinti anche eliminando i nomi dei luoghi.
Un test aggiuntivo conferma che il ritiro editoriale di una nuova pagina
prevale sul contenuto statico e non lo ripubblica come ripiego.

Tutte le 288 URL hanno restituito HTTP 200 e metadati indicizzabili nel server
di produzione del candidato con host pubblico simulato e gate esplicito.
L'host di anteprima rimane noindex. Non è una verifica del sito attualmente
pubblicato: il candidato non è stato pubblicato.

Il consenso è stato verificato con i trasporti effettivi GA4/Meta simulando il
browser: assenza di richieste prima della scelta e dopo rifiuto; statistiche
autorizzate senza marketing; caricamento successivo all'opt-in; arresto dopo
revoca e rimozione dei cookie marketing controllabili. I test esistenti
coprono inoltre scadenza, record malformati e indisponibilità dello storage.
Non sono state eseguite chiamate reali ai fornitori.

Le informative legali originali hanno superato il controllo di integrità.
Il logo non è stato modificato. Le traduzioni nuove sono state preparate e
controllate per completezza tecnica; non viene attestata una revisione
indipendente madrelingua.

La build segnala avvisi non bloccanti già presenti sugli attributi di import
JSON e sulla combinazione di import statici/dinamici degli archivi storici.
Non sono errori di compilazione e non è stata modificata l'architettura degli
archivi per eliminarli.

**PRONTO PER REPUBLISH — decisione ed esecuzione restano al proprietario.**

## Aggiornamento successivo: trasferte, rete e Atelier

La pagina Sicilia e trasferte ha dodici versioni native, metadati, hreflang,
FAQ e schema Service. Home, indice, venti pagine territoriali, arredi e servizi
mostrano il richiamo all'area ordinaria e alle trasferte con preventivo dedicato.
Sono coperti anche i rami storici delle categorie e dei servizi, non soltanto
la nuova pagina servizi. Nessuna nuova pagina autonoma per Palermo, Taormina,
Messina o Siracusa.

Lo schema dell'impresa espone venti località più Sicilia, Italia e
“Worldwide (on request)”. Il testo per gli assistenti IA distingue l'area
ordinaria dalle trasferte e non attribuisce lavori o autorizzazioni estere.

Le indicazioni successive per rete, Atelier e architetti sono conservate nei
rispettivi piani locali, con integrazione comune in
`.local/tasks/marenetto-owner-coverage-network-amendment.md`.
L'ordine operativo è Fasi 3–4, Fase 6, Atelier/arabo, professionisti, Fase 5.
Non si dichiara di aver modificato le dipendenze salvate delle attività già
accettate, né di aver completato le pagine delle fasi successive.

CefaluApartments.it ha risposto HTTP 200 text/html al controllo HEAD con
redirect del 24 novembre 2026. Questo abilita l'inserimento del collegamento
nella successiva Fase 6; non è una verifica indipendente di ogni servizio o
della data di avvio. Stessa proprietà, attività dal 2008 e lista dei servizi
sono dichiarazioni esplicite del proprietario. Nessun account, acquisto o
contatto commerciale è stato effettuato.
