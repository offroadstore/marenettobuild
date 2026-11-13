# Checklist prima della produzione

## P0 — autorizzare il rilascio soltanto dopo queste prove

- [ ] **Analytics e tracking BLOCCANTI per l’uscita da Framework360**: seguire `docs/monitoring/GUIDA.html`; distinguere implementato, configurato e collaudato, senza dichiarare operativo il solo codice.
- [ ] Configurare OAuth Google aziendale, autorizzare l’account del Titolare, scegliere proprietà reali e documentare la continuità (o assenza) con lo storico. Verifiche datate indipendenti per GA4 e Search Console.
- [ ] Confermare origine pubblica finale, autorizzazione raccolta, informativa/versione approvata e controlli nelle lingue servite; nessun dominio dedotto da preview o sito storico.
- [ ] Predisporre e autorizzare separatamente il runtime su un dominio registrabile distinto da sito/console, senza login, API o cookie condivisi; seguire `artifacts/marenetto-build/analytics-runtime/README.md`. Verificare Host, TLS, CSP e `/health`; nessun deployment o DNS è autorizzato dalla sola preparazione del codice.
- [ ] Confermare via API flusso web corrispondente a proprietà/ID/origine ed enhanced measurement spento; una sola installazione GA4, GTM non installato.
- [ ] Sul solo dominio autorizzato: test consenziente reale, ricezione evento/ora/percorso in GA4 Realtime/DebugView, pageview SPA senza doppioni, clic distinti da richiesta salvata; nessun dato personale/query/frammento nei payload.
- [ ] Verificare prima del consenso, rifiuto, revoca, cookie e navigazione SPA a login/console/demo/revisione: nessun nuovo invio Google. Provare stop del Titolare e configurazione non leggibile.
- [ ] Ricontrollare report elaborati GA4 dopo 24–48 ore e Search Console dopo 2–3 giorni con evidenze datate. Credenziali/proprietà, informative, dominio e prove reali restano **pendenti**, non sostituibili da fixture.
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
