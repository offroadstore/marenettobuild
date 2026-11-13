# Runtime GA4 su origine dedicata

Preparazione tecnica, **non autorizzazione a pubblicare o cambiare DNS**.
Nessun dominio reale è stato scelto o configurato. Le prove simulate non
certificano ricezione Google né compatibilità del tag reale.

## Confine di sicurezza

Questo processo è distinto dal sito e dalla console: non avvia Express, Clerk,
database, proxy o API. Il dominio registrabile deve essere diverso da quello
del sito (controllato tramite Public Suffix List, inclusi suffix privati).
Un sottodominio del sito non è ammesso, poiché potrebbe ricevere cookie
`Domain` della console. Riservare il dominio del runtime esclusivamente a
questa funzione: nessun login, altra app, segreto Google o cookie autenticato.

L'iframe ha `allow-scripts allow-same-origin`, ma la sua origine è realmente
distinta dal sito: non è `srcdoc`. Non può leggere DOM/storage del sito o
installarvi timer. Non sono consentiti popup, form, navigazione del top o
iframe ulteriori. La CSP HTTP consente script solo dalla propria origine e
da GTM (solo loader GA4), rete solo verso gli host analytics specificati e
embedding soltanto dall'origine del sito approvata.

Il runtime viene richiesto soltanto dopo consenso esplicito. Il messaggio di
inizializzazione è verificato per finestra e origine del parent fissata dal
server; gli eventi richiedono anche una capacità casuale specifica del frame.
Non riceve URL completi, query/hash, recapiti, ricevute o credenziali.
Il bridge cookie espone solo `_ga` e `_ga_<ID>`, con valore limitato;
il sito fissa host-only, percorso e durata. Nessun aggiramento di blocchi
del browser o di rifiuti del consenso.

## Preparare i file, senza deployment

Dalla workspace: `pnpm --filter @workspace/marenetto-build run build:analytics-runtime`.
L'output ignorato da Git è `generated-artifacts/monitoring/dedicated-runtime/`.
Contiene `server.mjs`, `client.js`, questa guida. Il server è bundle autonomo,
senza dipendenze da installare, per Node 22 o successivo.

Per l'eventuale deployment separato approvato, il solo comando di avvio è
`node server.mjs`, con `PORT` assegnata dall'ambiente. NON avviare il sito o
l'API sul dominio dedicato, né usare il dominio di preview come origine.
Il TLS deve essere terminato dall'host e il proxy deve preservare l'header
`Host` del dominio dedicato. Non fidarsi di `X-Forwarded-Host`.

## Parametri da confermare prima dell'attivazione

Nel processo runtime, impostare soltanto:

- `NODE_ENV=production`;
- `MARENETTO_ANALYTICS_ORIGIN`: origine HTTPS esatta del sito, senza slash finale;
- `MARENETTO_ANALYTICS_RUNTIME_ORIGIN`: origine HTTPS esatta del dominio dedicato;
- `MARENETTO_ANALYTICS_RUNTIME_APPROVED=true`: dominio dedicato controllato, senza login/cookie condivisi;
- `MARENETTO_ANALYTICS_PRIVACY_APPROVED=true`: informativa approvata;
- `MARENETTO_ANALYTICS_RELEASE_APPROVED=true`: autorizzazione distinta alla raccolta;
- `PORT`: fornita dall'host.

Non copiare OAuth, database, Clerk, SMTP o altri Secrets nel processo runtime.
Origini e approvazioni devono corrispondere ai parametri nel server del sito.
Non impostare flag di approvazione per il solo fatto che il codice è pronto.

Senza parametri/approvazioni, in sviluppo, sull'Host errato o con un dominio
condiviso, ogni richiesta restituisce 404. Sono servite soltanto:

- `/_analytics-runtime/`: HTML senza tag Google preventivo;
- `/_analytics-runtime/runtime.js`: bootstrap controllato, che attende il consenso inoltrato dal parent;
- `/_analytics-runtime/health`: identità versione e due origini, senza credenziali.

Nessun altro percorso, query, metodo mutante, login o API è disponibile.
Il Titolare usa **Verifica flusso e runtime**: insieme alle API Google viene
controllato `/health`, senza cookie, senza redirect e con timeout.
La verifica è datata, vale 24 ore ed è invalidata da cambi di configurazione;
non certifica da sola la ricezione del tag reale.

## Collaudo ancora necessario

Gli esiti del test browser intercettato devono mostrare richiesta del loader,
eventi ricevuti, impossibilità di accesso al parent, esclusioni e revoca.
Sul dominio finale, soltanto dopo autorizzazione distinta, ripetere con GA4
reale e informativa approvata, includendo blocchi browser, Realtime/DebugView,
report differiti e Search Console. Non inoltrare eventi server-side per
eludere un blocco. Per emergenza spegnere la raccolta nella console:
la configurazione pubblica scade entro 60 secondi nelle pagine attive.
