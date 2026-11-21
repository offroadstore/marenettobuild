# Marenetto Build — verifica per la messa online

**Ultimo aggiornamento: 21 novembre 2026. Rilascio non certificato.** Questo registro distingue le prove raccolte sulla PR isolata dalle risposte dell'installazione già pubblicata. `KO` comprende una verifica fallita o non ancora superata; non equivale a un giudizio sul prodotto finito.

## Aggiornamento dominio e indicizzazione — 21 novembre 2026

Le prove seguenti riguardano la produzione **prima della pubblicazione delle nuove correzioni**. Non certificano il candidato come già online. Grafica, immagini, logo e testi visibili restano invariati.

### Risposte effettive della produzione

```sh
curl -sSI -o /dev/null -w 'HTTP=%{http_code} TLS_verify=%{ssl_verify_result}\n' \
  https://www.marenettobuild.com/
# HTTP=200 TLS_verify=0

curl -sSI https://marenettobuild.com/
# HTTP/2 200                    <-- redirect WWW ancora assente online

curl -sSI http://marenettobuild.com/
# HTTP/1.1 301 Moved Permanently
# Location: https://marenettobuild.com:443/

curl -sSI http://www.marenettobuild.com/
# HTTP/1.1 301 Moved Permanently
# Location: https://www.marenettobuild.com:443/

curl -sSI https://www.marenettobuild.com/sitemap.xml
# HTTP/2 200
# content-type: application/xml
```

- **DNS/TLS WWW:** il certificato è valido, senza `curl -k`. WWW compare anche nei domini della pubblicazione: non occorre inventare o sostituire record DNS.
- **Catena HTTP:** il primo `301` HTTP→HTTPS è emesso dall'infrastruttura, prima del processo applicativo. Il codice può comporre HTTPS, WWW e alias storico in un solo `308` applicativo, ma non può sostituire il primo `301` della piattaforma. Per il requisito rigoroso di un solo salto da `http://marenettobuild.com`, occorre un inoltro HTTP all'edge/provider direttamente verso HTTPS WWW che mantenga percorso e query. Un semplice record A/CNAME non realizza un redirect HTTP. L'apertura all'indicizzazione resta subordinata alla verifica di questo punto.
- **Sitemap online:** XML corretto come MIME ma solo 102 URL, origine di anteprima e `x-default` assente. Non confondere la disponibilità del file con la correttezza del contenuto.
- **Lingue escluse:** `HEAD https://www.marenettobuild.com/{lingua}/` restituisce **404** per tutte e 17: `ro, uk, cs, sk, sl, hr, sr, bg, bs, mk, be, ar, he, fi, hu, el, tr`. La precedente nota su `/ar/` a 200 è superata.
- **URL storici:** `curl -sSI https://www.marenettobuild.com/en/chi-siamo` dà **308**, `Location: /en/chi-siamo/`. `/chi-siamo/` e `/contatti/` danno **200** perché sono già gli URL canonici mantenuti, non pagine cancellate da mandare altrove. Un articolo storico campione in ciascuna delle nove lingue `it, en, fr, de, nl, es, pt, ru, pl` dà **200**, nessun 404. Non creare redirect verso lo stesso URL; gli alias che hanno una destinazione diversa mantengono `308`.
- **HSTS online:** due campi identici su sito e API. Rimosso nel candidato il duplicato applicativo di produzione; si conserva quello della terminazione HTTPS Replit. La presenza di un solo campo va confermata dopo Publish.
- **Secret di produzione:** controllo esclusivamente dei nomi: `ALLOWED_ORIGINS` e `PROJECT_REQUEST_IP_SALT` **non risultano presenti**. Nessun valore letto o stampato. `ALLOWED_ORIGINS` deve essere `https://www.marenettobuild.com,https://marenettobuild.com`.

### Modifiche candidate e ordine del rilascio

