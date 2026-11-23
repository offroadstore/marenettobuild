# Verifica documentale dei provider — 23 novembre 2026

**Nessuna richiesta API reale eseguita. Nessuna chiave letta, mostrata o modificata per la verifica.**
Le pagine ufficiali sotto sono state consultate tramite ricerca/fetch documentale.
I limiti locali non sostituiscono quote, contratti, fatture o limiti di spesa dell'account.

## OpenAI

- [Web search](https://developers.openai.com/api/docs/guides/tools-web-search),
  [prezzi](https://developers.openai.com/api/docs/pricing),
  [modello](https://developers.openai.com/api/docs/models/gpt-6-luna),
  [parametri Responses](https://developers.openai.com/api/reference/cli/resources/responses/methods/create).
- Responses, `gpt-6-luna`, strumento `web_search`, contesto ricerca `low`,
  `return_token_budget:default`, `max_tool_calls:1`, `max_output_tokens:768` (comprende il ragionamento),
  `service_tier:default`, `store:false`. Richiesta nuova per ogni quesito:
  nessuna conversazione, background, codice, navigazione autonoma o retry SDK.
- Prezzo standard breve: input $0,10/M, output $0,50/M. Oltre 272k input:
  input $0,20/M e output $0,75/M. Ricerca $10/1000 chiamate, **più** contenuto
  ricerca conteggiato come input. Nessun credito gratuito o sconto ipotizzato.
- Limite di contesto documentato: 1.050.000 token (usato interamente come limite input prudenziale).
  Il limite totale strumenti si applica a tutti gli strumenti incorporati.
  Un solo strumento e una sola invocazione ammettono al massimo il passaggio
  prima e dopo lo strumento. Prenotazione molto prudente:
  `2 × (1050000 × 0,20 + 768 × 0,75) + 10000 = 431152 micro-USD`
  **$0,431152 per domanda**. Due finestre complete, tariffa lunga, due interi
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
  [Haiku 5.5](https://platform.claude.com/docs/en/models/haiku-5-5/overview),
  [livelli di servizio](https://platform.claude.com/docs/en/api/service-tiers).
- Messages, `claude-haiku-5-5`, `web_search_20250305`, `max_uses:1`,
  `max_tokens:768`, `service_tier:standard_only`. Nessuna cache, thinking,
  code execution, altro strumento o prosecuzione di `pause_turn`.
  Non si usa lo strumento più recente con filtraggio dinamico/codice.
- Input $0,10/M, output $0,50/M fino a 100k input; oltre tale soglia
  input $0,50/M, output $2,50/M; contesto 1M; ricerca
  $10/1000. I risultati ricerca sono input a pagamento. Prenotazione:
  `2 × (1000000 × 0,50 + 768 × 2,50) + 10000 = 1013840 micro-USD`
  **$1,01384 per domanda**. Stessa sovrastima prudente di due passaggi.
- Riconciliazione soltanto se usage completo e coerente contiene
  `input_tokens`, `output_tokens`, `server_tool_use.web_search_requests`,
  senza cache e senza altre dimensioni fatturabili. In ogni altro caso,
  anche timeout/errori/risposta parziale, trattenere l'intera prenotazione.
  Si applica prudentemente la tariffa lunga se la somma input supera 100k.
- Output e risultati ricerca possono contenere contenuti non attendibili:
  mai eseguirli, mai memorizzare il payload. Citazioni minimizzate come sopra.

## Stima completa, limite dimostrabile e budget di 5 USD

Metodo `independent-neutral-search-economy-v2`: non confrontare direttamente
i punteggi con il metodo/modelli precedenti. Nessuna chiamata reale di verifica.

- Scenario **illustrativo**, non costo osservato: due passaggi da 6.000 token
  input e 512 output a tariffa breve, più una ricerca da $0,01:
  **$0,011712 per provider/domanda**, **$0,23424 per 10 × 2 risposte**.
- Limite prudenziale completo: **$14,44992**. I due limiti per domanda sono
  notevolmente inferiori ai precedenti, ma il tetto completo sotto $1
  **non è dimostrato e non è dichiarato raggiunto**.
- `low`, `max_uses:1` e la richiesta di una risposta breve non impongono un
  numero esatto di token ricerca. OpenAI documenta solo `default/unlimited`
  per `return_token_budget`, non un valore numerico; Anthropic web search
  non espone il limite token disponibile invece per web fetch. Non sostituire
  web search con fetch o limitare le fonti al nostro sito per abbassare il conto.
- Il budget esistente rimane 5 USD; default nuovi ambienti rimane zero.
  Il controllo manuale non è più bloccato dall’assenza di heartbeat. La
  prenotazione viene verificata **prima di ogni chiamata**, con lock DB.
  Il controllo può finire parzialmente bloccato; nessun aumento automatico
  del budget. L’ordine alterna i provider per domanda così le riconciliazioni
  disponibili possono liberare residuo prima della domanda successiva.
- Test sintetico: 20 risposte valide + 10 righe Gemini bloccate entro 5 USD;
  non è una previsione né una prova di costi reali. OpenAI resta riservato
  quando non è possibile dimostrare tutte le dimensioni fatturate.
- Un massimo sotto $1 richiede limiti input documentati o accordi/quote
  vincolanti dei provider. Non abbassare artificialmente le prenotazioni.

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
