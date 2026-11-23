# Verifica documentale dei provider — 23 novembre 2026

**Nessuna richiesta API reale eseguita. Nessuna chiave letta, mostrata o modificata per la verifica.**
Le pagine ufficiali sotto sono state consultate tramite ricerca/fetch documentale.
I limiti locali non sostituiscono quote, contratti, fatture o limiti di spesa dell'account.

## OpenAI

- [Web search](https://developers.openai.com/api/docs/guides/tools-web-search),
  [prezzi](https://developers.openai.com/api/docs/pricing),
  [modello](https://developers.openai.com/api/docs/models/gpt-6.2-astra),
  [parametri Responses](https://developers.openai.com/api/reference/cli/resources/responses/methods/create).
- Responses, `gpt-6.2-astra`, strumento `web_search`, contesto ricerca `low`,
  `max_tool_calls:1`, `max_output_tokens:4096` (comprende il ragionamento),
  `service_tier:default`, `store:false`. Richiesta nuova per ogni quesito:
  nessuna conversazione, background, codice, navigazione autonoma o retry SDK.
- Prezzo standard breve: input $8/M, output $40/M. Oltre 272k input:
  input $16/M e output $60/M. Ricerca $10/1000 chiamate, **più** contenuto
  ricerca conteggiato come input. Nessun credito gratuito o sconto ipotizzato.
- Limiti documentati: input massimo 922.000 token; contesto 1.050.000.
  Il limite totale strumenti si applica a tutti gli strumenti incorporati.
  Un solo strumento e una sola invocazione ammettono al massimo il passaggio
  prima e dopo lo strumento. Prenotazione molto prudente:
  `2 × (922000 × 16 + 4096 × 60) + 10000 = 30005520 micro-USD`
  **$30,00552 per domanda**. Due finestre complete, tariffa lunga, due interi
  budget output: sovrastima intenzionale, non previsione di spesa effettiva.
- La risposta non dimostra separatamente ogni costo del contesto ricerca:
  **la prenotazione resta trattenuta anche dopo un esito valido**. Non
  chiamare quella somma “spesa riconciliata”. Quote account/modello possono
  produrre errori; non vengono riprovati a pagamento.
- Attribuzione: il cruscotto non riproduce risposte integrali, conserva solo
  l'eventuale marchio, evidenza di ricerca e domini sicuri citati. I link sono
  esplicitamente al dominio, non alla pagina originale. Nessuna graduatoria
  delle interfacce consumer viene promessa.

## Anthropic

- [Ricerca web](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool),
  [prezzi](https://platform.claude.com/docs/en/about-claude/pricing),
  [Sonnet 4.6](https://platform.claude.com/docs/en/models/sonnet-4-6/overview),
  [livelli di servizio](https://platform.claude.com/docs/en/api/service-tiers).
- Messages, `claude-sonnet-4-6`, `web_search_20250305`, `max_uses:1`,
  `max_tokens:4096`, `service_tier:standard_only`. Nessuna cache, thinking,
  code execution, altro strumento o prosecuzione di `pause_turn`.
  Non si usa lo strumento più recente con filtraggio dinamico/codice.
- Input $3/M, output $15/M; contesto 1M a tariffa standard; ricerca
  $10/1000. I risultati ricerca sono input a pagamento. Prenotazione:
  `2 × (1000000 × 3 + 4096 × 15) + 10000 = 6132880 micro-USD`
  **$6,13288 per domanda**. Stessa sovrastima prudente di due passaggi.
- Riconciliazione soltanto se usage completo e coerente contiene
  `input_tokens`, `output_tokens`, `server_tool_use.web_search_requests`,
  senza cache e senza altre dimensioni fatturabili. In ogni altro caso,
  anche timeout/errori/risposta parziale, trattenere l'intera prenotazione.
- Output e risultati ricerca possono contenere contenuti non attendibili:
  mai eseguirli, mai memorizzare il payload. Citazioni minimizzate come sopra.

## Gemini — adapter predisposto, esecuzione bloccata

- [Grounding](https://ai.google.dev/gemini-api/docs/google-search),
  [tariffe](https://ai.google.dev/gemini-api/docs/pricing),
  [termini specifici](https://ai.google.dev/gemini-api/terms#grounding-with-google-search).
- Adapter `generateContent`, `gemini-3.5-flash-lite`, `google_search`,
  un solo candidato, output 4096. La pagina prezzi corrente indica input
  $0,30/M, output incluso thinking $2,50/M; grounding $14/1000 oltre la
  franchigia condivisa. Non si conta la franchigia. Una richiesta può
  generare più query; il tetto totale verificabile non è dimostrato:
  **nessuna stima autorizzante disponibile**.
- Soprattutto, i termini vietano di “cache ... analyze ... otherwise learn
  from Grounded Results or Search Suggestions”, la raccolta programmatica
  per altri fini e la costruzione automatizzata di un database. Le
  eccezioni (display, cronologia chat, raffinamento per display) non
  autorizzano questo storico analitico di visibilità.
- Perciò budget positivo e chiave presente **non sbloccano Gemini**.
  Il pannello mostra entrambi i motivi. La normalizzazione è collaudata
  esclusivamente su fixture. Un futuro cambio richiede termini applicabili
  o autorizzazione Google scritta e un costo massimo dimostrabile:
  non basta rimuovere il messaggio UI o modificare il budget.

## Scadenza e sicurezza comune

La verifica dei costi scade il **23 dicembre 2026, 00:00 UTC**. Dopo tale
istante il server blocca nuove chiamate, non continua con prezzi presunti.
Rivedere fonti, limiti, modello, metodo e stima insieme; non rinnovare la
data senza verifica. L'account può imporre limiti di accesso, rate o credito:
un errore non autorizza altri modelli, provider o tentativi automatici.
Nessuna accettazione di contratti o acquisto di credito è avvenuta.

Le chiavi esistenti vengono lette dal server solo dopo controlli di
deployment e verifica della prenotazione persistita, mai dai test reali:
`OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`. Presenza non equivale
a validità. Queste credenziali non entrano in DB, browser, URL o log.

## Bing e Google report (non sono misure IA)

- [Accesso Bing](https://learn.microsoft.com/en-us/bingwebmaster/getting-access),
  [siti verificati](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.getusersites?view=bing-webmaster-dotnet),
  [statistiche](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.getrankandtrafficstats?view=bing-webmaster-dotnet).
- `GetUserSites` seleziona solo `IsVerified:true`. Nessun AuthenticationCode
  viene esposto. `GetRankAndTrafficStats` fornisce clic e impressioni
  giornalieri aggregati, tutte le verticali dal cambiamento documentato del
  2023, senza parametri periodo/dispositivo/paese/pagina/query. Date Microsoft
  `/Date(milliseconds±offset)/`: conservare il giorno nell'offset fornito,
  non fingere che sia Europe/Rome o Pacifico.
- Le pagine dei metodi non garantiscono una quota numerica o finestra
  storica fissa: non promettere 90 giorni. Si usano solo i giorni restituiti.
  Totali/confronti solo con copertura integrale dell'intervallo.
  Massimo 10.000 righe, timeout 12s, cache 15 minuti/max100 chiavi,
  max4 richieste Bing concorrenti e20/minuto per processo. Il limite locale
  è un freno prudenziale, non una quota ufficiale. `429` attiva backoff.
- L'API richiede `apikey` nella query **verso Bing soltanto**. Nessuna URL,
  risposta o eccezione grezza esce dall'adapter. Non attivare tracing HTTP
  esterno senza una redazione preventiva di `apikey`. Il server/browser
  vedono solo errori italiani fissi. Il collaudo usa una chiave sintetica.
- [GA4 compatibilità](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/checkCompatibility):
  verificare dimensioni/metriche con la Data API prima di usarle. Gli
  eventi contatto sono `contact_click`, eventuale `generate_lead`, non clienti
  o email consegnate. Telefono/email/WhatsApp richiedono la dimensione
  personalizzata già registrata nella proprietà, altrimenti assenti.
  Key events solo se letti dalla configurazione e con semantica nota; non
  attiviamo o modifichiamo alcun evento della proprietà.
- [Search Console](https://developers.google.com/webmaster-tools/v1/searchanalytics/query):
  filtri server-side dispositivo/paese ISO3/pagina/query e regex per
  percorsi linguistici verificati; top10, query anonimizzate, dati Pacifico
  e ritardo2–3 giorni dichiarati. Non filtrare i top10 nel browser.