1. Primo Publish: redirect applicativo `308` verso WWW (compresa normalizzazione degli alias nello stesso salto), origine canonica `https://www.marenettobuild.com`, rimozione HSTS duplicato. Nessuna apertura automatica dell'indicizzazione.
2. Verificare nuovamente i quattro ingressi HTTP/HTTPS con `curl -I`, quindi risolvere il primo salto HTTP all'edge se resta quello sopra. Non dichiarare completato il requisito «senza catene» finché la produzione non lo prova.
3. Solo dopo quella verifica abilitare in produzione `MARENETTO_PUBLIC_INDEXING=true` e ripubblicare. La guardia applicativa richiede anche processo di produzione e host WWW esatto: apice, dominio Replit, sviluppo, demo, API, revisione e pagine di errore restano `noindex`. Il `robots.txt` di anteprima resta `Disallow: /` nonostante il file sorgente predisposto per il rilascio.
4. A guardia aperta, il server genera la sitemap XML delle edizioni effettivamente servite nelle 12 lingue autorizzate, con URL WWW, alternati reciproci e `x-default` italiano. L'inventario candidato contiene **350 URL**, tutti con `x-default` italiano; l'alias `/en/articoli/` dà un unico `308` verso `/en/articles/`, senza duplicarlo nella sitemap. Sono esclusi ricerca, revisioni, pagine indisponibili e articoli ritirati. Se lo stato editoriale non è verificabile, la sitemap risponde 503, non ripubblica un inventario statico superato.
5. Ripetere in produzione le prove di meta robots e `X-Robots-Tag` per pagine pubbliche e private, sitemap, alternati, errori e tutte le lingue escluse. La modifica dei metadati è applicata anche dopo l'idratazione e la navigazione del client.

**Verifica del candidato, non di produzione:** build e typecheck riusciti; `test:seo` **16 passati**, `test:i18n` **9 passati**, `test:routes` **161 passati e 7 saltati, nessun fallimento**; anti-spam API **6 passati**. I quattro nuovi test SEO controllano il server effettivo: guardia di rilascio, redirect composti, sitemap con reciproci e `x-default` su tutti i 350 URL, separazione anteprima/produzione, 404 delle lingue escluse e ritiro degli articoli anche con upstream indisponibile. Controllati inoltre i metadati dopo l'idratazione delle home nelle 12 lingue. Logo, favicon e relativi stili non presentano differenze rispetto alla base.

### Collaudo controllato del modulo — preparato, non inviato

Destinatario richiesto: **info@marenettobuild.com**, mediante il percorso applicativo e SMTP Aruba già configurato; nome «Collaudo autorizzato», messaggio «Prova tecnica autorizzata del modulo Marenetto Build; non è una richiesta commerciale». Oggetto previsto dal sistema: `Nuova richiesta MB-…`. Un'unica chiave di idempotenza, un solo invio; eventuale ritentativo deve riutilizzare la stessa chiave.

Prima dell'invio: conferma esplicita del titolare, salt presente, modalità reale approvata, configurazione SMTP completa e destinatario corrispondente a quello richiesto. Non modificare in blocco i flag di privacy/fornitori per aggirare il blocco. Registrare ora Europe/Rome, HTTP 201, una sola richiesta salvata e una sola notifica; poi verificare la ricezione di **una sola email** nella casella. Lo stato SMTP `sent` da solo non prova la consegna in posta in arrivo. Nessun messaggio è stato inviato durante queste verifiche.

**Autorizzazione ricevuta:** il titolare ha approvato espressamente sia l'uso di `info@marenettobuild.com` per tutte le notifiche successive, sia un unico invio di collaudo. L'autorizzazione resta valida, ma non sostituisce i prerequisiti tecnici.

**Configurazione aggiornata:** `ARUBA_SMTP_TO` è stato impostato a `info@marenettobuild.com` nelle variabili condivise. Il controllo della configurazione effettiva per l'ambiente di produzione conferma il destinatario richiesto; questo non attesta che il processo già pubblicato abbia ricaricato il nuovo valore, che va recepito con una nuova pubblicazione. I tre flag della modalità reale risultano già abilitati e non sono stati modificati. La password Aruba risulta presente. Il controllo dei soli nomi conferma invece che `PROJECT_REQUEST_IP_SALT` e `ALLOWED_ORIGINS` non risultano presenti per la produzione: **collaudo sospeso, nessun POST del modulo e nessuna email inviati**. Aggiungere i valori tramite Secrets, ripubblicare e verificare nuovamente la configurazione prima dell'unico invio autorizzato. Non aggirare la protezione anti-spam con valori temporanei o con l'honeypot.

