# Aggiornamento dopo l’applicazione autorizzata

Il titolare ha approvato «Applica le correzioni proposte». Le 25 sostituzioni
italiane sono ora applicate in anteprima; le equivalenti nelle otto altre lingue
storiche restano bozze non approvate linguisticamente. Gli originali sono integri.

Stato corrente: `EDITORIAL_CORRECTIONS_REPORT.md` e rapporto consegnato
`Correzioni-applicate-25-frasi.html`, revisione app `5963550`.
72 pagine controllate integralmente via HTTP e dopo idratazione, 12 test automatici
superati, confronto indipendente di 361 URL senza errori. Le 27 sospensioni delle
pagine ora corrette sono rimosse; nove feed restano sospesi. La sitemap preparata
contiene quattro documenti ammissibili, non sei: le nuove composizioni non
ereditano l’approvazione precedente. Nessuna indicizzazione o produzione.

**Quanto segue è la baseline precedente all’applicazione**, conservata per
tracciabilità. I vecchi conteggi delle conferme o delle sospensioni non sono lo
stato corrente.

# Ripristino degli originali — avanzamento verificato

10 novembre 2026. **Migrazione complessiva ancora aperta**, senza pubblicazione.

## Consegna effettiva

Commit app e verifica HTTP finale: `f4b3f4113ec9428d692bb8d319c6cdf89e410ed3`.
Passata browser completa: `47c6571`; ricontrollo dei soli alias corretti: `f4b3f41`.

- 177 percorsi originali ripristinati nella UI React con la grafica esistente.
- 204 casi URL di pagine ripristinate e 180 casi URL degli articoli, comprese
  varianti, con corpo, H1 e title HTML uguali alle fonti indipendenti. Verificati
  tutti i 361 URL del registro.
- 126 percorsi articolo, cioè tutti i 14 articoli storici nelle nove lingue in cui
  il vecchio sito li pubblicava. I corpi e gli URL sono integrali.
- 14 archivi tag fuori sitemap recuperati.
- Verifica mobile Chromium su tutti i 126 percorsi articolo e sulle nove home
  (135 casi): nessuna variazione del testo/H1, errore di idratazione o overflow;
  zero errori nel confronto diretto con le fonti.
- Typecheck workspace superato; 10 test linguistici/HTTP superati; build riuscita.
- Menu Articoli e sei sottocategorie originali in ciascuna delle nove lingue
  storiche, desktop e mobile: 54 link categoria conservati.
- 1.261 documenti verificati nel browser: un H1 stabile, idratazione completata,
  canonical unico e nessun errore JavaScript registrato.
- 54 casi di date ICU controllati; moduli provati in IT/NL/PT/UK/SL/SR con risposte
  API intercettate, errore e ricevuta sintetici. Nessun messaggio reale inviato.
- Controllo renderizzato, in sola lettura, della pagina recensioni originale:
  corpo uguale alla fonte HTTP. Nessuna recensione inventata.

Le copie non sono riassunti o nuove rielaborazioni e non vengono presentate come
citazioni storiche. Nessun testo è stato tagliato per aggirare una conferma.

## Conferme puntuali

`content/historical-confirmations.json` contiene 25 frasi esatte, articolo/URL,
fonte con hash e motivo. Interessano cinque famiglie articolo e tre commerciali:
polizza decennale, qualifiche Isoplam, strumenti/relazioni tecniche, promesse
temporali, consulenza e affermazioni tecniche, team interno, indirizzo e recapito
storico diverso dall'email già confermata dal titolare.

Le 45 edizioni delle cinque famiglie articolo con affermazioni da verificare sono
ora consultabili nel preview a URL originale con corpo intero, HTTP 200 e canonical
autocontenuto. Restano noindex, senza hreflang e fuori da sitemap; lo stato di
revisione non è approvazione editoriale o fattuale. Le altre 27 edizioni non-articolo
che contengono quei passaggi restano temporaneamente 503 con Retry-After, senza
riscrittura sostitutiva. Non sono dichiarate inesistenti.

