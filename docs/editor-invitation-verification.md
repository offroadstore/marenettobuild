# Verifica dell’invito Editor nell’anteprima

Verifica eseguita il 2026-11-12. Questo documento riguarda esclusivamente
l’indirizzo autorizzato nella richiesta di abilitazione corrente; non contiene
credenziali né gli indirizzi degli altri membri.

## Ambiente e intervento

- Clerk risulta gestito da Replit e configurato nell’anteprima di sviluppo.
- Il server usa `@workspace/db`, che legge il `DATABASE_URL` dell’ambiente,
  senza sostituzioni della connessione nel comando di avvio.
- Una fingerprint dell’identità del database ha dato lo stesso risultato
  dalla connessione dell’applicazione e dalle query amministrative di sviluppo.
- `pnpm --filter @workspace/db run check:internal-schema` è passato, incluso
  lo schema dei membri; è presente l’indice univoco sull’email.
- La ricerca mirata e normalizzata dell’indirizzo richiesto non ha trovato
  alcun record prima dell’intervento.
- È stato predisposto amministrativamente un solo record nella tabella degli
  inviti esistente, con ruolo `editor` e stato `invited`, mediante INSERT
  parametrizzato e `ON CONFLICT (email) DO NOTHING`. Non è stato aggiunto
  alcun percorso di accesso né modificato il codice di autenticazione.
- Non essendo disponibile una sessione amministrativa del browser, non è stata
  simulata una chiamata autenticata all’API dei membri. `invited_by` è rimasto
  nullo, come negli inviti di configurazione, senza attribuire l’operazione
  all’identità di un titolare.
- La rilettura ha confermato un unico record `editor` / `invited`. Conteggio
  e fingerprint dei record degli altri membri sono rimasti identici.

## Controlli effettuati

- `pnpm --filter @workspace/api-server run test:permissions`: 10 test passati,
  comprendenti permessi Editor, esclusione della gestione membri, rifiuto
  dell’approvazione editoriale per Editor e separazione tra bozze e attivazione.
- Verificato nel codice server che approvazione, attivazione e ritiro editoriali
  richiedono il ruolo `owner`; Articoli e Lingue richiedono `cms:read` e le
  modifiche editoriali `cms:write`, entrambi previsti per Editor.
- L’endpoint `/api/internal/session` senza autenticazione restituisce `401`.
- La pagina `/internal` mostra il normale ingresso con autenticazione, senza
  esporre dati interni.
- L’attivazione del nuovo invito resta affidata al middleware esistente:
  Clerk deve restituire un’email primaria verificata corrispondente all’invito
  prima che lo stato diventi `active`.

## Limite del collaudo e consegna

**Invito predisposto, login del destinatario non collaudato.** Non è disponibile
una sessione reale autorizzata del destinatario; non sono stati creati account,
token o sessioni sostitutivi, né modificata la verifica dell’email.

Aprire `/internal` nell’anteprima corrente, uscire dall’eventuale sessione già
aperta e rientrare con l’esatto indirizzo invitato, impostato come email primaria
verificata. Articoli e Lingue sono previsti dal ruolo assegnato, ma la loro
apertura nella sessione reale del destinatario non è stata osservata.

Non sono stati modificati altri membri, ruoli, impostazioni email, inviti
condivisi o di produzione, autorizzazioni editoriali, approvazioni di rilascio
o dati produttivi. Non è stata inviata alcuna email e non è stato effettuato
alcun deployment.
