# Verifiche tecniche dopo il ripristino degli originali

10 novembre 2026. Nessuna pubblicazione e nessuna attivazione dell'indicizzazione.

## Esito effettivo

- App, ricontrollo alias e verifica HTTP finale: `f4b3f41`.
- Passata browser completa su `47c6571`: **119 passati, 2 falliti, 5 saltati**
  in 7 minuti. Include 1.261 documenti idratati con H1 stabile e zero errori
  JavaScript registrati, 54 casi ICU e moduli sintetici in sei lingue.
- I due fallimenti erano gli alias articolo dopo navigazione SPA, non perdite dei
  testi originali. Corretto l'ordine del router; ricontrollati i due casi su
  `f4b3f41`: **2 passati**, sviluppo e production-preview. Ogni caso percorre
  gli otto prefissi delle lingue straniere storiche, via HTTP e navigazione SPA.
- Non è stata ripetuta la passata intera dopo questa sola correzione. Le prove
  delle route canoniche, non modificate, rimangono valide; i fallimenti noti sono
  coperti dal ricontrollo mirato.
- I cinque salti riguardano il delivery HTTP, escluso nel progetto Vite ma
  verificato nel progetto production-preview.
- Typecheck workspace e 10 test automatici linguistici/HTTP superati.
- Confronto con le fonti indipendenti: 361 URL controllati; 204 casi URL di
  pagine ripristinate e 180 casi URL articolo con corpo e titoli identici.

## Correzioni reali

1. Un solo inventario per redirect server e client, con precedenza sulle route
   generiche degli articoli: anche gli originali in revisione mantengono l'URL.
2. Slash canonico, frammenti e query consentite coerenti anche al primo accesso.
3. Campagna conservata quando si seguono gli anchor dei corpi originali, senza
   trasportare email o parametri estranei.
4. Canonical e dati strutturati residui rimossi dalle pagine sospese.
5. Lingua dei link nel selettore esplicita per le tecnologie assistive.
6. Gli errori interni dell'handler non sono più spacciati per richieste errate:
   400 per encoding malformato, 500 per errore interno, senza log di dati privati.

## Test riallineati, non approvazioni inventate

I test precedenti richiedevano la home rielaborata, quattro sole immagini locali,
schede con riassunti e redirect inglesi verso testi italiani. Le istruzioni
successive del titolare impongono invece il ripristino integrale di testi e
percorsi originali. I nuovi controlli mantengono le geometrie del logo, la hero
approvata, la coerenza dei media sorgente, tastiera, menu, ricerca, link,
metadati e status HTTP. I conteggi delle chiavi sono descritti come copertura
automatica del catalogo, non revisione linguistica delle pagine attuali.

## Limiti che rimangono espliciti

25 affermazioni attendono decisione del titolare; 27 pagine non-articolo e nove
feed rimangono sospesi. Le 45 edizioni articolo interessate sono integrali nel
preview ma noindex e fuori da hreflang/sitemap. Le altre venti lingue non hanno
originali storici recuperati e non sono certificate come tali. Non sono
certificati tutti i byte/licenze dei media remoti, il CMS pubblico non collegato,
WebKit/iOS, screen reader, recapito email/SMTP o Core Web Vitals sul campo.

Questi limiti non sono stati rimossi cambiando flag di approvazione né aprendo
la preview ai motori.

Prove e log: pacchetto consegnato, `technical-regressions.json` e
`technical-evidence/`. Rapporti precedenti con 133 fallimenti sono una baseline
superata, non l'esito corrente.
