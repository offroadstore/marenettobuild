---
name: Historical migration fidelity
description: The owner's standard for original-copy proof, historical URLs and handling unverified historical claims.
---

A rewritten article, even if fully rendered, does not satisfy a faithful copy of
the historical original. Compare independently acquired historical content against
the new page actually served, preserving each edition and historical URL in the
accounting. A catalog compared with HTML generated from that catalog is not proof.

**Why:** The owner explicitly required demonstrated fidelity to the public
historical site and rejected treating the complete presence of reworked text as
original-content recovery.

**How to apply:** Keep provenance separate for live historical sources, archived
copies and project rework. Preserve originals containing unverified claims in the
archive and flag exact passages for the owner's decision; do not rewrite them
again to remove differences. Report missing CMS public content and language
editions rather than treating unregistered routes returning 404 as migrated.

Il titolare richiede: «Ripristina integralmente i contenuti originali mantenendo
gli URL storici». Prima del ripristino elencare soltanto le affermazioni specifiche
da confermare con articolo, frase esatta e motivo. Procedere intanto con tutto il
resto. Non trasformare gli articoli in citazioni storiche, non sostituirli con
riassunti e non aggiungere avvisi ripetitivi. Le modifiche editoriali devono essere
esplicite e sottoposte alla sua decisione. L'assenza di un'esportazione CMS non
blocca i contenuti accessibili; elencare ciò che manca e cosa serve per recuperarlo.

**Why:** Istruzione esplicita del titolare sul trattamento degli originali e sulle
conferme, non un'autorizzazione a riscrivere o a pubblicare in produzione.

**How to apply:** Conservare il testo completo anche quando una pagina attende
conferma. Separare i blocchi reali dalle verifiche di completezza ancora aperte.
Preservare ogni URL articolo e copia locale storica effettivamente acquisita, così
da conservare i percorsi dei link inbound. Non inventare versioni nelle lingue per
cui non è stata reperita una corrispondente edizione originale.

Le diciture visibili devono distinguere originali recuperati, verifiche ancora
aperte, modifiche editoriali e traduzioni da approvare. Non chiamare genericamente
«in revisione» tutto ciò che non ha una nuova approvazione alla pubblicazione.

**Why:** Il titolare ha confermato questa distinzione senza autorizzare modifiche
ai testi né approvazioni automatiche.

**How to apply:** Cambiare le etichette, non gli stati sottostanti; indicare la
lingua effettiva quando un percorso straniero contiene ancora il testo italiano.

Nel lavoro editoriale, copie storiche ed elaborazioni dello stesso contenuto
devono restare riconoscibili sotto una sola identità, non diventare articoli
duplicati. Conservare separatamente gli originali, le correzioni autorizzate e le
nuove composizioni; più URL preesistenti non autorizzano a perdere una copia.

**Why:** Il titolare richiede gestione senza reinserimento manuale né duplicazioni,
ma non consente che importazione o precedenti approvazioni autorizzino nuovi testi.

**How to apply:** Quando si riconciliano cataloghi o si estende l’archivio,
mantenere provenienza e percorsi consultabili senza confondere la versione
storica con la bozza o con la revisione attiva.

Le correzioni puntuali autorizzate dopo un confronto esplicito prima/dopo sono
eccezioni alla copia letterale, non un’autorizzazione a riscrivere il resto.
Conservare gli originali immutati e un registro esatto delle sostituzioni.
L’autorizzazione all’anteprima non approva produzione o traduzioni straniere.

**Why:** Il titolare ha autorizzato l’applicazione delle formulazioni prudenti
proposte, mantenendo il vincolo di conservazione degli originali.

**How to apply:** Distinguere nei confronti «identico all’originale» da «identico
salvo correzioni autorizzate»; le bozze tradotte restano senza approvazione umana.

Non presumere che le copie storiche in lingue diverse abbiano paragrafi paralleli.
Controllare l’intero testo DOM e usare ancoraggi univoci prima di dichiarare assente
una frase: l’HTML malformato può conservarla fuori dai normali elementi di blocco.

**Why:** Alcune copie del CMS contengono frasi come testo libero o elementi
accorpati, e alcune interfacce straniere conservano corpi italiani.

**How to apply:** Verificare i delta sul corpo integrale, conservare il testo
estraneo alle correzioni e identificare la lingua effettiva senza inventare
paragrafi mancanti o dedurre completezza dal numero delle route.

Nei documenti misti con markup storico escapato, tradurre soltanto sottostringhe
italiane identificate esattamente; non affidare alla traduzione del nodo completo
anche la pulizia del markup o delle frasi già nella lingua corretta.

**Why:** Una proposta automatizzata di traduzione può interpretare il markup
malformato come rumore e cancellare frasi circostanti, pur restituendo un testo
fluido. Anche una lingua dichiarata come nativa può contenere passaggi italiani.

**How to apply:** Confrontare il DOM effettivamente servito con la sorgente,
registrare sostituzioni prima/dopo e verificare che tutto il testo esterno alle
sostituzioni, i numeri e la struttura rimangano invariati. Non estendere
l'approvazione precedente alla revisione così corretta.

Un'acquisizione con zero errori di trasporto può comunque contenere risposte
HTTP 429 del CMS e non dimostra copertura delle fonti. Contare separatamente
status HTTP, contenuti confrontabili, tentativi rinviati e verifiche browser
effettivamente conservate.

**Why:** Il sito storico ha limitato una ricognizione pubblica anche dopo una
ripresa a frequenza ridotta; i controlli browser parziali non colmavano quel limite.

**How to apply:** Conservare ogni tentativo, rallentare e interrompere al nuovo
limite, senza classificare i candidati come pagine inesistenti o migrazione
riuscita. Richiedere un'esportazione dei soli contenuti pubblicati quando serve
chiudere la copertura oltre il grafo accessibile.

Nel CMS Framework360 le immagini differite possono avere solo `data-waitsrc`,
senza `src` o `data-src`. Le immagini dei post e le miniature degli archivi vanno
verificate separatamente.

**Why:** I file multimediali possono rispondere correttamente mentre il recupero
HTML ha perso gli indirizzi delle miniature. Inoltre alcuni corpi originali
contengono nomi segnaposto, non fotografie effettivamente disponibili.

**How to apply:** Considerare gli attributi differiti nelle acquisizioni;
verificare i riferimenti nel documento servito oltre ai byte degli asset.
Non colmare segnaposto originali con foto inventate o non documentate.

Quando una nuova lingua non ha un originale storico, trattare i suoi testi come
nuove composizioni/adattamenti con provenienza esplicita, non come originali
recuperati. La revisione bilingue assistita da IA non diventa una certificazione
di madrelingua o una nuova verifica delle fonti normative.

**Why:** L'apertura dell'arabo richiede corpi completi senza falsificare la
provenienza storica né estendere alle traduzioni l'approvazione delle dodici
edizioni già esistenti.

**How to apply:** Conservare separati gli originali e le nuove composizioni,
legare le verifiche alla revisione effettiva e distinguere sempre controllo
linguistico, approvazione professionale e semplice data di consultazione.
