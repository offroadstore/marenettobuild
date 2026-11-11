"""Build the final Italian readiness audit from recorded evidence, without changing the app."""
import base64
import datetime
import html
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / "generated-artifacts/production-audit-2026-11-11"
D = ROOT / "docs/production-readiness"
D.mkdir(parents=True, exist_ok=True)
load = lambda path: json.loads(path.read_text())
backup = load(E / "backup-summary.json")
tech = load(E / "technical-audit.json")
t = tech["summary"]
browser = load(ROOT / "generated-artifacts/migration-2026-11-11/playwright-inventory/results.json")
migration = load(ROOT / "artifacts/marenetto-build/docs/migrazione-storica/conteggi.json")
dep = load(E / "security-dependency.json")
sast = load(E / "security-sast.json")
privacy = load(E / "security-privacy.json")
responsive = load(E / "responsive-samples.json")
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
vulns = dep.get("result", {}).get("vulnerabilities", [])
security_counts = dep.get("result", {}).get("metadata", {}).get("vulnerabilities", {})
rank = {"critical": 0, "high": 1, "moderate": 2, "low": 3, "info": 4}
severe = sorted((v for v in vulns if v.get("severity", {}).get("level") in {"critical", "high"}),
                key=lambda v: rank[v["severity"]["level"]])
findings = [
    ("SEC-01", "P0", "Dipendenze vulnerabili", "1 critica e 8 alte su 24 segnalazioni; body-parser e proxy-addr sono dipendenze runtime di Express.", "Aggiornare il grafo compatibile; rieseguire scansioni e controlli API; valutare separatamente tool di sviluppo e percorsi vulnerabili realmente usati."),
    ("PRIV-01", "P0", "Informativa e raccolta dati da approvare", "Nessuna edizione privacy/cookie/termini trovata; checkbox privacy del modulo senza link a un’informativa dedicata.", "Definire titolare, basi giuridiche, finalità, tempi, fornitori e diritti; pubblicare e collegare le informative approvate. Non dedurre l’approvazione legale da flag di configurazione."),
    ("CONT-01", "P0", "Migrazione non certificabile come integrale", "266 fonti HTTP 200 confrontabili: 184 corpi esatti, 8 modifiche IT, 65 bozze straniere, 9 confronti falliti; altri 171 URL non confrontabili.", "Riconciliare fonti/candidati ed eccezioni, decisioni sui translation-ok e feed; conservare originali e approvazioni senza riscritture autonome."),
    ("SEO-01", "P0", "Sitemap diversa fra anteprima e handler preparato", "GET /sitemap.xml dell’anteprima restituisce HTML con status 200; il build contiene invece XML. Test SEO dell’handler preparato superati.", "Allineare il delivery scelto per il rilascio; verificare XML e Content-Type dell’endpoint reale, evitando fallback alla shell SPA."),
    ("SEO-02", "P0", "Dominio, bozze e indicizzazione da governare al rilascio", "1255 HTML noindex, robots Disallow, origine preview.invalid; shell base con host Replit preimpostato. Solo 4 edizioni ammissibili alla sitemap.", "Configurare l’origine definitiva e tutti gli URL social/canonical; rimuovere host estranei dalla shell. Attivare l’indicizzazione solo dopo approvazione esplicita e soltanto per edizioni pubblicabili."),
    ("SEC-02", "P1", "Origini API troppo permissive", "CORS riflette https://audit.invalid e consente credenziali; la sessione non autenticata resta correttamente 401.", "Usare allowlist esatta delle origini autorizzate e verificare protezione delle scritture autenticate contro richieste cross-site; il test non dimostra un’esfiltrazione."),
    ("SEC-03", "P1", "Difese operative API da rafforzare", "Limiter del modulo: 6 richieste/60s per IP, mappa in memoria; header CSP/nosniff/referrer/frame non emessi dal server locale osservato.", "Limitatore condiviso con TTL e limiti espliciti, revisione trust proxy, header al server/edge definitivo. La mancanza di HSTS su HTTP locale non prova l’assenza al futuro terminatore TLS."),
    ("UX-01", "P1", "Errori JavaScript sulle pagine escluse", "7 route linguistiche translation-ok producono errori di hydration e frame mentre rispondono 404.", "Allineare rendering iniziale/client delle pagine escluse e verificare le sole route interessate; non ripubblicare il frammento storico senza decisione."),
    ("OPS-01", "P1", "Ripristino completo dati e storage non provato", "Backup del codice e delle prove pubbliche verificato; database, utenti auth e allegati privati esclusi.", "Predisporre copie separate autorizzate, retention, versionamento, RPO/RTO e una prova di ripristino DB/storage con dati protetti."),
    ("OPS-02", "P1", "Consegna richieste e notifiche non certificata", "Persistenza, idempotenza e SMTP presenti nel codice; nessun invio reale o flusso completo autorizzato eseguito in questo audit.", "Provare in ambiente controllato form→DB→una sola notifica, retry e recupero dopo interruzione; verificare canali mail e recapiti senza contattare clienti."),
    ("SEO-03", "P2", "Metadati e accessibilità editoriale da rifinire", "114 description vuote, 173 gruppi di titoli duplicati e 554 occorrenze img senza attributo alt nel build, comprese copie/bozze.", "Separare duplicazioni intenzionali di revisione, immagini decorative e informative; correggere le edizioni pubblicabili con revisione, senza alterare silenziosamente gli originali."),
    ("PRO-01", "P2", "Prove aziendali e qualità professionale da completare", "Grafica fotografica e CTA presenti; non certificati identità legale, diritti, casi reali, credenziali, processi e prestazioni sul dominio finale.", "Completare dati societari verificati, contatti e tempi di risposta, portfolio autorizzato, garanzie prudenti, accessibilità e misure reali di prestazione."),
]
json_findings = [dict(zip(["id", "priority", "title", "evidence", "done_when"], row)) for row in findings]
security_table = "\n".join(
    f"| {v['severity']['level']} | {v['package']['name']} {v['package']['version']} | {v['id']} | {v.get('fix', {}).get('version', 'da verificare')} |"
    for v in severe)
