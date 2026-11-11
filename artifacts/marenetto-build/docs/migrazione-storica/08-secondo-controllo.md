# Risultati del secondo controllo

## Aggiornamento conclusivo

Il controllo successivo registrato in `Verifica-browser-contenuti.md` ha raggiunto **437/437 URL**, senza errori di navigazione: **257/257 corpi accettati** corrispondono alla risposta realmente servita, di cui 184 esatti rispetto alla fonte e 73 con variazioni registrate (8 italiane autorizzate e 65 bozze straniere). Restano 9 fallimenti del confronto e 171 fonti non confrontabili; sette pagine escluse producono errori di hydration. Non si certifica la migrazione integrale.

La chiusura documentale con backup, audit sicurezza/SEO e checklist è in `../../../../docs/production-readiness/AUDIT_FINALE.md`. I dati sotto descrivono **solo il primo passaggio parziale**, conservato come baseline: non sono il totale aggiornato della copertura browser.

## Baseline del primo passaggio

Il secondo controllo indipendente è PARZIALE: 210 URL con osservazioni salvate su 437.

Categorie registrate: {"different-or-foreign-draft":133,"exact":70,"authorized-italian-unverified-text-pairs":7,"non verificato":227}. I sette casi autorizzati hanno solo corrispondenza di percorso registrata nel browser: le sostituzioni testuali non sono state dimostrate da quel passaggio. I 133 casi «different-or-foreign-draft» restano da approfondire; non sono automaticamente 133 regressioni confermate.

Il controllo ha incontrato un limite di 45 secondi per esecuzione con perdita dello stato temporaneo. I gruppi ambigui o non raggiunti rimangono non verificati. Non è stata avviata una seconda passata completa per produrre un esito positivo presunto. Le fonti sono le risposte pubbliche indipendenti, non i cataloghi del generatore.

Registro integrale: browser.json e report.md nel pacchetto. Il passaggio ha preceduto il riallineamento delle due etichette recensioni e il trasferimento delle immagini; queste modifiche sono poi confermate via HTTP e hash, non da un'altra prova browser completa.

Il workflow di regressione preesistente ha terminato con 121 test superati e 5 saltati: verifica anche l'idratazione degli URL esposti, ma confronta in parte i dati del generatore e NON sostituisce il confronto indipendente storico.

Evidenze visive aggiuntive: baseline desktop 1440×1000, home smartphone 390×844 e pagina RTL su tablet 768×1024. La matrice completa di famiglie × viewport, WebKit/iOS e screen reader reali non è certificata. Nessun modulo reale inviato.
