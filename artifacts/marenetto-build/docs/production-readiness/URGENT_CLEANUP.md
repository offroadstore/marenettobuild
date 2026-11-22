# Pulizia urgente della pubblicazione

Verifiche del 23 novembre 2026, ora italiana. Nessuna pubblicazione, modifica
di secret, cambio dei flag di privacy o invio email.

## Produzione prima delle modifiche

Il dominio di produzione è stato ricavato dai metadati di pubblicazione.
Le richieste sono state eseguite sul dominio canonico
`https://www.marenettobuild.com`.

| Controllo | Riscontro |
| --- | --- |
| Home | HTTP 200; script aggiunto `https://i.replit.com/script.js` |
| Codice del progetto | Nessun riferimento allo script o chiamata a Umami nel codice eseguibile dell'app |
| Bundle pubblico caricato dalla home | Nessuna chiamata Umami né direttiva sourceMappingURL |
| Source map dello stesso bundle | HTTP 404 |
| `/llms.txt` | HTTP 404 |

Nella versione pubblicata la ricerca testuale aveva trovato quattro
occorrenze: tre nei dati public-suffix e una nel controllo dei domini di
anteprima. Il testo completo della richiesta impone di eliminarle anche se
non costituiscono tracking: il candidato ora usa una whitelist neutra.
La libreria dei domini rimane nel controllo di build e nell'API, non nel
browser. Nessuna stringa è stata offuscata per falsare la ricerca.

## Correzioni nel candidato

- Strumenti di anteprima, banner e overlay caricati soltanto in sviluppo,
  non durante le build e il prerendering di produzione.
- Source map esplicitamente disabilitate per le build Vite.
- Whitelist esplicita per gli host del sito e del runtime analytics;
  validazione dei domini registrabili in build e sul server. La lista del
  runtime è vuota finché non sarà confermato un dominio dedicato; non viene
  attivata la raccolta né modificato alcun flag di approvazione.
- Codice Clerk separato in un chunk identificabile, senza riscriverne le
  stringhe o modificarne il funzionamento.
- Controllo automatico dei file distribuiti: la build fallisce se trova
  impronte della piattaforma nel codice applicativo, tracker, strumenti di
  sviluppo, mappe, percorsi assoluti interni o nomi di configurazione nel client,
  con l'eccezione esplicita per le stringhe interne di Clerk.
- Rimossi il commento tecnico del template HTML e l'SDK connettori inutilizzato
  dalle dipendenze runtime della radice del workspace.
- Rifiuto HTTP 404 delle richieste `.map`, anche se un file viene copiato
  accidentalmente nella cartella pubblica.
- Creato `/llms.txt` con informazioni aziendali e contatti già approvati,
  senza introdurre indirizzi legali non verificati, progetti o recensioni.
- Consegna di `/llms.txt` con HTTP 200, tipo `text/plain`, senza redirect
  di lingua o dipendenza dalla disponibilità dell'archivio editoriale.
- Il file resta escluso dalla sitemap. Il noindex delle anteprime è conservato;
  sul dominio canonico, con il gate di indicizzazione già previsto dal
  progetto, il file non riceve X-Robots-Tag.
- Gli header Server e X-Powered-By vengono rimossi dalle risposte del processo
  web; l'API già disabilita X-Powered-By. I README tecnici degli asset non sono
  più serviti dal processo web in produzione.
- README della radice con installazione, build, due processi Node, reverse
  proxy, prerequisiti reali e limiti dell'adattatore di autenticazione storage.

## Prove sul candidato, non sulla nuova produzione

- `pnpm run typecheck`: superato per librerie, API, sito, sandbox e script.
- `PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build`:
  superata; controllo finale su 1122 risorse testuali.
- La prima esecuzione SEO ha superato 28 controlli su 29: l'unico errore era
  nella configurazione isolata di un test (import JSON duplicato a causa di
  attributi diversi), non nell'applicazione. Corretto l'harness e rieseguiti
  tutti i sette test della pulizia: 7/7, compresi consenso, revoca,
  minimizzazione eventi e whitelist. Gli altri 22 controlli SEO già superati
  non sono stati invalidati da questa correzione del solo test.
- `pnpm --filter @workspace/marenetto-build run test:i18n`: 9 test superati.
- Test HTTP sul server reale di produzione avviato localmente con API
  editoriale sintetica: file llms esatto, GET/HEAD, nessun redirect con
  Accept-Language tedesco, nessuna dipendenza dall'API indisponibile, noindex
  nelle anteprime e rifiuto delle mappe anche esistenti o richieste con
  estensione codificata.
- Anteprima gestita riavviata: `/llms.txt` HTTP 200 e `text/plain`;
  home mobile controllata a 390 × 844, nessun errore browser rilevato.
- Caricamento della home con il vero server di produzione e i nuovi bundle
  compilati, non Vite dev: HTTP 200, un H1, nessuna eccezione JavaScript.

## Ricerca completa richiesta su dist

```sh
rg -n -i 'replit|repl\.co|cartographer' artifacts/marenetto-build/dist
```

Output: **vuoto**. Codice di uscita 1, cioè nessuna corrispondenza.
Nessun file Clerk escluso dalla ricerca: in questa build non è stata
necessaria alcuna eccezione. Controprova sui byte di tutti i 1274 file: zero
corrispondenze. I nomi di configurazione rimasti nel client sono soltanto
quelli interni del chunk Clerk, preservati come richiesto.

## Passaggio obbligatorio nelle impostazioni di pubblicazione

La documentazione ufficiale descrive l'iniezione dello script al livello
del sistema di pubblicazione. La modifica non è effettuabile rimuovendo
un tag dal template dell'app.

1. Aprire **Publishing → Adjust settings**.
2. Disattivare **Enable analytics**.
3. Ripubblicare il candidato.
4. Verificare dall'esterno home, una pagina servizio e un articolo:
   nessun caricamento dello script `i.replit.com`, né richieste del relativo
   tracker. Verificare anche GET/HEAD di `/llms.txt` e 404 delle mappe.

Fonte consultata:
https://docs.replit.com/features/publishing/project-analytics

L'impostazione della piattaforma **non è stata modificata dall'agente**.
Non sono stati modificati il consenso né i flag del monitoraggio Google,
che è un sistema distinto e resta soggetto ai propri gate e alla whitelist.
Gli header eventualmente aggiunti dal proxy esterno dopo la risposta
applicativa non sono eliminabili dal codice Node a monte: non si certifica
la scomparsa di ogni impronta infrastrutturale.

La pulizia non va dichiarata completata sulla produzione prima di quel
passaggio e della verifica esterna. Recensioni Google e modulo chiamata non
sono implementati da questa consegna; vengono dopo, nell'ordine richiesto.
