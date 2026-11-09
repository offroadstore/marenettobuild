# Evoluzione UX e identità — 9 novembre 2026

## Perimetro

Intervento reversibile sul progetto e sulla sua anteprima. Nessuna modifica a
Framework360, DNS, dominio, indicizzazione o configurazione di pubblicazione.
Nessuna attivazione di dati reali, nuova raccolta analytics o invio esterno.
Le verifiche non inviano richieste, nemmeno sintetiche.

Base riutilizzata: ricognizione A–F, MIGRATION_REPORT, cataloghi e route
esistenti, modulo/API e strutture editoriali. Non è un nuovo audit generale.

## Decisioni e modifiche

- Il titolare ha scelto la composizione MARENETTO / BUILD.COM e precisato
  «preferisco le linee sottili del logo attuale con la scritta build come quella
  del logo nuovo». La composizione in anteprima riusa i pixel del monogramma e
  del nome storici, ritagliati soltanto nella presentazione CSS, con BUILD.COM
  sotto il nome. Non è stato ridisegnato il monogramma. Gli originali PNG
  rimangono intatti. Il logo conserva direzione LTR anche nelle pagine RTL.
- Gerarchia homepage: offerta/territorio → bisogni/servizi → metodo →
  esterni e proprietari all’estero → articoli → contatto. Lavori e testimonianze
  non vengono sostituiti con esempi inventati: i blocchi privi di materiale
  autentico sono nascosti. La struttura editoriale resta; `/progetti` e i vecchi
  collegamenti che vi arrivano accompagnano temporaneamente ai servizi, senza
  esporre una pagina pubblica piena di spiegazioni su materiali mancanti.
- Il messaggio iniziale IT/EN è più corto e include case, seconde abitazioni
  e strutture ricettive. La CTA principale è unica. Il pulsante duplicato
  dell’header non compete con l’hero; sul modulo non è ripetuto.
- Su smartphone e tablet verticali testo e azione precedono l’illustrazione,
  anziché sovrapporsi a un’immagine alta. Su desktop il riquadro è limitato
  a 960 CSS px. La sorgente 1920×1047 non è stata ingrandita o rigenerata;
  il rapporto d’aspetto viene preservato con contain, anche con testi lunghi.
- Le illustrazioni sintetiche di manutenzione/giardino non vengono più usate
  come grandi immagini di servizio. I blocchi sono tipografici. Non sono
  state prodotte fotografie, dettagli, risultati di lavori o persone artificiali.
- L’illustrazione storica residua è decorativa, con alternativa vuota perché
  non contiene informazioni aggiuntive rispetto al testo, e didascalia visibile
  che la distingue dal portfolio. La didascalia IT/EN esplicita la propria lingua;
  non viene presentata come una nuova traduzione approvata nelle altre lingue.
- Escape chiude i menu e ripristina il focus; apertura, cambio pagina e indietro
  gestiscono lo stato. Il selettore lingua supporta frecce, Home ed End e non
  resta aperto insieme al menu principale. Controlli touch principali e opzioni
  lingua hanno un’altezza minima di 44 px.
- Nessuna barra di contatto fissa: aggiungerebbe inviti concorrenti e il rischio
  di coprire campi o tastiera. Menu, pagine di contatto e CTA già presenti bastano.
- I nuovi testi IT/EN stanno in `copyBase`; i 27 cataloghi e `copySource`
  conservano il testo precedente. La nuova redazione non viene automaticamente
  dichiarata revisione semantica o approvazione di tutte le lingue.
- Non sono state aggiunte promesse di fotografie sistematiche, visite in sede,
  disponibilità, sopralluoghi universali o garanzie operative non confermate.

## Misurazione e rilascio

Nessuna promessa di posizionamento, citazioni IA, velocità o conversioni.
Nessun nuovo tracker. La correzione del serving dei metadati sulle URL pulite,
già individuata nel report A–F, non è stata confusa con un’autorizzazione a
pubblicare o a indicizzare.

Build locale, TypeScript e controlli di cataloghi vengono verificati separatamente
dalle osservazioni browser. Un test strutturale non approva la qualità linguistica.
Il controllo delle frasi è ora denominato esplicitamente per il suo vero ambito:
sorgente dei cataloghi e interfaccia condivisa, non la redazione nativa IT/EN.

