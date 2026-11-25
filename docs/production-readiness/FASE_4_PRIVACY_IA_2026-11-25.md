# Consegna autonoma Fase 4 — privacy, cookie e trasparenza IA

Data: 25 novembre 2026. **PRONTO PER REPUBLISH — candidato, non pubblicato.**

Rapporto distinto dalla Fase 3. Il precedente FASE_4_PRIVACY_IA.md rimane
storico; le decisioni del titolare del 25 novembre superano i suoi blocchi
su conservazione, categorie di fornitori e indicizzazione.

## Titolare e contatti

Marenetto s.r.l. unipersonale; P.IVA IT06471740826;
SS 113 Settentrionale Sicula, 73b, 90015 Cefalù (PA), Italia.
Sono dati confermati dall'impresa, non una verifica camerale indipendente.
Il contatto pubblico resta info@marenetto.com. Nessun cambio di casella o SMTP.

## Inventario dei trattamenti effettivi

- **Modulo progetti:** la Main aggiornata invia solo email e non salva la
  richiesta nel database del sito. Dati e recapito servono a rispondere
  alla richiesta precontrattuale; la casella privacy è presa visione
  inizialmente non selezionata, non consenso marketing.
- **Richiamate:** flusso distinto, con archivio riservato al titolare.
  Memorizza i dati necessari e prove con versione, lingua e data.
  Marketing e contatto WhatsApp hanno scelte separate e facoltative.
  Non è corretto dichiarare «il sito non conserva dati» per questo flusso.
- **Email, telefono, WhatsApp diretti:** trattati nei rispettivi canali;
  il sito non può cancellare da solo copie nelle caselle dei destinatari.
- **Antiabuso:** impronte HMAC e orari, non IP in chiaro nei registri
  dedicati dei tentativi. Finestra di controllo 24 ore; pulizia periodica
  dei tentativi persistenti. Il modulo email usa soltanto memoria volatile.
- **Area interna:** autenticazione e ruoli esistenti preservati. Nessun
  accesso autenticato reale o modifica dei privilegi è stato eseguito.
- **Recensioni Google:** trasporto server-only della Main preservato.
  Nessuna cache di testi/avatar e nessuna recensione reale nei rapporti,
  nelle prove sintetiche o nell'inventario delle immagini.
- **Font, mappe e WhatsApp:** font locali; normali link volontari, senza
  widget esterni preventivi per mappe o chat.
- **Statistiche e marketing:** conservate le implementazioni GA4 e Meta
  della Main, come categorie indipendenti. Implementato non significa
  abilitato in produzione: nessun flag o fornitore è stato attivato qui.

Le informative descrivono destinatari per categorie: personale autorizzato,
hosting/infrastruttura, database/archiviazione, autenticazione, email,
assistenza tecnica e strumenti statistici/pubblicitari subordinati al consenso.
Regioni, accordi, sub-responsabili e garanzie extra SEE non verificati non
sono presentati come certificati. Restano responsabilità organizzative del
titolare ai sensi delle disposizioni applicabili, non nuove approvazioni
tecniche da ottenere per completare questo lavoro.

## Regola dei 12 mesi e cancellazione

La nuova istruzione sostituisce i 24 mesi: richieste e altri dati di clienti
non contrattuali si cancellano entro 12 mesi dall'invio. I rapporti
contrattuali seguono gli obblighi di legge applicabili, senza inventare
una durata universale.

La manutenzione delle richiamate usa mesi di calendario ed esclude soltanto
il marcatore esplicito di rapporto contrattuale, indipendente dallo stato
«chiusa». L'etichetta interna chiarisce ora questa eccezione.
La versione della relativa informativa è call-2026-11-25. Il contratto API
mantiene leggibili le versioni storiche ma richiede la versione corrente
per nuove richieste.

La funzione di scadenza ha un'anteprima non distruttiva come comportamento
predefinito. La prova in schema isolato ha verificato: richiesta sintetica
di 13 mesi selezionata, richiesta di 11 mesi conservata, rapporto
contrattuale conservato, anteprima senza cancellazione e successiva
cancellazione soltanto sintetica. In sviluppo il processo automatico può
cancellare soltanto record sintetici. Non sono stati cancellati dati reali.

Per dati eventualmente preesistenti, email, notifiche e backup, la procedura
organizzativa è: inventario con anteprima senza esportare dati personali nei
rapporti; distinzione documentata dei rapporti contrattuali; eliminazione
delle copie non contrattuali scadute; registrazione minimizzata dell'esito;
scadenza delle copie presso fornitori e divieto di ripristinare contatti
scaduti da backup. I dati necessari agli obblighi legali vengono separati
dagli usi facoltativi. Il sito non certifica l'avvenuta esecuzione di queste
operazioni nelle caselle email o nell'infrastruttura del titolare.

L'area del titolare offre già eliminazione permanente con conferma ed export
CSV filtrato. Aggiunto l'export JSON della sola richiamata selezionata, inclusi
i relativi dati e le scelte registrate, per rispondere a richieste di accesso
senza esportare altri clienti. Il download non invia email e non crea nuove
copie nel database del sito; il titolare controlla il file prima di condividerlo.

## Informative, consenso e accessibilità

Privacy, cookie e uso dell'IA sono completi nelle 12 lingue, datati
25 novembre 2026 e raggiungibili da footer e modulo. Il testo distingue
finalità, basi, destinatari, trasferimenti, conservazione, diritti, revoca,
reclamo al Garante e contatto.

