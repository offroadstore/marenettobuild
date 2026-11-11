# Audit finale di preparazione alla produzione — Marenetto Build

Data UTC: 2026-11-11T10:06:45.889664+00:00

## Verdetto

**NO-GO alla produzione nello stato verificato.** La chiusura di questo incarico consegna backup, audit, prove e piano di completamento; non certifica la migrazione integrale, non approva traduzioni/claim/diritti e non autorizza il rilascio.

Il mandato finale del titolare è stato eseguito come chiusura documentale con le carenze esplicite. Gli obiettivi originari non dimostrati restano nella checklist, non vengono dichiarati completati per effetto della chiusura del task.

## 1. Ambito e limiti

- Analisi del workspace, del server locale dell’anteprima e di 1255 documenti HTML generati; nessuna verifica del dominio di produzione attuale, DNS, certificato definitivo o dati produttivi.
- Riutilizzata la verifica Playwright di tutti i 437 URL inventariati, con hash del DOM e risposte indipendenti archiviate. Nessun nuovo invio al vecchio hosting e nessun modulo reale inviato.
- Non sono stati cambiati grafica, dipendenze, codice applicativo, dominio, privacy flag o blocchi di indicizzazione durante l’audit.
- Le scansioni non sono un penetration test e non costituiscono certificazioni di sicurezza, accessibilità, conformità GDPR o ranking.
- Il backup esclude segreti, sezioni userenv, dati DB, utenti del provider e allegati privati. La loro assenza è un limite operativo, non una copia completa del servizio.

## 2. Che cosa esiste e risulta verificato

| Area | Evidenza presente |
|---|---|
| Contenuti storici | 14 famiglie articolo, 126 edizioni nelle 9 lingue storiche; 29 lingue del prodotto conservate |
| Corpi confrontabili | 266 URL con fonte HTTP 200: 184 esatti, 8 modifiche italiane autorizzate, 65 versioni straniere in bozza, 9 confronti falliti |
| Browser indipendente | 437/437 percorsi visitati; 257/257 corpi accettati corrispondono anche al DOM visibile |
| Risorse | 78 risorse pubbliche archiviate; 33 immagini distinte migrate con SHA-256, HTTP e dimensioni verificati |
| Rendering SEO | HTML iniziale con corpo/H1 osservato; tutti i 1255 HTML hanno titolo, canonical e un H1 |
| Protezione anteprima | 1255/1255 noindex; robots effettivo Disallow: /; nessuna indicizzazione attivata |
| Accesso interno | Clerk gestito, inviti e ruoli nel codice; sessione anonima 401; 6 test permessi superati; schema interno di sviluppo pronto |
| Modulo | Validazione server, consenso richiesto, persistenza prima dell’esito e idempotenza; invio reale non collaudato |
| Storage | Allegati privati con controllo ruolo, dimensione e metadata; delivery pubblico immagini limitato a manifest immutabile |
| Backup | 548 file estratti in cartella temporanea e verificati uno per uno contro SHA-256; CRC ZIP superato |

## 3. Contenuti: che cosa resta aperto

I 437 sono URL candidati/alias/feed/link, non 437 articoli o altrettante pagine uniche.

- 171 URL non hanno una risposta sorgente HTTP 200 confrontabile: 69 hanno risposto 404 e 102 hanno terminato con 429.
- Dei 102, 89 derivano dai redirect già configurati nel nuovo sito (non prova di esistenza storica), 9 sono feed e 4 link nei contenuti. `/contatos` è 404 nell’anteprima; `/contatti`, `/pt` e `/ru` sono disponibili con normalizzazione slash.
- Le nove eccezioni `/translation-ok/` e varianti linguistiche non sono trasferimenti integrali: la fonte archiviata conteneva frammenti di modulo incompleti. L’anteprima restituisce 410 alla radice e 404 alle otto varianti.
- I nove feed sono sospesi con 503 in attesa di conferma. Non vengono descritti come feed migrati funzionanti.
- Le 65 versioni straniere modificate restano bozze, non traduzioni approvate; lo stato delle chiavi non è prova di revisione linguistica.
- L’inventario di generazione ha 754 edizioni: {"reviewed": 177, "published": 5, "draft": 428, "translated": 144}. “Reviewed” o “translated” non estende automaticamente l’approvazione a nuove composizioni.
- Restano aperte differenze di struttura/link/metadati: 1224 controlli atomici, non altrettante pagine rotte. I diff leggibili e i casi giustificati sono nel pacchetto storico.
- Servono una fonte CMS pubblica autorevole o altra conferma indipendente per chiudere le lacune; nessun contenuto assente è stato ricostruito con IA.

