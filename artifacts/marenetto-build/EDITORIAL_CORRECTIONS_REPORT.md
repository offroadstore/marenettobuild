# Applicazione delle correzioni editoriali autorizzate

Revisione app: `5963550411403fb66d5d2a99bfa4d8f61f0374c9`.
Middleware e host reale di anteprima: `ab1ef8a`, 72 pagine HTTP 200,
tre alias HTTP 308 verificati; `/contatti/` non restituisce più 503.

## Decisione ed esecuzione

Il titolare ha scelto **«Applica le correzioni proposte»** dopo il confronto
integrale prima/dopo. Applicate tutte le 25 formulazioni italiane autorizzate.
Le correzioni equivalenti nelle otto altre lingue storiche rimangono bozze:
non sono approvazioni linguistiche, professionali o di pubblicazione.

Le correzioni non sovrascrivono i cataloghi originali né i file pubblici acquisiti.
Un livello editoriale separato conserva hash, provenienza e ogni modifica.
URL, fotografie, logo, date e tutti gli altri testi restano conservati.

## Copertura reale

- 72 pagine: otto famiglie in nove lingue storiche.
- 221 corrispondenze segnalazione/edizione, in 219 regioni di testo.
- Quattro passaggi non reperiti nei corpi originali recuperati: due nell’edizione
  spagnola della guida all’acquisto, uno nella polacca e uno nella russa. Non sono
  state ricreate frasi originali o sostituiti footer al loro posto.
- Le copie estere non sono strutturalmente parallele: alcuni passaggi sono
  testo libero dentro HTML malformato o due affermazioni accorpate. Sono stati
  usati ancoraggi esatti sull’intero testo, non soltanto indici dei paragrafi.
- I corpi effettivamente italiani in interfacce estere restano identificati come
  italiani; non sono certificati come edizioni tradotte.

## Verifica della consegna

- Typecheck e build superati; 12 test automatici superati.
- Tutti i 1.255 documenti attuali controllati via HTTP senza eseguire JavaScript.
- 72 pagine modificate controllate in Chromium mobile: corpo integrale identico
  all’originale salvo le sole modifiche autorizzate, prima e dopo idratazione.
  H1, lingua e canonical stabili; zero errori JavaScript e nessun overflow a 390 px.
- Confronto con le fonti acquisite indipendentemente: 361 URL, zero errori,
  109 casi URL con le sole correzioni autorizzate e 204 casi di copia invariata.
- Nessun invio di moduli o messaggi reali. Nessuna modifica produttiva.
- La precedente suite completa (121 passati, cinque salti solo nel progetto
  Vite) è una baseline, non una nuova passata integrale dopo queste sostituzioni.

La variazione nel conteggio dei documenti deriva dall’unificazione delle vecchie
route interne con quelle storiche: gli alias vengono reindirizzati, non rimossi
come URL storici validi. La sitemap preparata passa a quattro documenti già
ammissibili: le nuove composizioni non ereditano approvazioni.

## Stato di pubblicazione e limiti

Le pagine corrette sono HTTP 200 in anteprima, noindex, fuori dagli equivalenti
hreflang e dalla sitemap. Non rimangono le precedenti 27 sospensioni di queste
pagine; nove feed originali non corretti restano sospesi.

Le altre venti lingue non diventano edizioni storiche inventate. Restano necessarie
le revisioni linguistiche del titolare e quelle tecniche/professionali pertinenti.
L’approvazione delle sostituzioni non conferma altre promesse storiche, titoli,
portfolio, polizze o qualifiche non compresi nell’elenco.

Non sono certificati un backup integrale di ogni media remoto, licenze, CMS pubblico
non collegato, WebKit/iOS, screen reader reali, recapito SMTP o Core Web Vitals sul
campo. Il bundle mantiene l’avviso dimensionale. Corretto anche il middleware
di anteprima: leggeva il vecchio inventario e restituiva 503 per pagine già
corrette. Ora usa lo stesso inventario editoriale dell’handler preparato.

Nessun deployment, cambio dominio o attivazione dell’indicizzazione.

Rapporto consegnato: `Correzioni-applicate-25-frasi.html`. Registri:
`content/historical-corrections.applied.json`, `verification.json`,
`restoration-verification.json` e log allegati.