finding_table = "\n".join(f"| {r[0]} | {r[1]} | {r[2]} | {r[4]} |" for r in findings)
response_table = "\n".join(
    f"| {row['path']} | {row['status']} | {row['headers'].get('content-type', 'n/d')} |"
    for row in t["responses"])
sast_result = sast.get("result", {})
privacy_result = privacy.get("result", {})
audit = f"""# Audit finale di preparazione alla produzione — Marenetto Build

Data UTC: {now}

## Verdetto

**NO-GO alla produzione nello stato verificato.** La chiusura di questo incarico consegna backup, audit, prove e piano di completamento; non certifica la migrazione integrale, non approva traduzioni/claim/diritti e non autorizza il rilascio.

Il mandato finale del titolare è stato eseguito come chiusura documentale con le carenze esplicite. Gli obiettivi originari non dimostrati restano nella checklist, non vengono dichiarati completati per effetto della chiusura del task.

## 1. Ambito e limiti

- Analisi del workspace, del server locale dell’anteprima e di {t['generatedHTMLPages']} documenti HTML generati; nessuna verifica del dominio di produzione attuale, DNS, certificato definitivo o dati produttivi.
- Riutilizzata la verifica Playwright di tutti i {browser['total']} URL inventariati, con hash del DOM e risposte indipendenti archiviate. Nessun nuovo invio al vecchio hosting e nessun modulo reale inviato.
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
| Backup | {backup['fileCount']} file estratti in cartella temporanea e verificati uno per uno contro SHA-256; CRC ZIP superato |

## 3. Contenuti: che cosa resta aperto

I 437 sono URL candidati/alias/feed/link, non 437 articoli o altrettante pagine uniche.

- 171 URL non hanno una risposta sorgente HTTP 200 confrontabile: 69 hanno risposto 404 e 102 hanno terminato con 429.
- Dei 102, 89 derivano dai redirect già configurati nel nuovo sito (non prova di esistenza storica), 9 sono feed e 4 link nei contenuti. `/contatos` è 404 nell’anteprima; `/contatti`, `/pt` e `/ru` sono disponibili con normalizzazione slash.
- Le nove eccezioni `/translation-ok/` e varianti linguistiche non sono trasferimenti integrali: la fonte archiviata conteneva frammenti di modulo incompleti. L’anteprima restituisce 410 alla radice e 404 alle otto varianti.
- I nove feed sono sospesi con 503 in attesa di conferma. Non vengono descritti come feed migrati funzionanti.
- Le 65 versioni straniere modificate restano bozze, non traduzioni approvate; lo stato delle chiavi non è prova di revisione linguistica.
- L’inventario di generazione ha {t['registeredEditions']} edizioni: {json.dumps(t['editionStates'], ensure_ascii=False)}. “Reviewed” o “translated” non estende automaticamente l’approvazione a nuove composizioni.
- Restano aperte differenze di struttura/link/metadati: {migration['fieldChecks']['openDifferences']} controlli atomici, non altrettante pagine rotte. I diff leggibili e i casi giustificati sono nel pacchetto storico.
- Servono una fonte CMS pubblica autorevole o altra conferma indipendente per chiudere le lacune; nessun contenuto assente è stato ricostruito con IA.

## 4. Sicurezza: esiti automatici

Audit dipendenze: {json.dumps(security_counts, ensure_ascii=False)}. Totale: {len(vulns)} segnalazioni, non necessariamente altrettanti pacchetti. Le segnalazioni non sono state corrette in questo incarico di audit.

SAST: stato {sast['status']}, incomplete={sast_result.get('incomplete')}, {len(sast_result.get('results', []))} rilievi. Privacy/dataflow: stato {privacy['status']}, {len(privacy_result.get('vulnerabilities', []))} rilievi. Zero rilievi in questi due strumenti non annulla le evidenze manuali.

| Severità scanner | Pacchetto installato | Identificatore | Versione correttiva segnalata |
|---|---|---|---|
{security_table}

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

- Origine attuale dei documenti generati: {t['manifestOrigin']}; indexing={t['manifestIndexing']}. È la protezione prevista per l’anteprima, non un errore da eliminare adesso.
- La shell base `index.html` contiene canonical/OG su un host Replit preimpostato, osservato anche nel fallback sitemap. Non è stato assunto come dominio produttivo valido: rimuovere/configurare prima del rilascio.
- 1255 HTML: title mancanti {t['missingTitle']}, canonical mancanti {t['missingCanonical']}, pagine senza H1 {t['noH1']}, H1 multipli {t['multipleH1']}.
- Description vuote: {t['missingDescription']}. Gruppi di titoli duplicati: {t['duplicateTitleGroups']}, compresi percorsi di bozza/revisione: non tutti sono problemi di duplicazione indicizzabile.
- Solo {t['eligibleSitemapEditions']} edizioni sono ammissibili alla sitemap secondo le approvazioni registrate. Non dichiarare 29 lingue pubblicabili né inventare hreflang equivalenti.
- JSON-LD non parsabile: {t['invalidStructuredData']}; JSON sintatticamente valido non implica idoneità a rich result o accuratezza dei claim.
- Occorrenze img prive di alt: {t['imagesMissingAltAttributeOccurrences']}, comprese copie di template/bozze. Distinguere immagini informative da decorative; alt vuoto intenzionale e attributo mancante non sono la stessa cosa.
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

Il maggiore bundle JS del build è {t['largestJS'][0]['bytes']:,} byte, gzip {t['largestJS'][0]['gzipBytes']:,} byte. È una misura statica del file, non il peso effettivo di ogni pagina e non un Core Web Vital. Valutare code splitting e caricamento cataloghi; preservare proporzioni e immagini originali, ottimizzando copie di delivery solo con prove.

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
{response_table}

## 11. Piano prioritario e criteri di chiusura

P0 = blocco al rilascio; P1 = necessario per affidabilità/sicurezza operativa; P2 = qualità professionale e ottimizzazione. Non sono punteggi CVSS.

| ID | Priorità | Mancanza | Quando si considera risolta |
|---|---|---|---|
{finding_table}

Ogni riga ha una prova verificabile richiesta: un flag, uno screenshot isolato o la vecchia pubblicazione non sostituiscono l’approvazione. Non ripetere invii di moduli a clienti per collaudare il servizio.

## 12. Consegna e decisione finale

- Backup ZIP immutabile con manifest e SHA-256; rapporto HTML autonomo; cartella documentale versionabile; pacchetto audit con evidenze dei controlli.
- La chiusura del task significa **backup e audit consegnati**, non “sito pronto” né “migrazione fedele certificata”.
- Nessuna pubblicazione, cambio dominio, apertura ai motori, invio reale o modifica di dati produttivi è stata eseguita.
"""
checklist = """# Checklist prima della produzione

## P0 — autorizzare il rilascio soltanto dopo queste prove

- [ ] Eliminare/mitigare con verifica tutte le dipendenze critiche/alte applicabili; rieseguire scansioni e test.
- [ ] Riconciliare l’inventario con fonti pubbliche/CMS autorevoli; decidere su translation-ok, feed e candidati non dimostrati.
- [ ] Approvare i testi italiani modificati e le vere edizioni straniere pubblicabili; non esporre bozze come traduzioni approvate.
- [ ] Approvare e collegare informativa privacy; verificare identità aziendale, fornitori, consenso ove necessario e diritti dei materiali.
- [ ] Scegliere il delivery di produzione che serve corpo/H1/meta iniziali, status corretti e sitemap XML reale.
- [ ] Configurare dominio definitivo e rimuovere host di preview/Replit dalla SEO di produzione.
- [ ] Conservare i blocchi dell’anteprima; attivare l’indicizzazione soltanto sul dominio definitivo dopo via libera esplicito.

## P1 — affidabilità e protezioni

- [ ] Limitare CORS alle origini autorizzate e verificare scritture autenticate cross-site.
- [ ] Verificare proxy, HTTPS e header CSP/nosniff/referrer/frame/HSTS sul vero edge; niente test distruttivi.
- [ ] Rate limit condiviso, TTL e soglie di abuso; protezione upload con firme dei file/quarantena secondo il rischio.
- [ ] Eliminare gli errori di hydration delle pagine escluse senza ripubblicare automaticamente le fonti incomprensibili.
- [ ] Provare in ambiente controllato richiesta→DB→notifica unica→gestione interna, retry e recupero dopo interruzione.
- [ ] Verificare MFA, recupero account e ruoli; separare utenti sviluppo e produzione.
- [ ] Backup autorizzati di DB e allegati privati, retention e prova di restore; definire RPO/RTO misurati.
- [ ] Monitoraggio/API readiness/SMTP/storage, allarmi e responsabile operativo.

## P2 — presentazione professionale

- [ ] Portfolio e testimonianze reali con consensi, credenziali e claim verificati.
- [ ] Metadati delle sole pagine pubblicabili, alt semantici, link interni e canonical/equivalenti reali.
- [ ] Tastiera, focus, screen reader e contrasto; CTA mobili non devono coprire contenuti/input.
- [ ] Core Web Vitals e performance su dispositivo reale/rete lenta; ottimizzare senza redesign o sostituzioni fotografiche.
- [ ] Chiarire o isolare demo e aree di revisione; definire tempi di risposta e assistenza commerciale.

## Ultimo controllo, senza pubblicazione automatica

- [ ] Operatore identificato e approvazione del titolare su data/ambito del rilascio.
- [ ] Verifica HTTP di tutte le pagine pubblicabili sul dominio finale; robots/sitemap/canonical/hreflang coerenti.
- [ ] Piano di rollback e controlli dopo rilascio. Non eseguire questa fase nel task di audit.
"""
backup_doc = f"""# Backup e procedura di ripristino

## Copia consegnata

- File: {backup['file']}
- Data UTC: {backup['createdAt']}
- Dimensione ZIP: {backup['zipBytes']} byte.
- SHA-256: `{backup['sha256']}`
- File verificati dopo estrazione: {backup['fileCount']}.
- HEAD di riferimento: {backup['gitHEAD']}; il manifest per file identifica anche lo stato del workspace copiato, non si presume che il solo commit includa ogni modifica.

## Contenuto e confini

source/ contiene codice, librerie condivise, risorse pubbliche versionate, configurazioni non riservate e documentazione disponibili al momento della copia. reference/ contiene l’archivio indipendente delle fonti e delle prove storiche già consegnato.

Le sezioni userenv di .replit sono eliminate dalla copia: nessuna lista di persone invitate o valore di approvazione viene ripristinato automaticamente. Sono esclusi segreti/.env, dati database, utenti auth, allegati privati, dipendenze installate, build/cache e cronologia Git. Questo è un backup del codice e delle evidenze pubbliche, non del servizio completo.

## Verifica effettuata

CRC del contenitore ZIP e SHA-256 di ogni file confrontati dopo estrazione in cartella temporanea separata: superati per {backup['fileCount']} file. Nessun file del progetto originale è stato sovrascritto.

Non sono stati eseguiti avvio completo dell’app ripristinata, restore DB, restore provider auth o restore dei bucket privati. La copia può ricostruire i file, ma non dimostra da sola il recupero di richieste clienti o account.

## Ripristino controllato

1. Verificare lo SHA-256 del ZIP e conservare una copia immutabile.
2. Estrarre in una cartella vuota; confrontare i file con MANIFEST.json.
3. Ricreare segreti e configurazioni utente tramite i gestori sicuri, senza inserirli nei file del backup.
4. Installare il lockfile con pnpm install --frozen-lockfile; ripristinare separatamente i dati solo da copie autorizzate.
5. Non lanciare automaticamente push/migrazioni DB; verificare lo schema rispetto ai dati di destinazione.
6. Eseguire typecheck, build, test SEO/permessi, verifica storage e un flusso controllato di richiesta.
7. Tenere noindex e disallow finché il titolare non autorizza esplicitamente il rilascio.

## Backup del rapporto

Il backup principale è una fotografia antecedente alla consegna del nuovo audit. Gli aggiornamenti documentali e le nuove evidenze sono nel pacchetto audit separato; non si sovrascrive il backup già verificato per aggiungerli.

Per ricomporre anche gli aggiornamenti successivi alla fotografia, il pacchetto audit contiene aggiornamenti-audit/ con gli stessi percorsi relativi alla root e documenti/ con i rapporti. Applicarli soltanto dopo il controllo della copia di base, in un ambiente separato. Il router aggiunto è esclusivamente per la suite di test e richiede l’API locale dell’anteprima per le immagini pubbliche.
"""
for filename, text in [("AUDIT_FINALE.md", audit), ("CHECKLIST_PRODUZIONE.md", checklist), ("BACKUP_E_RIPRISTINO.md", backup_doc)]:
    (D / filename).write_text(text)