## 4. Sicurezza: esiti automatici

Audit dipendenze: {"critical": 1, "high": 8, "info": 0, "low": 5, "moderate": 10}. Totale: 24 segnalazioni, non necessariamente altrettanti pacchetti. Le segnalazioni non sono state corrette in questo incarico di audit.

SAST: stato ok, incomplete=False, 0 rilievi. Privacy/dataflow: stato ok, 0 rilievi. Zero rilievi in questi due strumenti non annulla le evidenze manuali.

| Severità scanner | Pacchetto installato | Identificatore | Versione correttiva segnalata |
|---|---|---|---|
| critical | proxy-addr 2.0.7 | GHSA-jqcg-44mw-7w3h@proxy-addr-2.0.7 | 2.0.8 |
| high | body-parser 2.3.0 | GHSA-27r3-jxmh-p828@body-parser-2.3.0 | 2.4.0 |
| high | brace-expansion 5.0.9 | GHSA-6j4f-fj2g-mc7p@brace-expansion-5.0.9 | 5.0.10 |
| high | brace-expansion 5.0.9 | GHSA-qhr7-859c-m2p7@brace-expansion-5.0.9 | 5.0.11 |
| high | markdown-it 14.3.1 | GHSA-gfr2-rv44-r23c@markdown-it-14.3.1 | 14.3.3 |
| high | markdown-it 14.3.1 | GHSA-r7fv-28h4-cvq7@markdown-it-14.3.1 | 14.3.2 |
| high | source-map-js 1.2.1 | GHSA-68fv-2mgg-jv7q@source-map-js-1.2.1 | 1.2.2 |
| high | vite 7.3.6 | GHSA-587h-7wmj-h5pm@vite-7.3.6 | 7.3.7 |
| high | zod 3.25.76 | GHSA-mrhx-c7xc-m3w5@zod-3.25.76 | 4.6.6 |

body-parser 2.3.0 e proxy-addr 2.0.7 sono nel runtime di Express 5.2.1, anche attraverso il peer di Clerk. L’advisory body-parser riguarda decompressione prima del routing; il codice usa express.json/urlencoded con opzioni predefinite. Non è stato tentato un payload che potesse arrestare il server.

L’advisory critico proxy-addr dipende dalla politica di fiducia IP/subnet; qui trust proxy è impostato a 1, non a una subnet. La vulnerabilità installata è verificata, la sfruttabilità specifica non è dimostrata. Aggiornare comunque il grafo e verificare la topologia reale.

Vite/markdown-it/brace-expansion/source-map-js includono superfici di sviluppo/tooling: distinguere l’esposizione reale dalle librerie pubblicate. Zod 3.25.76 è nel grafo runtime ma diversi import applicativi usano zod/v4; verificare il percorso del codice interessato, non imporre un major upgrade senza test.

## 5. Sicurezza: evidenze manuali e operatività

- Il server API riflette Origin https://audit.invalid e restituisce Access-Control-Allow-Credentials: true. La protezione anonima della sessione funziona (401), ma CORS non è ristretto: serve allowlist e verifica dei flussi autenticati cross-site.
- Nel server locale osservato mancano CSP, nosniff, Referrer-Policy e X-Frame-Options. L’edge HTTPS definitivo non è stato interrogato: HSTS e policy del proxy vanno verificati lì, senza deduzioni dall’HTTP locale.
- Il limite del modulo è 6 richieste/60s per IP in memoria. Non è condiviso fra istanze e non dà un limite durevole ai volumi; verificare TTL, crescita della mappa e trust proxy.
- Positivo: query non loggate dal serializer richieste; header cookie/authorization redatti. L’assenza di tutti i possibili dati personali nei log non è certificata.
- Positivo: ruoli e permessi server, allowlist di accesso interno, upload privati e verifica size/MIME metadata. Non risultano dimostrati antivirus/quarantena, verifica delle firme dei file o restore degli allegati.
- MFA, recupero account e sessioni in ambiente produzione non sono stati verificati; nessun account è stato creato o modificato.
- Le fonti HTML storiche vengono inserite nel template: mantenere verifiche di sanitizzazione e revisione su script/event handler/protocolli in ogni futura importazione. Nessun exploit XSS è stato dimostrato dall’audit.

