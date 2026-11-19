# Marenetto Build — verifica per la messa online

**Aggiornamento del 19 novembre 2026. Rilascio non certificato.** Questo registro distingue le prove raccolte sulla PR isolata dalle risposte dell'installazione già pubblicata. `KO` comprende una verifica fallita o non ancora superata; non equivale a un giudizio sul prodotto finito.

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
| 2. Dominio WWW e redirect | in attesa del titolare | Replit riconosce l'apice come URL primario. `https://marenettobuild.com/` dà HTTP 200; `https://www.marenettobuild.com/` fallisce la negoziazione TLS. Il DNS di `www` risponde con CNAME verso l'apice. Aggiungere separatamente `www.marenettobuild.com` in **Replit → Publishing → Domains** e applicare solo i record mostrati per quell'host. Non modificare l'apice che risponde già. |
| 2. URL storici, feed, origine e lingue escluse | KO | In produzione `/translation-ok` dà HTTP 410; `/ar/` dà HTTP 200. Nel candidato il test HTTP verifica 404 per 51 percorsi pubblici (home, servizi e URL CMS per ciascuna delle 17 lingue bloccate) e mantiene le bozze nel percorso di revisione. Da verificare registro storico completo, feed, origini e comportamento su WWW. |
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
