# Modulo email e GA4 diretto — 23 novembre 2026

Aggiornamento approvato dal titolare, successivo all'integrazione legale.
Non rappresenta una pubblicazione già eseguita.

## Confini mantenuti

- `legal.ts` resta identico al commit remoto `bfb16ed`:
  SHA-256 `a9a70c11f52983c86923c2f4f9ae0ea3873359d8ca04b166f3f35ff8eef53715`.
- Nessuna modifica ai Secrets, ai flag di approvazione o alle impostazioni
  persistenti del runtime dedicato; nessun dominio o DNS modificato.
- Il runtime isolato e le sue barriere rimangono disponibili come percorso
  alternativo. I suoi controlli nella console sono ora etichettati come tali.
- Nessuna cancellazione di dati storici, nessuna modifica al modulo di
  richiamata, ai motti, al logo, al hero o alle etichette IA specifiche.

## Modulo `/richiesta`

Il percorso pubblico invia i dettagli direttamente via SMTP a
`info@marenetto.com`. Non importa il database, non crea lead o notifiche
persistenti e non usa code su disco. Il destinatario non dipende dal vecchio
valore SMTP_TO. La configurazione SMTP preesistente resta necessaria.

Sono mantenuti validazione, consenso privacy, honeypot, controllo temporale,
limiti per indirizzo e protezione dai doppi clic/tentativi concorrenti. I
controlli antiabuso e di retry conservano soltanto impronte HMAC con chiave
effimera, contatori e promesse, in memoria e con dimensione limitata.

Non c'è garanzia di deduplicazione tra processi diversi o dopo un riavvio:
ottenerla con un archivio persistente sarebbe in conflitto con il nuovo
percorso senza salvataggio. Non si promette una consegna alla casella finale:
la conferma significa che il server SMTP ha accettato il messaggio.

Il sito mostra soltanto la conferma, senza codice. Dopo il successo svuota
campi e stato della richiesta; dopo un errore lascia i campi disponibili per
il nuovo tentativo. Non esegue retry automatici. In sviluppo e su host di
anteprima restituisce un errore esplicito e non spedisce messaggi reali.

## GA4 diretto

Il server pubblica una configurazione diretta approvata per
`https://www.marenettobuild.com` e `G-D0QJL17CVC` solo in produzione e con
host corretto. Non dipende dall'origine dedicata né ne attiva i flag.
L'alternativa isolata continua a passare dai controlli esistenti.

Il browser carica lo script Google soltanto dopo consenso esplicito valido.
Rifiuto, dati di consenso scaduti o configurazione non valida non avviano
Google. Il consenso è vincolato anche alla modalità di caricamento.
Sono impostati anonimizzazione IP, diniego di tutte le categorie pubblicitarie,
disabilitazione dei segnali e della personalizzazione pubblicitaria.
Gli eventi manuali contengono solo percorsi pubblici verificati e l'eventuale
tipo di contatto, senza query, hash, titolo, referrer o dati del modulo.

Le superfici private e di autenticazione sono escluse anche durante la
navigazione interna. Alla revoca o all'uscita dal percorso pubblico si
disabilita subito la raccolta, si nega il consenso e si eliminano i cookie
analytics; segue una ricarica del documento. La ricarica serve a eliminare
anche il codice Google già eseguito, non soltanto il tag. La stessa misura
si applica se la configurazione diventa indisponibile o scade.

## Verifiche e limiti

- Typecheck completo e build dell'artefatto con selettore esatto e
  `--fail-if-no-match`: superati.
- Scanner di produzione originale: superato, senza eccezioni legali.
- Test del percorso email: SMTP interamente simulato; verificati assenza
  di importazioni database, destinatario fisso, errori, accettazione,
  deduplicazione, limite invii e blocco preview.
- Test legali: 4 superati; test SEO: 39 superati; test i18n: 9 superati.
- Suite monitoraggio: 7 controlli superati, compresa la conservazione
  delle protezioni dell'alternativa isolata.
- Browser analytics: 2 test dell'alternativa isolata e 1 test del percorso
  diretto superati. Il test diretto attende ora esplicitamente la ricarica
  prevista alla revoca e all'uscita verso `/internal`; è passato nel controllo
  mirato successivo alla correzione dell'attesa.
- Browser modulo: test con risposte intercettate superato su 6 lingue nel
  server di produzione simulato. Anche nell'anteprima attiva sono stati
  verificati errore con conservazione dei campi e successo con sola conferma,
  senza chiamate reali al percorso di invio.
- `/privacy`, `/cookie`, `/richiesta`: HTTP 200 dal proxy attivo.
  Configurazione analytics in anteprima: `enabled: false`.

Le prove del percorso diretto usano l'host canonico simulato dal browser,
senza instradare traffico al vero sito pubblico. Il proxy di sviluppo resta
deliberatamente escluso, anche se qualcuno tenta di forzare una configurazione.

Non sono state inviate email reali né richieste a Google per questo
collaudo. La ricezione nella casella e nei report GA4 di produzione non
è attestata dai provider simulati. Nessuna modifica al sito pubblicato:
il Republish resta al titolare dopo il merge.