| Voce | Esito | Prova o verifica ancora necessaria |
| --- | --- | --- |
| Autorizzazione del titolare | OK | [Decisione del 18 novembre](AUTORIZZAZIONE_RILASCIO_2026-11-18.md): merge condizionato ai test, WWW canonico, 12 lingue e GA4 subordinato al consenso. Per le nuove informative resta richiesta approvazione. |
| 1. PR #1: installazione, typecheck, build | OK | Base esaminata: `cc491b2`; candidato `00f608a` sul ramo `miglioramenti-sicurezza-logo-lingue`. `pnpm install` e `PORT=4288 BASE_PATH=/ pnpm run build` (include typecheck): uscita 0. Il controllo del corpo degli articoli confronta ora la lingua renderizzata; il build produce 864 documenti, incluse le bozze riservate alla revisione, e conserva `noindex`. |
| 1. PR #1: lingue | OK | `pnpm --filter @workspace/marenetto-build run test:i18n`: 9 passati, 0 falliti con la correzione e le asserzioni aggiornate alle equivalenze approvate. |
| 1. PR #1: SEO | OK | `pnpm --filter @workspace/marenetto-build run test:seo`: 12 passati, 0 falliti; il rapporto HTTP conta 864 documenti e 141 redirect. Controllati anche codici di errore, canonical e `noindex` nel candidato. |
| 1. PR #1: percorsi e merge | OK | `pnpm --filter @workspace/marenetto-build run test:routes`: 161 passati, 7 saltati, 0 falliti; verificati anche rendering e idratazione dell'inventario esposto. Il candidato testato `00f608a` è stato unito a `main` in `153964c` senza cambi all'albero dei file. Merge su GitHub, non pubblicazione. |
| 1. Dipendenze runtime del candidato | OK | `pnpm audit --prod --json`: prima 1 critica e 3 alte; dopo aggiornamento 0 critiche, 0 alte, 0 medie, 1 bassa (`fast-xml-parser`). Non è l'audit della versione online. |
| 1. Dipendenze di sviluppo | OK su `main` locale | Override `source-map-js` a `1.2.2` anche sotto `@tailwindcss/node`. `pnpm audit --json`: 0 critiche, 0 alte, 5 medie, 3 basse. |
| 1. CORS in produzione | Comportamento HTTP verificato | Dopo Publish, `GET /api/healthz` ha risposto 200 per tutte e tre le origini: nessun `Access-Control-Allow-Origin` per `https://external.example`; header identico all'origine per apice e WWW. `ALLOWED_ORIGINS` non risulta nella verifica per nome; il comportamento HTTP non prova che sia impostato. |
| 1. Header di sicurezza | Report-Only verificato online | `curl -I` su `/` e `/api/healthz`: 200, CSP Report-Only, `nosniff`, `strict-origin-when-cross-origin`, Permissions-Policy, `noindex, nofollow`; frame `SAMEORIGIN` sulla home e `DENY` sull'API. HSTS presente con due valori identici (`max-age=63072000; includeSubDomains`). Enforcement non attivato. |
| 1. Modulo: limite persistente e anti-spam | Anti-spam OK online; altri controlli sospesi | Tabella `project_request_attempts` presente in produzione. Honeypot e invio sotto 4 s: entrambi 201, nessuna nuova riga. Il salt non risulta configurato nella verifica per nome. Invio valido reale e verifica da due reti non ancora eseguiti. |
| 1. 2FA titolare | in attesa del titolare | App Clerk gestita da Replit, accesso al dashboard autorizzato. In Clerk **Produzione → Configure → User & authentication → Multi-factor** abilitare applicazione di autenticazione e codici di recupero, quindi registrare il secondo fattore sul profilo titolare e verificare un nuovo accesso. Non inviare codici di recupero. |
| 1. Indicizzazione aree riservate | API `noindex` verificata | Dopo Publish, `/api/healthz` espone `X-Robots-Tag: noindex, nofollow`. Non è un controllo degli accessi. |
| 1. Configurazione riservata | KO | Verificata la presenza per nome delle chiavi Clerk, della password SMTP e della configurazione storage/sessione, senza leggere i valori. Audit completo di codice, log e configurazione ancora da chiudere. |
| 2. Dominio WWW e redirect | TLS OK; redirect da pubblicare | Il 21 novembre WWW risponde 200 con certificato valido. L'apice resta 200: candidato `308` preparato. Primo salto HTTP emesso dall'edge da risolvere per il requisito senza catene. Dettagli e comandi nella sezione aggiornata sopra. |
| 2. URL storici, feed, origine e lingue escluse | 17 lingue OK; controlli storici parziali | Il 21 novembre tutte le 17 home escluse, inclusa `/ar/`, danno 404 su WWW. `/chi-siamo/`, `/contatti/` e gli articoli storici campione nelle nove lingue restano 200; `/en/chi-siamo` dà 308. La suite verifica inventario e alias, senza attestare l'elenco completo degli URL ancora presenti su Google. |
| 3. Google, sitemap, contenuti SSR, metadati e JSON-LD | KO | La produzione attuale risponde HTTP 200 a `/robots.txt` con `Disallow: /`; la home espone `noindex, nofollow`. Non aprire l'indicizzazione prima delle verifiche su WWW, inventario delle pagine, equivalenze, link e dati strutturati. |
| 4. Search Console, Business Profile e Bing | in attesa del titolare | In Search Console creare una proprietà **Dominio** `marenettobuild.com`: il valore del TXT è mostrato da Google nell'account. Dopo la verifica si potrà inviare la sitemap definitiva. In Business Profile verificare categorie, orari, foto reali e link recensioni; poi importare la proprietà in Bing Webmaster Tools. |
| 4. GA4 e social | KO | Ricezione degli eventi reali e isolamento per consenso non verificati sul dominio finale; profili social reali da confermare prima di collegarli. |
| 5. Privacy, cookie e prova SMTP | in attesa del titolare | Approvare le bozze italiane quando pronte, in particolare conservazione e fornitori. La prova di consegna alla casella non è stata eseguita. |
| 6. Copertura delle 12 lingue | KO | Il catalogo del candidato marca le 12 lingue richieste, ma il risultato non prova che tutte le pagine, i metadati, gli errori e le email siano interamente tradotti. |
| 7. Layout, accessibilità e prestazioni | KO | La build corretta segnala un chunk principale di circa 1.859 kB minificati (508 kB gzip). Misure Lighthouse/Core Web Vitals, accessibilità e viste alle cinque larghezze non certificate. |
| 8. Pubblicazione e verifica finale | Non certificata | Pubblicata la Fase 1 in Report-Only. Restano verifica sul WWW, invio reale, prova da due reti, CSP enforce, GA4, backup e prova di ripristino. |