## 6. SEO tecnico e pubblicabilità

La home reale restituisce corpo e H1 nell’HTML iniziale: non è una semplice home vuota da riempire solo con JavaScript. L’handler preparato ha superato i test SEO di consegna HTTP.

**Differenza concreta da risolvere:** `/sitemap.xml` nel server Vite dell’anteprima restituisce una shell HTML con 200, mentre `dist/public/sitemap.xml` è XML. Non basta vedere status 200: il percorso reale di rilascio deve servire il file/handler corretto. Il test dell’handler preparato non certifica automaticamente un altro run command.

- Origine attuale dei documenti generati: https://preview.invalid; indexing=False. È la protezione prevista per l’anteprima, non un errore da eliminare adesso.
- La shell base `index.html` contiene canonical/OG su un host Replit preimpostato, osservato anche nel fallback sitemap. Non è stato assunto come dominio produttivo valido: rimuovere/configurare prima del rilascio.
- 1255 HTML: title mancanti 0, canonical mancanti 0, pagine senza H1 0, H1 multipli 0.
- Description vuote: 114. Gruppi di titoli duplicati: 173, compresi percorsi di bozza/revisione: non tutti sono problemi di duplicazione indicizzabile.
- Solo 4 edizioni sono ammissibili alla sitemap secondo le approvazioni registrate. Non dichiarare 29 lingue pubblicabili né inventare hreflang equivalenti.
- JSON-LD non parsabile: 0; JSON sintatticamente valido non implica idoneità a rich result o accuratezza dei claim.
- Occorrenze img prive di alt: 554, comprese copie di template/bozze. Distinguere immagini informative da decorative; alt vuoto intenzionale e attributo mancante non sono la stessa cosa.
- Canonical, OG image, sitemap e hreflang vanno controllati sul dominio definitivo, non costruiti usando l’URL dell’anteprima.
- Nessun dato Search Console, analytics, backlink o ranking è disponibile nell’audit. Nessuna previsione di traffico viene formulata.

## 7. Privacy, conversione e fiducia professionale

Nessuna route dedicata privacy/cookie/termini è emersa nell’inventario delle edizioni. Il checkbox del modulo ha testo ma non un link a un’informativa dedicata. È una lacuna da sanare con il titolare prima della raccolta reale, non una valutazione legale sostitutiva.

Occorre stabilire e pubblicare informazioni verificate su titolare, contatti privacy, finalità, basi giuridiche, tempi di conservazione, fornitori e trasferimenti, diritti e canali di esercizio. Verificare gli effettivi cookie/storage/script caricati e ottenere consenso solo dove necessario: non aggiungere un banner puramente decorativo.

Il recapito email visibile è stato confermato per la pubblicazione, non per la consegna SMTP. Validare identità societaria, P.IVA/registrazioni applicabili, sede e area di servizio senza inventare dati.

Per una presenza professionale servono casi reali con foto e autorizzazioni, credenziali verificabili del team, spiegazione del processo preventivo/lavori/assistenza e garanzie prudenti. Non usare immagini IA come prova di cantieri eseguiti o testimonianze inventate. La pagina owner-demo va mantenuta chiaramente dimostrativa o esclusa dal percorso commerciale.

## 8. UX, accessibilità e prestazioni

La grafica approvata è conservata: hero fotografico, header e CTA sono visibili nel campione mobile 390×844. Campioni home mobile, articolo lungo mobile e pagina araba tablet non presentano overflow orizzontale misurato (larghezza documento uguale alla viewport). Questo non certifica tutte le famiglie/lingue o l’accessibilità.

