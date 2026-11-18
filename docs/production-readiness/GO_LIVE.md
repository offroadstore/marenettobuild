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
| 1. CORS in produzione | Baseline OK; rilascio da verificare | `GET /api/healthz` su `https://marenettobuild.com` ha risposto 200 per tutte e tre le origini: nessun `Access-Control-Allow-Origin` per `https://external.example`; header identico all'origine per l'apice e per WWW. `ALLOWED_ORIGINS` non ancora presente nei secret di produzione. Ripetere sulla nuova revisione. |
| 1. Header di sicurezza | Report-Only da pubblicare | Baseline live `curl -I /`: 200, `SAMEORIGIN`, `strict-origin-when-cross-origin`, `camera=(), microphone=(), geolocation=()`, `nosniff`, HSTS `max-age=63072000; includeSubDomains`, `noindex, nofollow`; CSP assente. Baseline live `curl -I /api/healthz`: 200, `DENY`, `strict-origin-when-cross-origin`, `nosniff` e HSTS; CSP, Permissions-Policy e X-Robots-Tag assenti. |
| 1. Modulo: limite persistente e anti-spam | Test locali OK; produzione da verificare | Sei test HTTP con PostgreSQL di sviluppo isolato: successo senza scritture per honeypot e invio sotto 4 s, invio valido sintetico con una notifica interna, quote 5/10 min e 20/24 h, concorrenza, riavvio, hash, pulizia e header API. Nessuna email inviata. La tabella è presente in sviluppo ma non ancora in produzione. |
| 1. 2FA titolare | in attesa del titolare | App Clerk gestita da Replit, accesso al dashboard autorizzato. In Clerk **Produzione → Configure → User & authentication → Multi-factor** abilitare applicazione di autenticazione e codici di recupero, quindi registrare il secondo fattore sul profilo titolare e verificare un nuovo accesso. Non inviare codici di recupero. |
| 1. Indicizzazione aree riservate | KO | L'origine attuale invia `noindex, nofollow` per `/internal`, `/owner-demo` e `/__localization-review`; `/api/healthz` non espone `X-Robots-Tag`. `robots.txt` blocca globalmente; serviranno esclusioni esplicite prima del cambio. Robots non sostituisce il controllo degli accessi. |
| 1. Configurazione riservata | KO | Verificata la presenza per nome delle chiavi Clerk, della password SMTP e della configurazione storage/sessione, senza leggere i valori. Audit completo di codice, log e configurazione ancora da chiudere. |
| 2. Dominio WWW e redirect | in attesa del titolare | Replit riconosce l'apice come URL primario. `https://marenettobuild.com/` dà HTTP 200; `https://www.marenettobuild.com/` fallisce la negoziazione TLS. Il DNS di `www` risponde con CNAME verso l'apice. Aggiungere separatamente `www.marenettobuild.com` in **Replit → Publishing → Domains** e applicare solo i record mostrati per quell'host. Non modificare l'apice che risponde già. |
| 2. URL storici, feed, origine e lingue escluse | KO | In produzione `/translation-ok` dà HTTP 410; `/ar/` dà HTTP 200. Nel candidato il test HTTP verifica 404 per 51 percorsi pubblici (home, servizi e URL CMS per ciascuna delle 17 lingue bloccate) e mantiene le bozze nel percorso di revisione. Da verificare registro storico completo, feed, origini e comportamento su WWW. |
| 3. Google, sitemap, contenuti SSR, metadati e JSON-LD | KO | La produzione attuale risponde HTTP 200 a `/robots.txt` con `Disallow: /`; la home espone `noindex, nofollow`. Non aprire l'indicizzazione prima delle verifiche su WWW, inventario delle pagine, equivalenze, link e dati strutturati. |
| 4. Search Console, Business Profile e Bing | in attesa del titolare | In Search Console creare una proprietà **Dominio** `marenettobuild.com`: il valore del TXT è mostrato da Google nell'account. Dopo la verifica si potrà inviare la sitemap definitiva. In Business Profile verificare categorie, orari, foto reali e link recensioni; poi importare la proprietà in Bing Webmaster Tools. |
| 4. GA4 e social | KO | Ricezione degli eventi reali e isolamento per consenso non verificati sul dominio finale; profili social reali da confermare prima di collegarli. |
| 5. Privacy, cookie e prova SMTP | in attesa del titolare | Approvare le bozze italiane quando pronte, in particolare conservazione e fornitori. La prova di consegna alla casella non è stata eseguita. |
| 6. Copertura delle 12 lingue | KO | Il catalogo del candidato marca le 12 lingue richieste, ma il risultato non prova che tutte le pagine, i metadati, gli errori e le email siano interamente tradotti. |
| 7. Layout, accessibilità e prestazioni | KO | La build corretta segnala un chunk principale di circa 1.859 kB minificati (508 kB gzip). Misure Lighthouse/Core Web Vitals, accessibilità e viste alle cinque larghezze non certificate. |
| 8. Pubblicazione e verifica finale | KO | Nessuna nuova pubblicazione: restano verifica sul WWW, prove da dispositivi reali, email, GA4, backup e prova di ripristino. |

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
