# Verifiche finali della consegna privata — 25 novembre 2026

## Esito

**PRONTO PER REPUBLISH — 72 candidate, dodici lingue, nessuna attivazione.**
Metodo documentale e linguistico IA autorizzato dal titolare e registrato
come tale. Nessun parere professionale, firma umana o pubblicazione simulati.
I controlli sul caso concreto restano aperti nel riquadro delle guide.

## Contenuto e revisione

- Sei IT; 18 EN/DE/NL; 48 FR/ES/PT/PL/RU/SV/NO/DA. Nessuna lingua mancante
  nella consegna editoriale, senza affermare che le nuove guide siano online.
- Dodici ricevute IA associate alle impronte delle candidate; nessuno
  scostamento materiale rilevato. Confronto con sorgente IT e fatti del titolare.
- Computo per fasi, SAL, foto/relazione del direttore dei lavori, WhatsApp,
  referente unico e regola sulle varianti integrati, senza frequenze o garanzie.
- Servizio gestione immobili effettivamente pubblico: dodici URL canonici
  controllati HTTP 200; pagina IT nella sitemap pubblica. Link nelle guide 4/6.
- Fonti con data reale di consultazione, ambito e limiti. Circolare regionale
  1/2025 effettivamente letta sul collegamento funzionante; precedente 404
  mantenuto fra i tentativi non riusciti. Non è certificata la vigenza completa
  di ogni disciplina applicabile a un determinato intervento.
- Due segnaposto materiali/prodotti per lingua, soltanto nelle note private.
  Nessun segnaposto nel corpo CMS, sommario, metadati o FAQ per i lettori.
- Candidate testuali senza nuove immagini o attribuzioni di opere realizzate.

## Verifiche eseguite

- `pnpm run typecheck`: superato per librerie e applicazioni.
- `node artifacts/api-server/scripts/test-phase5.mjs`: **11 test superati**:
  contratto e sanitizzazione CMS, sorgente IT/lingua, FAQ, fonti, ancore,
  conservazione dello storico/alias/versioni attive/ritiri, conflitti,
  aggiornamento solo delle proprie bozze non approvate e riesecuzione sicura.
- Ingresso nativo della suite Node verificato: il wrapper raccoglie davvero
  i test interni, non un successo vuoto dovuto al contesto del processo padre.
- `verify-phase5-ready.mjs`: **72 render SSR** con il renderer applicativo e
  fixture soltanto in memoria. Testi completi, un H1, ancore univoche, lingua
  corretta, riquadro e canonical coerenti. Proposte Article e FAQPage parseate:
  autore organizzazione Marenetto Build, tre FAQ visibili, nessuna data di
  pubblicazione inventata. Sono anteprime private, non schema già rilasciato.
- Revisione HTML del riquadro: l'identificatore aggiunto per lo stile è
  l'unica modifica post-screening; impronte precedenti ricostruite esattamente,
  nessun cambiamento a testo, URL o metadati.
- Aggiornate **72 bozze CMS di sviluppo**, accodando revisioni senza cancellare
  le precedenti; prima famiglia e URL storici conservati. Nessun approve/activate.
- Riesecuzione finale: **72 unchanged**, nessun duplicato o ripristino di bozze
  sopra modifiche umane approvate. Lo script resta escluso da build/avvio.
- Snapshot pubblico attivo identico al campione precedente gli aggiornamenti.
- **60 nuovi percorsi HTTP 404**, nessuna esposizione dei titoli privati;
  nessuno in sitemap, link o hreflang delle dodici guide storiche.
- **24 destinazioni interne ai servizi HTTP 200**.
- File privati non esposti: tre percorsi 404 e un ipotetico percorso JSON
  restituito come fallback HTML della home, non come file manoscritto.
- Riavvii API/web completati; API editoriale attiva HTTP 200 e avvio Vite
  regolare. Screenshot home senza guasti manifesti o errori applicativi.
- `git diff --check`: superato.

## Precisazione sul confronto SSR di sviluppo

Il primo confronto dei dodici hash HTML integrali, attraverso il riavvio del
server di sviluppo, ha rilevato una differenza. È stato individuato il token
numerico `?t=` che Vite aggiunge al modulo di ingresso durante l'hot reload:
non è il testo degli articoli. Il campione intermedio originale è conservato,
non dichiarato falsamente identico byte per byte.

Il confronto ora ignora **soltanto quel token negli URL dei moduli di sviluppo**.
Un test dimostra che non ignora modifiche a testo o canonical. Le dodici
risposte risultano identiche nella verifica con il nuovo campione post-riavvio.
L'HTML IT originale salvato prima degli aggiornamenti coincide dopo questa
sola normalizzazione; lo snapshot pubblico completo coincide con quello
precedente l'importazione. Le impronte HTML grezze sono comunque conservate.

## Prove e limiti

Output riproducibili in `generated-artifacts/editorial/phase5/`:
`ready-for-owner-republish.json`, `ready-import-report.json`,
`ready-repeat-report.json`, `multilingual-http-checks.json`,
`original-public-state-comparison.json` e le 72 prove in `ssr-candidates/`.
Sono ignorati da Git e distribuzione. Dossier delle due tranche con testi,
fonti, URL/famiglie, glossari, stato di revisione e questioni aperte.

Nessuna prova browser autenticata, consulenza professionale o revisione umana
è dedotta da questi controlli. Non sono state riutilizzate vecchie esecuzioni
di workflow come prove nuove. Search Console: conferma del titolare, non accesso
indipendente all'account; file Google permanente intatto. Nessun Republish,
invio reale del modulo, email, IndexNow o modifica a secret/SMTP/logo/hero.

Le istruzioni di consegna e pubblicazione riservata al titolare sono in
`HANDOFF.md`. Il pacchetto editoriale è completo nel perimetro informativo
approvato; la messa online e le verifiche del singolo immobile sono distinte.
