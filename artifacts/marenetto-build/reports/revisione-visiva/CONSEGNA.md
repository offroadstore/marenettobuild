# Revisione visiva della homepage — Marenetto Build

## Intervento

La homepage italiana segue il nuovo brief: apertura fotografica senza cornice,
testo allineato alla griglia, sfumatura direzionale e due azioni. La secondaria
porta al metodo: non esiste ancora un progetto reale documentato da proporre.
Il logo mantiene il monogramma sottile, MARENETTO e BUILD.COM approvati.

La palette è centralizzata: avorio caldo, antracite, superfici bianche, rame e
pulsanti rame scuro. Gilda Display e Barlow restano le famiglie tipografiche.
Griglia fino a 1240 px, spaziature e corpi più leggibili; niente fascia esterni
quasi vuota o schede di soli testi. Le tre schede fotografiche hanno immagini
diverse e portano a tre sezioni pertinenti dei servizi, conservando l’attribuzione
campagna. Metodo in quattro passaggi; esterni con immagine e testo; proprietari
all’estero con immagine illustrativa e benefici legati al servizio concordato.
Articoli, percorsi esistenti, funzioni del modulo e correzioni tecniche mantenuti.
Footer in tre colonne su desktop, contatti anticipati su smartphone.

Non è stata aggiunta la barra contatti inferiore: duplicherebbe i percorsi già
presenti e introdurrebbe il rischio di coprire modulo e tastiera. Telefono nel
menu e nel footer; WhatsApp nei contatti. Nessun contatto esterno attivato durante
le prove, nessuna richiesta inviata.

## Fotografie: limite esplicito

Le immagini disponibili sono storiche e illustrative, alcune con indizi di
origine sintetica. Non sono presentate come lavori eseguiti, persone del team,
proprietà di clienti o attrezzature aziendali. Una nota discreta a fine sezione,
tradotta nella lingua della pagina, ne dichiara l’origine IA senza sovrapporsi
alle immagini. La nota unica dei servizi copre le tre immagini di quella sezione;
non equivalgono alla fotografia reale autorizzata richiesta per la versione
finale. Il componente è predisposto alla sostituzione.

Originali e marchi non sono stati ricolorati, rigenerati o ingranditi. Il ritaglio
verticale mobile è ottenuto per semplice ritaglio/riduzione dall’originale:
628×1047 e 384×640 circa. Il browser sceglie il formato tramite picture/srcset;
la versione orizzontale offre 768/1280/1920 px. La superficie fotografica della
hero si ferma a 1920 px sui monitor più grandi, raccordata al fondo scuro;
la foto giardino è limitata a 960 px. Questi limiti evitano l’ingrandimento
del raster, ma non garantiscono la piena nitidezza su grandi schermi ad alta
densità: occorrono originali migliori. Nessun dettaglio è ricostruito con IA.

## Lingue

Italiano: apertura ripresa dal brief; inglese: adattamento dei nuovi testi;
tedesco: testi di presentazione predisposti per il controllo della composizione,
in attesa di revisione del titolare. Le altre lingue riutilizzano i cataloghi
esistenti, non sono state riscritte o dichiarate nuovamente approvate.
Gli articoli italiani restano identificati come tali.

## Materiali mancanti — elenco unico

1. Fotografia reale, pertinente e autorizzata per l’apertura, con originale
   preferibilmente da 3200 px o superiore; eventuale scatto verticale.
2. Foto reali autorizzate per i tre servizi e gli esterni; originali sufficienti
   per le dimensioni e la densità dei dispositivi.
3. Un progetto documentato con problema, intervento, risultato, foto coerenti e
   autorizzazioni: fino ad allora il blocco pubblico resta nascosto.
4. Un aggiornamento lavori reale anonimizzato, approvato per la pubblicazione:
   nessuna conversazione o sequenza di avanzamento è stata inventata.
5. Conferma dei diritti e delle eventuali liberatorie delle immagini storiche,
   oppure sostituzione con materiale autorizzato.
6. Revisione dei nuovi testi IT/EN/DE e conferma delle modalità effettive del
   servizio a distanza prima di qualunque futura pubblicazione.

## Perimetro

Solo progetto e anteprima: nessuna pubblicazione, modifica a Framework360,
DNS, dominio, indicizzazione, backend, raccolta dati o invii reali.
Nessuna dichiarazione di aumento delle conversioni o di velocità senza misure.
Gli eventuali confronti dell’interfaccia non sono confronti di lavori edili.
Portfolio e prima/dopo di interventi restano riservati a lavori reali.

## Verifiche

Build, TypeScript, sette controlli di localizzazione e due controlli specifici
sulle note sono riusciti anche dopo l’ultima modifica. Le note hanno testi
espliciti per tutte le 29 lingue, corpo 13 px, colore secondario senza trasparenza,
posizione normale nel flusso, nessun bordo o riquadro. Il contrasto del colore
secondario sul fondo avorio è circa 6,4:1.
Le schermate italiane aggiornate sono state osservate a 390×844, 768×1024 e
1440×900. La precedente verifica browser estesa è stata
interrotta per dare precedenza alla nuova richiesta sulle note: non viene
dichiarata completata. La copertura delle traduzioni delle note e l’assenza
delle vecchie etichette sono controllate anche da illustration-notes.test.mjs.
I controlli emulati non equivalgono a collaudi su dispositivi fisici, con
tecnologie assistive o a una certificazione di accessibilità.