(D / "rilievi.json").write_text(json.dumps({"createdAt": now, "verdict": "NO-GO", "taskClosureMeaning": "backup and audit delivered; not production or migration certification", "findings": json_findings}, ensure_ascii=False, indent=2))

def inline(text):
    text = html.escape(text)
    text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", text)
    return re.sub(r"`(.*?)`", r"<code>\1</code>", text)

def render(text):
    result = []
    table, listing = False, False
    for line in text.splitlines():
        if not line.strip():
            if listing:
                result.append("</ul>")
                listing = False
            if table:
                result.append("</tbody></table></div>")
                table = False
            continue
        if line.startswith("|"):
            cells = [cell.strip() for cell in line.strip("|").split("|")]
            if all(re.fullmatch(r"[-: ]+", cell) for cell in cells):
                continue
            if not table:
                result.append("<div class='scroll'><table><tbody>")
                table = True
            result.append("<tr>" + "".join("<td>" + inline(cell) + "</td>" for cell in cells) + "</tr>")
        elif line.startswith("#"):
            depth = len(line) - len(line.lstrip("#"))
            result.append(f"<h{depth}>{inline(line[depth:].strip())}</h{depth}>")
        elif line.startswith("- "):
            if not listing:
                result.append("<ul>")
                listing = True
            result.append("<li>" + inline(line[2:]) + "</li>")
        else:
            result.append("<p>" + inline(line) + "</p>")
    if listing:
        result.append("</ul>")
    if table:
        result.append("</tbody></table></div>")
    return "\n".join(result)

