# Backup e procedura di ripristino

## Copia consegnata

- File: generated-artifacts/production-audit-2026-11-11/Marenetto-backup-progetto-2026-11-11.zip
- Data UTC: 2026-11-11T09:46:43.616023+00:00
- Dimensione ZIP: 44592360 byte.
- SHA-256: `45f7d0739e5da1a76810a20e8368250debef42b19ccb1aa404f1adf38d49d9cc`
- File verificati dopo estrazione: 548.
- HEAD di riferimento: fded08f7bc078981cfc3301f0612ddaf10b29247; il manifest per file identifica anche lo stato del workspace copiato, non si presume che il solo commit includa ogni modifica.

## Contenuto e confini

source/ contiene codice, librerie condivise, risorse pubbliche versionate, configurazioni non riservate e documentazione disponibili al momento della copia. reference/ contiene l’archivio indipendente delle fonti e delle prove storiche già consegnato.

Le sezioni userenv di .replit sono eliminate dalla copia: nessuna lista di persone invitate o valore di approvazione viene ripristinato automaticamente. Sono esclusi segreti/.env, dati database, utenti auth, allegati privati, dipendenze installate, build/cache e cronologia Git. Questo è un backup del codice e delle evidenze pubbliche, non del servizio completo.

## Verifica effettuata

CRC del contenitore ZIP e SHA-256 di ogni file confrontati dopo estrazione in cartella temporanea separata: superati per 548 file. Nessun file del progetto originale è stato sovrascritto.

Non sono stati eseguiti avvio completo dell’app ripristinata, restore DB, restore provider auth o restore dei bucket privati. La copia può ricostruire i file, ma non dimostra da sola il recupero di richieste clienti o account.

## Ripristino controllato

1. Verificare lo SHA-256 del ZIP e conservare una copia immutabile.
2. Estrarre in una cartella vuota; confrontare i file con MANIFEST.json.
3. Ricreare segreti e configurazioni utente tramite i gestori sicuri, senza inserirli nei file del backup.
4. Installare il lockfile con pnpm install --frozen-lockfile; ripristinare separatamente i dati solo da copie autorizzate.
5. Non lanciare automaticamente push/migrazioni DB; verificare lo schema rispetto ai dati di destinazione.
6. Eseguire typecheck, build, test SEO/permessi, verifica storage e un flusso controllato di richiesta.
7. Tenere noindex e disallow finché il titolare non autorizza esplicitamente il rilascio.

## Backup del rapporto

Il backup principale è una fotografia antecedente alla consegna del nuovo audit. Gli aggiornamenti documentali e le nuove evidenze sono nel pacchetto audit separato; non si sovrascrive il backup già verificato per aggiungerli.

Per ricomporre anche gli aggiornamenti successivi alla fotografia, il pacchetto audit contiene aggiornamenti-audit/ con gli stessi percorsi relativi alla root e documenti/ con i rapporti. Applicarli soltanto dopo il controllo della copia di base, in un ambiente separato. Il router aggiunto è esclusivamente per la suite di test e richiede l’API locale dell’anteprima per le immagini pubbliche.
