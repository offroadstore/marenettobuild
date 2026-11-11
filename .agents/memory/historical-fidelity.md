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