### Nomi della configurazione riservata da verificare per la produzione

`DATABASE_URL` (gestito dalla piattaforma), `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `ARUBA_SMTP_PASSWORD`, `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`, `SESSION_SECRET`. La presenza non certifica che ciascun valore sia valido per la produzione.

### Fase 1 — pubblicazione in due passaggi

1. In **Publishing → Adjust settings → Production app secrets**, impostare `ALLOWED_ORIGINS` a `https://www.marenettobuild.com,https://marenettobuild.com` e impostare `PROJECT_REQUEST_IP_SALT` a un valore casuale e stabile (generare localmente con `openssl rand -hex 32`; non inviarlo in chat né committarlo). Impostare `MARENETTO_CSP_MODE=report-only`.
2. Pubblicare e applicare la differenza additiva con Publish, senza sovrascrivere i dati di produzione. Il confronto mostra solo `CREATE TABLE project_request_attempts` e due `CREATE INDEX`: nessuna rimozione, rinomina o sovrascrittura. Non cambiare i flag che controllano l'uso di dati reali e l'invio di email.
3. Sul dominio pubblico, verificare gli header come sotto e la console del browser su `/`, `/servizi`, `/impresa-edile-a-cefalu/`, `/richiesta` e `/internal` (incluso il flusso di accesso Clerk). GA4 resta separato: la policy del sito abilita soltanto l'origine HTTPS esatta del runtime isolato, quando configurata, non gli script Google nel sito principale.
4. Solo dopo la verifica Report-Only impostare `MARENETTO_CSP_MODE=enforce`, ripubblicare e ripetere le verifiche. Conservare in **`GO_LIVE.md`** le prove della revisione effettivamente servita prima del commit e push finale. Non trasformare i risultati locali in prove di produzione.