Verificare navigazione da tastiera, focus del menu, messaggi dei moduli, etichette, contrasto, screen reader e sovrapposizioni delle CTA fisse/WhatsApp su contenuti e input. Non è stata dichiarata conformità WCAG.

Il maggiore bundle JS del build è 1,107,160 byte, gzip 300,116 byte. È una misura statica del file, non il peso effettivo di ogni pagina e non un Core Web Vital. Valutare code splitting e caricamento cataloghi; preservare proporzioni e immagini originali, ottimizzando copie di delivery solo con prove.

LCP/INP/CLS su dominio definitivo, reti lente, dispositivi reali e dati sul campo non sono stati misurati. Obiettivi consigliati: LCP <2,5s, INP <200ms, CLS <0,1; non sono risultati ottenuti.

## 9. Servizio e ripristino

Persistenza e notifiche sono implementate, ma questo audit non ha inviato lead/email reali. Il rilascio richiede un test controllato completo (con destinatari autorizzati), idempotenza, recupero email dopo crash, assegnazione e gestione dei lead, disponibilità dei file privati e procedure di assistenza.

Health API 200 è un controllo basilare, non una prova completa di DB, storage o SMTP. Servono monitoraggio di errori e invii, allarmi operativi, runbook e responsabilità di risposta.

Il backup consegnato è verificato a livello di file: **non** include dati DB, utenti Clerk o allegati privati e non è stato avviato l’intero servizio dopo restore. Prima del rilascio definire RPO/RTO e retention e provare un ripristino autorizzato completo. Le copie raw delle risorse pubbliche non sostituiscono il backup del bucket privato.

## 10. Controlli eseguiti e non eseguiti

| Controllo | Esito |
|---|---|
| Dipendenze | 24 rilievi: 1 critica, 8 alte, 10 moderate, 5 basse |
| SAST | 0 risultati, scansione non incompleta |
| Privacy/dataflow | 0 risultati automatici |
| SEO HTTP preparato | 3 test passati, 0 falliti |
| Cataloghi lingue | 9 test passati, 0 falliti; non revisione madrelingua |
| Permessi | 6 test passati, 0 falliti |
| Schema accesso interno sviluppo | Pronto; nessuna certificazione DB produzione |
| Playwright storico | 437 URL, 257 corpi accettati verificati; 7 errori sulle esclusioni |
| Responsive | 3 campioni senza overflow orizzontale; non matrice visuale completa |
| Backup | CRC e SHA-256 di 548 file dopo estrazione superati |
| Invii/DB dati clienti/produzione | Non eseguiti |
| Pen test, WCAG, native review, CWV campo, restore DB/storage | Non certificati |

La prima validazione di chiusura delle regressioni ha registrato 120 passati, 5 saltati e un fallimento: il controllo completo dell’HTML idratato raccoglieva 404 delle immagini perché l’handler isolato non inoltrava `/api/historical-media/` al gateway API. Non era una prova di perdita delle fotografie archiviate. È stato aggiunto un router **solo per test**, limitato a GET/HEAD di nomi immagine immutabili SHA-256, senza inoltro di login, lead o file privati. La prova HTTP del collegamento ha restituito 200 con hash esatto e confermato che la sessione privata non viene inoltrata. L’esito dell’ulteriore validazione completa è registrato separatamente nel controllo finale del task, non dedotto da questa prova puntuale.

Richieste HTTP in sola lettura registrate:

| Percorso | Status | Content-Type |
|---|---:|---|
| / | 200 | text/html; charset=utf-8 |
| /robots.txt | 200 | text/plain |
| /sitemap.xml | 200 | text/html |
| /api/healthz | 200 | application/json; charset=utf-8 |
| /api/internal/session | 401 | application/json; charset=utf-8 |
| /audit-route-non-esistente-2026/ | 404 | text/html; charset=utf-8 |

## 11. Piano prioritario e criteri di chiusura

P0 = blocco al rilascio; P1 = necessario per affidabilità/sicurezza operativa; P2 = qualità professionale e ottimizzazione. Non sono punteggi CVSS.

