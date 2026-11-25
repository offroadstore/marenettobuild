# Fase 3 — Servizi e visibilità

Consegna candidata del 23 novembre 2026, dalla Main che include la Fase 2 e
la pulizia degli asset di produzione. Nessuna pubblicazione eseguita.

## Ambiti commerciali

- Edilizia e manutenzione: circa 60 km **stradali** da Cefalù, con controllo
  dell’indirizzo del lavoro, accessi e condizioni. Il titolare ha autorizzato
  di procedere dopo la proposta di usare la distanza stradale; non è un raggio.
- Arredi premium su misura: tavoli esclusivi in cemento/microcemento e pezzi
  di design, nel mondo con trasferta del team. Nessuna estensione mondiale
  dell’edilizia; nessuna agenzia o accordo con partner asserito.
- 24 nuove pagine sostanziali di servizio/area nelle 12 lingue autorizzate,
  FAQ effettivamente visibili e schema Service/FAQPage corrispondente.
  Niente Product, prezzi, disponibilità, recensioni o referenze inventate.
- Le nuove traduzioni non ereditano l’approvazione della Fase 2: sono candidate,
  presenti nell’HTML SSR e noindex finché il titolare non le approva.
  Sitemap/hreflang/llms usano soltanto le edizioni ammesse al rilascio.
- Modulo con scelta arredi e indicazione dei due ambiti; i collegamenti
  dalla nuova sezione preselezionano l’ambito senza perdere gli altri campi.

## Matrice geografica e limiti

Fonte consultata il 23 novembre 2026: Rome2Rio, itinerari da Cefalù.
La tabella completa riproducibile viene prodotta da
`PORT=4188 BASE_PATH=/ node artifacts/marenetto-build/scripts/service-area-report.mjs`
in `generated-artifacts/services/area-matrix.csv` e `.json`.
Comprende le 14 località richieste e altre 19 località pertinenti, distinguendo
comuni, frazioni e stazioni. Castel di Tusa è frazione di Tusa; Finale di Pollina;
San Nicola l’Arena di Trabia.

**Metodo:** origine generica “Cefalù” del motore, arrivo al centro abitato.
Il sito fonte restituisce stime stradali in miglia arrotondate: conversione
1 miglio = 1,609344 km, arrotondata a 0,1 km. Non sono distanze misurate dalla
sede storica, né una verifica di viabilità, percorribilità o interi territori.
Le cifre non sono presentate al pubblico come misure certe.

| Caso da segnalare al titolare | Stima km | Decisione prudente |
|---|---:|---|
| Petralia Sottana | 58,6 | vicino al limite, verificare indirizzo e percorso |
| Petralia Soprana | 56,8 | vicino al limite, verificare indirizzo e percorso |
| Gangi | 57,9 | vicino al limite, verificare indirizzo e percorso |
| Alimena | 74,5 | oltre soglia, escluso |
| Bompietro | 69,4 | oltre soglia, escluso |
| Campofelice di Fitalia | 71,6 | oltre soglia, escluso |

La matrice è una ricerca documentale verificabile, non una lista di contratti
accettati né un elenco esaustivo di ogni contrada. Per contrade/frazioni non
elencate serve l’indirizzo; non si presume copertura dell’intero comune.

## Contatto, crawler e limiti SEO

Fonte centrale di NAP e recapiti conservata. Email pubblica definitiva:
**info@marenetto.com**, come già deciso dal titolare il 22 novembre.
Destinatari interni delle notifiche restano distinti: SMTP/secret non modificati.
Ragione sociale, P.IVA e indirizzo provengono dal progetto; identità e sede
sono state successivamente confermate dall’impresa il 23 novembre 2026
(vedi `CONTROLLER_CONFIRMATION.md`). Non è una verifica anagrafica indipendente.

Gruppi espliciti per GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
PerplexityBot, Google-Extended, Bingbot e Applebot; ciascuno ripete le esclusioni
API, area interna, accesso, demo, CMS non approvato e revisioni.
Preview: robots disallow e noindex conservati.
`llms.txt` descrive separatamente i servizi e collega solo edizioni pubbliche
ammesse. Nessuna garanzia di scansione, indicizzazione, ranking o citazione.

La fonte Google indicata nel piano è stata consultata il 23 novembre 2026:
reindirizza alla pagina aggiornamenti che segnala rimozione della documentazione
dei FAQ rich result nel giugno 2026. FAQPage serve a descrivere fedelmente
il testo, **non** promette risultati avanzati:
https://developers.google.com/search/docs/appearance/structured-data/faqpage .

## IndexNow escluso su istruzione aggiornata

Il titolare ha chiesto espressamente “senza IndexNow”. Non sono generati file
chiave, installati invii automatici o eseguite notifiche. Questa è una variazione
esplicita rispetto al piano originario, non un’automazione dichiarata esistente.
Non sono state eseguite prove della revisione candidata sulla produzione,
che richiederebbero prima la pubblicazione del titolare.

## Materiali per la galleria reale

Per ogni lavoro: originali fotografici e autore/provenienza, diritti d’uso e
autorizzazioni di proprietari/persone riconoscibili, descrizione di ciò che è
stato realmente eseguito e da chi, materiali/ciclo e limiti, dimensioni e peso,
località pubblicabile e data, accessi/trasporto/posa, trasferte e vincoli locali,
eventuali prezzi indicativi autorizzati con perimetro e data.
Il modulo non carica allegati: inviarli tramite il contatto concordato.
Nessun lavoro, foto probatoria o prezzo è stato inventato per riempire la galleria.

## Stato delle verifiche

Controlli riproducibili: `scripts/service-offers.test.mjs` (SSR delle 24 pagine,
FAQ/schema, crawler, geografia, llms) e typecheck. Risultati finali e build
sono registrati nella consegna Fase 4, senza confondere candidato e produzione.

Questa consegna precede il lavoro privacy/IA. L’approvazione dei nuovi testi,
i casi geografici al limite restano decisioni del titolare; la conferma dei
dati societari è stata poi ricevuta e registrata separatamente.
Il rapporto non attesta conformità legale o pubblicazione avvenuta.
