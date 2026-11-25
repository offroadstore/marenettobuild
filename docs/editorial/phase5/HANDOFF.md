# PRONTO PER REPUBLISH — consegna al titolare tramite Claude

## Significato dello stato

Le sei guide sono preparate e controllate nelle dodici lingue richieste:
IT/EN/DE/NL nella prima tranche, FR/ES/PT/PL/RU/SV/NO/DA nella seconda.
Revisione documentale e linguistica assistita da IA e decisione interna del
titolare sono registrate come tali, **non come parere professionale**.

«PRONTO PER REPUBLISH» indica il pacchetto editoriale privato completo per il
passaggio al titolare. **Non significa pubblicato né attivato. Republish da solo
non attiva queste bozze.** Nessun accesso a SMTP, modifica di secret, invio email
o IndexNow è richiesto o eseguito.

## Consegna verificabile

- Dossier `sei-guide-primary-revisione.html`: IT/EN/DE/NL, 24 candidate.
- Dossier `sei-guide-remaining-revisione.html`: altre otto lingue, 48 candidate.
- `ready-for-owner-republish.json`: elenco completo di famiglie, percorsi,
  impronte, stato della revisione e proposte Article/FAQPage.
- `ready-import-report.json`: revisioni realmente accodate al CMS di sviluppo.
- `ready-repeat-report.json`: riesecuzione senza duplicati.
- `multilingual-http-checks.json`: isolamento delle bozze rispetto al pubblico.
- `ssr-candidates/`: prove HTML statiche del renderer applicativo, isolate e
  non servite sul sito. Nessuna fixture scritta nel CMS come contenuto attivo.

Gli output si rigenerano in `generated-artifacts/editorial/phase5/`, ignorata
da Git e dalla distribuzione. I manoscritti, gli adattamenti, i glossari, le
ricevute e la procedura restano nel progetto, fuori dalle cartelle pubbliche.

## Dopo il merge: preparazione senza pubblicare

Il database isolato dell'attività non va considerato trasferito automaticamente.
Nell'ambiente di sviluppo principale il titolare/Claude può rigenerare e
importare le bozze con il flusso esistente:

```sh
node artifacts/marenetto-build/scripts/export-editorial.mjs
node artifacts/api-server/scripts/test-phase5.mjs
node artifacts/marenetto-build/scripts/check-phase5-isolation.mjs --capture
node artifacts/api-server/scripts/import-phase5.mjs --all-locales --update-own-drafts
# Esaminare il piano, poi importare SOLO bozze:
node artifacts/api-server/scripts/import-phase5.mjs --all-locales --update-own-drafts --apply
node artifacts/marenetto-build/scripts/check-phase5-isolation.mjs
node artifacts/marenetto-build/scripts/verify-phase5-ready.mjs
node artifacts/marenetto-build/scripts/prepare-phase5-review.mjs --tranche=primary
node artifacts/marenetto-build/scripts/prepare-phase5-review.mjs --tranche=remaining
```

Il renderer SSR già costruito deve essere disponibile per la prova SSR;
in caso contrario va prima eseguito il normale build web nell'ambiente gestito.
L'importatore è intenzionalmente disabilitato in produzione. Non rimuovere il
blocco e non eseguire SQL di attivazione: per l'ambiente pubblico usare i
flussi autenticati del CMS e la procedura di rilascio approvata dal titolare.
La modalità di aggiornamento accoda soltanto alle proprie bozze non approvate;
un intervento successivo del titolare o un'approvazione fanno fallire l'operazione.

## Passo di pubblicazione: solo titolare tramite Claude

1. Selezionare le esatte revisioni e lingue da rilasciare nel CMS pertinente.
   Il via al metodo e ai dati aziendali non è trasformato da questa attività
   in un evento di approvazione di quei testi esatti.
2. Conservare la famiglia e i dodici URL storici della guida acquisto:
   sono nuove revisioni, non pagine concorrenti. Nessun archivio cancellato.
3. Verificare le dipendenze reali del rilascio: trasferimento dei contenuti nel
   CMS usato dal sito, corretta associazione alla revisione IT, approvazione e
   attivazione esplicite. Non presumere che il Republish copi il database
   dell'attività o renda indicizzabili automaticamente le edizioni dinamiche.
4. Applicare le proposte di metadati/schema alle edizioni effettive nel flusso
   pubblico esistente, senza secondo blog. Inserire date di pubblicazione reali,
   non quelle di redazione o una data retrodatata.
5. Solo nel rilascio autorizzato aggiornare le superfici pubbliche (sitemap,
   hreflang, eventuali notifiche). Ricontrollare SSR, canonical, corrispondenza
   delle FAQ visibili e assenza delle note riservate.
6. Il titolare esegue la pubblicazione tramite Claude. Dopo il rilascio
   verificare dall'esterno le edizioni effettive, senza promettere indicizzazione,
   rich result o citazioni da sistemi IA. File Google permanente intatto.

## Questioni professionali e commerciali ancora aperte

- Per ogni immobile: titolo, conformità, vincoli, strutture e impianti al
  tecnico incaricato e agli uffici competenti; adempimenti turistici sul caso.
- Materiali/prodotti/protettivi degli arredi: segnaposto privati, non certificati
  né marchi attribuiti all'impresa. Nessuna istruzione specifica per un ciclo
  non identificato; solo informazioni generali e documentazione pertinente.
- Calendari, deleghe, chiavi, accessi e logistica da concordare per progetto.
  Nessuna frequenza fissa, tempo di consegna o rendimento garantito.
- Candidate testuali senza nuove immagini: eventuali aggiunte future richiedono
  autorizzazione e le etichette IA previste, senza spacciarle per opere reali.

Questi punti sono esposti come limiti, non simulati come risolti. Non bloccano
la consegna informativa privata accettata dal titolare; non autorizzano l'avvio
di un lavoro o l'uso di uno specifico materiale.