| ID | Priorità | Mancanza | Quando si considera risolta |
|---|---|---|---|
| SEC-01 | P0 | Dipendenze vulnerabili | Aggiornare il grafo compatibile; rieseguire scansioni e controlli API; valutare separatamente tool di sviluppo e percorsi vulnerabili realmente usati. |
| PRIV-01 | P0 | Informativa e raccolta dati da approvare | Definire titolare, basi giuridiche, finalità, tempi, fornitori e diritti; pubblicare e collegare le informative approvate. Non dedurre l’approvazione legale da flag di configurazione. |
| CONT-01 | P0 | Migrazione non certificabile come integrale | Riconciliare fonti/candidati ed eccezioni, decisioni sui translation-ok e feed; conservare originali e approvazioni senza riscritture autonome. |
| SEO-01 | P0 | Sitemap diversa fra anteprima e handler preparato | Allineare il delivery scelto per il rilascio; verificare XML e Content-Type dell’endpoint reale, evitando fallback alla shell SPA. |
| SEO-02 | P0 | Dominio, bozze e indicizzazione da governare al rilascio | Configurare l’origine definitiva e tutti gli URL social/canonical; rimuovere host estranei dalla shell. Attivare l’indicizzazione solo dopo approvazione esplicita e soltanto per edizioni pubblicabili. |
| SEC-02 | P1 | Origini API troppo permissive | Usare allowlist esatta delle origini autorizzate e verificare protezione delle scritture autenticate contro richieste cross-site; il test non dimostra un’esfiltrazione. |
| SEC-03 | P1 | Difese operative API da rafforzare | Limitatore condiviso con TTL e limiti espliciti, revisione trust proxy, header al server/edge definitivo. La mancanza di HSTS su HTTP locale non prova l’assenza al futuro terminatore TLS. |
| UX-01 | P1 | Errori JavaScript sulle pagine escluse | Allineare rendering iniziale/client delle pagine escluse e verificare le sole route interessate; non ripubblicare il frammento storico senza decisione. |
| OPS-01 | P1 | Ripristino completo dati e storage non provato | Predisporre copie separate autorizzate, retention, versionamento, RPO/RTO e una prova di ripristino DB/storage con dati protetti. |
| OPS-02 | P1 | Consegna richieste e notifiche non certificata | Provare in ambiente controllato form→DB→una sola notifica, retry e recupero dopo interruzione; verificare canali mail e recapiti senza contattare clienti. |
| SEO-03 | P2 | Metadati e accessibilità editoriale da rifinire | Separare duplicazioni intenzionali di revisione, immagini decorative e informative; correggere le edizioni pubblicabili con revisione, senza alterare silenziosamente gli originali. |
| PRO-01 | P2 | Prove aziendali e qualità professionale da completare | Completare dati societari verificati, contatti e tempi di risposta, portfolio autorizzato, garanzie prudenti, accessibilità e misure reali di prestazione. |

Ogni riga ha una prova verificabile richiesta: un flag, uno screenshot isolato o la vecchia pubblicazione non sostituiscono l’approvazione. Non ripetere invii di moduli a clienti per collaudare il servizio.

## 12. Consegna e decisione finale

- Backup ZIP immutabile con manifest e SHA-256; rapporto HTML autonomo; cartella documentale versionabile; pacchetto audit con evidenze dei controlli.
- La chiusura del task significa **backup e audit consegnati**, non “sito pronto” né “migrazione fedele certificata”.
- Nessuna pubblicazione, cambio dominio, apertura ai motori, invio reale o modifica di dati produttivi è stata eseguita.

## Integrazione editoriale successiva

L’area interna dispone ora di **Articoli** e **Lingue**, con revisioni persistenti, fonti consultabili, confronto e approvazioni legate alle impronte esatte. La lettura pubblica runtime è distinta dalle bozze e conserva i blocchi di rilascio: attivare una revisione non distribuisce il sito né lo rende indicizzabile.

Guida italiana: `docs/editorial/GUIDA.html`. Migrazione, prerequisiti e recupero: `docs/editorial/MIGRAZIONE.md`. Risultati e limiti dei controlli: `docs/editorial/VERIFICHE.md`.

Questa integrazione non chiude le eccezioni storiche, legali, di contenuto o di rilascio elencate nell’audit.