Categorie opzionali spente in assenza di scelta valida; Accetta e Rifiuta
di pari evidenza; Personalizza separa statistiche e marketing. Nessun consenso
tramite scorrimento, casella preselezionata o semplice invio di una richiesta.
Le preferenze minimizzate/versionate durano 180 giorni e sono revocabili
dal footer. Revoca e rifiuto arrestano i trasporti e rimuovono i cookie
controllabili. Le guardie della Main su persistenza, scadenza e più schede
rimangono attive.

Unificato il collegamento alle preferenze del footer con il controllore
corrente, eliminando il vecchio pulsante non più collegato. Anche il pannello
inattivo in preview ha una chiusura esplicita, localizzata e con ritorno del
focus. La preview non attiva i fornitori.

La verifica di chiusura ha individuato e fatto correggere un'ulteriore
dipendenza: il pannello usava il solo elenco delle pagine misurabili.
Ora l'accesso alle preferenze usa tutte le edizioni pubbliche, mentre
analytics e marketing conservano le restrizioni di misura e le esclusioni
private. Anche con elenco editoriale verificato ma vuoto, servizi, zone
e informative localizzate consentono di cambiare o revocare le scelte.
Le pagine non misurabili non richiedono configurazioni analytics.

Il link all'informativa nel modulo è un'ancora nativa in nuova scheda:
non sostituisce la pagina e non perde i campi compilati. L'email del modulo
chiama la casella «Informativa privacy letta», non consenso marketing.
Nessun indebolimento delle protezioni anti-spam.

## Immagini e trasparenza IA

Inventario aggiornato: **89 asset, 5.336 occorrenze** nelle pagine/lingue,
inclusi srcset, sfondi e anteprime social. Classificazioni documentate:
11 asset generati con IA, 34 modificati con IA, 39 di provenienza incerta
e 5 elementi di marchio/attribuzione. Il conteggio per asset è distinto
da quello delle occorrenze responsive.

Il titolare conferma che non esistono ancora foto di lavori reali: nessuna
immagine attuale viene quindi usata come prova di un intervento eseguito.

Ogni immagine IA conosciuta ha un'etichetta individuale localizzata.
Quelle di provenienza non documentata restano illustrative, non vengono
certificate autentiche o dichiarate IA per supposizione. Marchio Google
di attribuzione distinto dalle fotografie; logo aziendale preservato.
Ridimensionamento e WebP non sono classificati come generazione IA.
Master del hero non alterato; didascalia nella presentazione, senza coprire
le azioni su mobile.

Il footer dichiara l'uso dell'IA e collega la pagina completa. Non è stata
inventata l'attestazione «verificati dal nostro team»: il testo resta
veritiero finché una revisione reale non sia documentata. Non si presentano
immagini illustrative o ritoccate come lavori realizzati.

Il titolare conserva la responsabilità editoriale. Questo rapporto tecnico
non certifica licenze mancanti, controllo umano di ogni immagine, contratti
con fornitori o conformità legale complessiva. L'articolo 50 non viene
descritto come obbligo indistinto di etichettare ogni testo commerciale IA;
la trasparenza estesa realizza la scelta del titolare.

## Prove e limiti dichiarati

- Typecheck completo e build superati.
- Il controllo servizi/privacy aggiornato ha superato 10 prove, incluso l'export
  individuale sintetico; restano le 9 prove Fase 3/4 e le 4 prove legali.
- 26 prove richiamate e 3 prove email-only superate: trasporti simulati,
  schema temporaneo isolato, nessuna email reale.
- 39 prove SEO, 9 i18n e 6 Fase 2 superate.
- Controlli permessi e schema interno superati.
- Un solo controllo browser mirato nel percorso del lavoro, con correzioni
  di link privacy, pannello preferenze e didascalia hero. Niente nuovi
  accessi reali, invii commerciali o sessioni browser complete ripetute.
- Screenshot finale della privacy e avvio pulito dei due servizi verificati.
- Ultima esecuzione completa della suite di chiusura: 195 prove superate,
  7 saltate e 2 aspettative sul contenitore del link IA fallite. Il link
  esisteva nella nota illustrativa del footer: il controllo ora verifica
  quella nota, mantenendo il conteggio esatto e il percorso previsto.
  Restano tutti i controlli di conservazione dei campi, contenuto e privacy.
  Superati su entrambi gli ambienti i nuovi casi di apertura/revoca
  persistente da cinque percorsi statici, con consensi preesistenti ed
  elenco editoriale vuoto, e di apertura inattiva in preview senza fornitori.
  Totale raccolto: 204 casi. Revisione di chiusura approvata.
  L'esito positivo della nuova verifica automatica resta condizione di
  chiusura, non viene presunto.

Fonti ufficiali consultate il 25 novembre 2026:
https://www.garanteprivacy.it/faq/cookie ;
https://ai-act-service-desk.ec.europa.eu/it/ai-act/article-50 .

## Consegna

Due rapporti autonomi, inventario immagini CSV e matrice geografica storica.
I documenti iniziali sono conservati, non cancellati o riscritti come se
le decisioni attuali fossero già state approvate in precedenza.

**PRONTO PER REPUBLISH.** Nessuna pubblicazione effettuata, nessun invio
email reale di prova, nessuna attività IndexNow, nessun cambio di secret,
SMTP o flag operativi. Le prove riguardano il candidato, non la revisione
attualmente pubblicata sul WWW.