photo = base64.b64encode((E / "mobile-home.jpg").read_bytes()).decode()
document = f"""<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Marenetto Build — audit e backup di produzione</title><style>
body{{margin:0;background:#f1f4f5;color:#18323d;font:16px/1.6 system-ui,sans-serif}}main{{max-width:1160px;margin:auto;padding:32px 20px}}h1{{font-size:clamp(28px,4vw,42px);line-height:1.2}}h2{{margin-top:42px}}table{{border-collapse:collapse;background:white;width:100%}}td{{padding:11px;border:1px solid #dbe2e5;vertical-align:top}}tr:first-child{{font-weight:700;background:#e4edef}}.scroll{{overflow:auto}}.notice{{padding:20px;background:#fff0d5;border-left:5px solid #9a6100}}code{{font-size:.9em;overflow-wrap:anywhere}}details{{background:white;padding:20px;margin:20px 0}}summary{{font-weight:700;cursor:pointer}}img{{display:block;max-width:390px;width:100%;margin:auto}}@media print{{body{{background:white}}}}
</style><main><section class="notice"><strong>Chiusura documentale: backup e audit consegnati.</strong><br>Il sito non è dichiarato pronto alla produzione. Nessuna pubblicazione o indicizzazione è stata effettuata.</section>{render(audit)}<details><summary>Checklist di produzione</summary>{render(checklist)}</details><details><summary>Backup: integrità, esclusioni e ripristino</summary>{render(backup_doc)}</details><details><summary>Campione visivo mobile, non certificazione responsive completa</summary><img alt="Home Marenetto Build a 390 per 844 pixel" src="data:image/jpeg;base64,{photo}"></details></main></html>"""
(E / "Audit-finale-Marenetto-Build.html").write_text(document)
bundle = E / "Marenetto-audit-produzione-2026-11-11.zip"
with zipfile.ZipFile(bundle, "w", zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(D.iterdir()):
        if file.is_file():
            archive.write(file, "documenti/" + file.name)
    for file in sorted(E.iterdir()):
        if file.is_file() and file.suffix in {".json", ".log", ".html", ".jpg"}:
            archive.write(file, "evidenze/" + file.name)
    for file in [ROOT / "generated-artifacts/migration-2026-11-11/playwright-inventory/report.md",
                 ROOT / "generated-artifacts/migration-2026-11-11/playwright-inventory/routes.csv"]:
        archive.write(file, "controllo-storico/" + file.name)
    for relative in [
        "scripts/backup-public-project.py", "scripts/audit-production-readiness.mjs",
        "scripts/build-production-audit.py",
        "artifacts/marenetto-build/tests/source-fixtures.ts",
        "artifacts/marenetto-build/tests/home-brand.spec.ts",
        "artifacts/marenetto-build/tests/migration-routes.spec.ts",
        "artifacts/marenetto-build/tests/serve-preview.mjs",
        "artifacts/marenetto-build/playwright.config.ts",
        "artifacts/marenetto-build/docs/migrazione-storica/08-secondo-controllo.md",
        "artifacts/marenetto-build/docs/migrazione-storica/10-relazione-finale.md",
        "artifacts/marenetto-build/docs/migrazione-storica/README.md",
        "artifacts/marenetto-build/RESTORATION_STATUS.md", "replit.md",
    ]:
        archive.write(ROOT / relative, "aggiornamenti-audit/" + relative)
print(json.dumps({"report": str((E / "Audit-finale-Marenetto-Build.html").relative_to(ROOT)), "bundle": str(bundle.relative_to(ROOT)), "verdict": "NO-GO", "findings": len(findings)}, ensure_ascii=False))