```sh
curl -sSI https://marenettobuild.com/
curl -sSI https://marenettobuild.com/api/healthz
for origin in https://external.example https://www.marenettobuild.com https://marenettobuild.com; do
  printf '\nOrigin: %s\n' "$origin"
  curl -sS -D - -o /dev/null -H "Origin: $origin" \
    https://marenettobuild.com/api/healthz |
    grep -Ei '^HTTP/|^Access-Control-Allow-Origin:|^Vary:'
done
```

Il test dell'origine WWW usa l'header `Origin` contro l'apice: non certifica TLS o disponibilità di `www.marenettobuild.com` (Fase 2). Il logo approvato, con tratto sottile e fascia BUILD.COM, è invariato.

La simulazione browser separata dalla release ha rilevato host variabili di Clerk Protect su `/internal`: la policy ammette solo il sottodominio del servizio, non `*.clerk.com`. Le segnalazioni relative a `i.replit.com` riguardano telemetria iniettata dalla piattaforma e non necessaria all'applicazione: non allargare la policy per farle sparire. Il vecchio snapshot editoriale eseguibile è sostituito da JSON non eseguibile nella nuova build.

### Prove dopo Publish — 19 novembre 2026 (Europe/Rome)

- **Database di produzione:** la query in sola lettura `SELECT to_regclass('public.project_request_attempts') IS NOT NULL` ha restituito `true`. La verifica di presenza per nome non ha confermato `PROJECT_REQUEST_IP_SALT`. Non è stato eseguito alcun invio con l'email del titolare: nessuna ora di invio reale e nessun esito 201/503 da attribuire a quella prova. Per certificare il flusso reale, verificare anche che non sia attiva la modalità sintetica; non attivare in blocco i flag di privacy, fornitori e test.
- **Anti-spam sul dominio pubblico:** POST honeypot alle **01:01:07.940 CET** e POST immediato alle **01:01:08.247 CET**, entrambi `201` con `status: received`. Lettura del database prima e dopo: richieste `1 → 1`, notifiche `0 → 0`, tentativi `0 → 0`. Zero richieste con le chiavi dei test o con data successiva alla lettura iniziale.
- **IP da reti indipendenti:** non verificato. Dopo la configurazione, eseguire invii validi distinti da Wi-Fi e rete mobile (Wi-Fi spento), registrare gli orari e verificare le due prenotazioni e gli hash senza esportarli. Due header simulati dalla stessa rete non sono una prova. Se gli hash coincidono, verificare la catena del proxy e correggere `trust proxy` prima dell'enforcement; non fidarsi di header inoltrati non verificati.
- **CSP sul dominio pubblico:** Chromium, home, `/servizi`, `/impresa-edile-a-cefalu/`, `/richiesta` e `/internal` da anonimo: tutti `200` con CSP Report-Only, nessun errore JavaScript. Uniche segnalazioni CSP: script e connessione a `i.replit.com`, telemetria di piattaforma lasciata intenzionalmente fuori dalla policy. Nei primi quattro documenti solo JSON-LD e JSON non eseguibili negli elementi `<script>` inline; nessuno in `/internal`. `script-src` non usa `'unsafe-inline'`. Se in futuro servisse uno script eseguibile inline, usare nonce o hash. Accesso autenticato non testato in questa sessione.
- **GA4 futuro:** mantenere la raccolta dietro consenso. Nella CSP del sito consentire in `frame-src` solo l'origine HTTPS esatta del runtime isolato; lì confermare `www.googletagmanager.com` per gli script e gli endpoint effettivi `*.google-analytics.com` e `*.analytics.google.com` prima dell'attivazione. Verificare richieste assenti prima del consenso e ricezione dopo consenso con enforcement attivo.