Le verifiche responsive sono emulate: non equivalgono a dispositivi fisici,
tastiera virtuale iOS/Android o collaudo screen reader. Il ridimensionamento di
una viewport può verificare spazio e scorrimento, non riprodurre tutti i
comportamenti della tastiera di un telefono reale.

## Esiti delle verifiche

- Build locale e TypeScript: riusciti. Sette controlli di localizzazione riusciti;
  sono controlli strutturali, non approvazione semantica dei nuovi testi.
- Confronto con Git: `copySource` e i due asset originali del marchio invariati.
- Homepage senza overflow nei campioni emulati:

| Viewport CSS | DPR | Dispositivo rappresentato, non fisico |
|---|---:|---|
| 320×700 | 2 | Smartphone compatto |
| 390×844 | 3 | Smartphone |
| 430×932 | 3 | Smartphone grande |
| 844×390 | 2 | Smartphone orizzontale |
| 768×1024 | 2 | Tablet verticale |
| 1024×768 | 2 | Tablet orizzontale |
| 1440×900 | 1 | Desktop |
| 2560×1440 | 2 | Monitor ampio ad alta densità |

- CTA iniziale visibile nei campioni; nessuna sovrapposizione misurata del
  logo/header. BUILD.COM bianco su rame, contrasto misurato 5,00:1.
- Percorso home → servizi → richiesta e indietro: eseguito senza compilazione
  o invio. Menu Enter/Escape/focus, campioni FR/AR e movimento ridotto verificati.
- Il primo passaggio ha rilevato overflow del modulo: radio trasparenti assoluti
  non ancorati alla propria etichetta. Correzione CSS, senza alterare dati o
  comportamento di invio. Verifica mirata successiva riuscita a 390, 768 e 1024:
  scrollWidth rispettivamente 375, 753 e 1009, entro la viewport; hitbox delle
  opzioni alte 44 px, focus visibile. Controllato anche lo spazio ridotto 390×450,
  non una tastiera virtuale reale.
- Dati e resoconto originali dei controlli in
  `../reports/evoluzione-ux/verifiche-browser.json` e `.md`: conservano anche il
  primo esito negativo e la successiva correzione, senza nasconderlo.
- Il reindirizzamento temporaneo `/progetti` → `/servizi` preserva i parametri
  campagna e la struttura editoriale. Le aspettative dei due alias storici nel
  test dedicato sono aggiornate; l’intera vecchia suite di route non è stata
  rieseguita. Le altre mappature storiche non sono state cambiate.
- Rimane l’avviso del bundle principale oltre 500 kB. Nessun punteggio Lighthouse,
  Core Web Vitals, garanzia di velocità o conversione viene attribuito a questa
  consegna. Nessun collaudo su dispositivi fisici.

## Elenco unico dei materiali e delle conferme ancora necessari

1. **Lavori autentici:** almeno uno o più casi pertinenti, con problema iniziale,
   località pubblicabile, interventi effettivi, foto prima/durante/dopo,
   didascalie e autorizzazione del cliente.
2. **Originali fotografici:** file alla risoluzione originaria e diritti d’uso;
   per foto grandi serve almeno la risoluzione coerente con dimensione di
   visualizzazione e densità prevista. Non saranno sostituiti con dettagli IA.
3. **Persone, sede e mezzi:** immagini autorizzate, ruoli reali, distinzione
   fra sede esistente e simulazioni di allestimenti futuri, titolarità dei mezzi.
4. **Testimonianze:** testo e attribuzione autentici, fonte e consenso di uso.
5. **Servizi e territorio:** comuni effettivamente serviti per tipo di intervento,
   confini fra impresa e professionisti incaricati, modalità operative di
   aggiornamento da confermare prima di renderle promesse più specifiche.
6. **Approvazioni:** conferma visiva della composizione del marchio e revisione
   dei testi IT/EN prima di qualsiasi successivo rilascio pubblico. Restano
   separati i prerequisiti privacy/fornitori e le approvazioni per dati reali.