Anche i nove feed che includono gli stessi articoli sono conservati ma sospesi
temporaneamente, per non aggirare lo stato editoriale via RSS.

Le altre venti lingue restano nel perimetro come bozze nuove e separate. Nessun
controllo delle sole chiavi viene dichiarato revisione madrelingua.

## Differenze strutturali esplicite, senza cambiare parole

- Un solo H1 per documento: gli H1 subordinati sono H2, con parole identiche.
- Script, handler e invii del vecchio CMS non vengono eseguiti. Le CTA dei vecchi
  moduli indirizzano alla richiesta esistente; nessun messaggio reale inviato.
- Logo, palette e fotografia hero rimangono quelli approvati. Il titolo nella hero
  è ora quello originale, non una rielaborazione.
- Alt, caption presenti nella fonte e URL immagine sono conservati. Non si inventa
  una prova di lavori reali; non si certificano copie locali/licenze di ogni asset.

## Residui dichiarati

- 30 URL candidati senza fonte recuperata non equivalgono a 30 articoli perduti:
  29 sono alias di progetti del nuovo progetto, privi di prova storica; l'altro
  candidato è `/contatos`. La risposta 404 sul sito vecchio non prova che un
  contenuto non sia mai esistito. Il registro li distingue dalle fonti acquisite.
- CMS identificato: Framework360. Per colmare i residui serve una copia pubblica
  o esportazione JSON/XML/CSV dei soli contenuti pubblicati con URL originale,
  lingua, titolo, corpo HTML completo, stato, media, allegati e date originali.
  Non servono lead, account o dati privati. La mancanza dell'esportazione non ha
  bloccato le copie accessibili; contenuti pubblicati ma non collegati restano
  non quantificabili con certezza dal solo grafo pubblico.
- Byte/licenze delle immagini, asset solo in CSS esterni e tutti i widget terzi
  non sono certificati. Le date non vengono inventate dalla data di acquisizione.
- Bundle principale superiore a 500 kB: avviso di dimensione ancora aperto.
  Timings mobili controllati 108–227 ms per DOMContentLoaded, con risorse esterne
  bloccate: non sono caricamento reale, INP o Core Web Vitals sul campo.
- Passata Playwright completa aggiornata: 119 passati, 2 falliti e 5 saltati in
  7 minuti. I due fallimenti erano la stessa precedenza errata degli alias nel
  router client; dopo la correzione, entrambi i casi sono stati ripetuti e
  superati in sviluppo e production-preview. Non è stata ripetuta tutta la suite
  dopo la sola correzione: non restano fallimenti automatici noti nei casi
  eseguiti. I cinque salti sono controlli del delivery HTTP esclusi in Vite e
  coperti in production-preview, non cinque contenuti senza verifica.
- Il precedente 400 francese e il timeout RTL non si riproducono nelle prove
  attuali. Non sono stati certificati WebKit/iOS o screen reader reali.
- I vecchi test su schede/riassunti e redirect verso l'italiano sono stati
  riallineati alla richiesta esplicita di mantenere gli originali. Restano attivi
  i controlli su grafica, logo, fotografie, tastiera, URL, campagne e status.

## Anteprima e consegna

Noindex/nofollow e robots Disallow: / rimangono attivi. La sitemap preparata
contiene sei URL ancora eleggibili: le approvazioni delle 22 composizioni
precedenti non sono ereditate dai testi sostituiti. Copia e pubblicazione sono
stati distinti; nessuna nuova approvazione editoriale viene inventata.
Nessun deployment, cambio dominio o apertura ai motori.

Rapporto aggiornato: `Ripristino-originali-stato-verificato.html`.
Registro: `restoration-url-ledger.csv`; prove:
`restoration-verification.json`, `restoration-mobile-evidence.json` e
`technical-regressions.json`. Decisioni del titolare: `Conferme-25-frasi.csv`.
Output e fonti grezze sono nel pacchetto consegnato separatamente, fuori da Git.
