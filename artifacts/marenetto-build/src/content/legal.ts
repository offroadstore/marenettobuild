/** Testi delle pagine legali pubbliche. Versione unica usata anche come versione dell'informativa analytics. */
export const LEGAL_VERSION = '2026-11-23.meta-1';
export const LEGAL_UPDATED_LABEL = '23 novembre 2026';

export type LegalBlock = { h: string; p?: string[]; ul?: string[]; links?: { label: string; href: string }[] };
export type LegalPageContent = { path: string; title: string; description: string; intro: string; blocks: LegalBlock[] };

const titolare = 'Marenetto s.r.l. unipersonale (P.IVA IT06471740826), SS 113 Settentrionale Sicula 73b, 90015 Cefalù (PA), email info@marenetto.com, tel. +39 333 936 3007';

export const privacyPage: LegalPageContent = {
  path: '/privacy',
  title: 'Informativa sulla privacy',
  description: 'Come Marenetto Build tratta i dati personali di chi invia una richiesta o visita il sito, ai sensi degli artt. 13 e 14 del Regolamento UE 2016/679 (GDPR).',
  intro: `Questa informativa spiega come vengono trattati i dati personali di chi visita marenettobuild.com o invia una richiesta tramite il sito. Ultimo aggiornamento: ${LEGAL_UPDATED_LABEL}.`,
  blocks: [
    { h: 'Titolare del trattamento', p: [`Il titolare del trattamento è ${titolare}.`, 'Per qualsiasi domanda sui tuoi dati o per esercitare i tuoi diritti puoi scrivere a info@marenetto.com.'] },
    { h: 'Quali dati trattiamo e perché', ul: [
      'Modulo di richiesta: nome e cognome, email, telefono/WhatsApp, canale e lingua preferiti, dettagli del progetto o della proprietà, eventuale budget e periodo, eventuali esigenze di alloggio o accessibilità che scegli di segnalare. Il modulo li invia per email al titolare e non li salva nel database del sito. Li usiamo solo per rispondere alla tua richiesta e ricontattarti. Base giuridica: misure precontrattuali richieste da te e, per il contatto, il tuo consenso espresso spuntando la casella privacy (art. 6.1 lett. b e a GDPR).',
      'Contatti diretti (email, telefono, WhatsApp): i dati che ci comunichi, usati solo per risponderti. Base giuridica: misure precontrattuali o legittimo interesse a rispondere (art. 6.1 lett. b e f).',
      'Dati tecnici di navigazione e sicurezza (indirizzo IP, data e ora, pagina richiesta, tipo di browser) registrati dai server per il funzionamento e la sicurezza del sito. Base giuridica: legittimo interesse alla sicurezza e al corretto funzionamento (art. 6.1 lett. f).',
      'Statistiche di visita: solo se acconsenti, con le modalità descritte nella pagina Cookie e analytics. Base giuridica: consenso (art. 6.1 lett. a), revocabile in qualsiasi momento.',
      'Marketing e misurazione pubblicitaria: solo con consenso marketing distinto dalle statistiche, il Meta Pixel invia gli eventi PageView, Contact e Lead al fornitore Meta Platforms Ireland Ltd. Base giuridica: consenso (art. 6.1 lett. a), revocabile da “Preferenze cookie”. Non inviamo a Meta i dati del modulo o i recapiti; la connessione trasmette comunque indirizzo IP e metadati tecnici di rete. Dettagli e limiti nella pagina Cookie e analytics.',
      'Area riservata: per il personale autorizzato, i dati di accesso gestiti dal fornitore di autenticazione. Non è destinata ai visitatori e non contiene dati dei clienti raccolti dal sito.',
    ] },
    { h: 'Meta Pixel e trasferimenti', p: ['Dopo consenso marketing il fornitore Meta Platforms Ireland Ltd riceve dati tecnici per misurazione e pubblicità, con possibili trattamenti fuori dallo Spazio Economico Europeo. Le condizioni e le garanzie applicabili sono descritte dal fornitore in https://www.facebook.com/legal/technology_terms e https://www.facebook.com/privacy/policy/. L’installazione tecnica non certifica specifici accordi o garanzie del titolare: questi devono essere verificati con il fornitore. Il consenso non elimina i dati tecnici necessari alla comunicazione.'] },
    { h: 'Dati particolari', p: ['Non ti chiediamo categorie particolari di dati. Se indichi spontaneamente esigenze di accessibilità o mobilità, le usiamo solo per organizzare al meglio il contatto e l’eventuale intervento; evita di inserire informazioni sanitarie non necessarie.'] },
    { h: 'A chi comunichiamo i dati', p: ['Usiamo fornitori che trattano i dati per nostro conto come responsabili del trattamento:'], ul: [
      'hosting e infrastruttura cloud del sito;',
      'invio delle email di notifica (provider SMTP configurato dal titolare);',
      'autenticazione dell’area riservata (Clerk);',
      'strumenti statistici di Google (Google Analytics 4 e Search Console), solo come descritto nella pagina Cookie e analytics.',
    ] },
    { h: 'Trasferimenti fuori dallo Spazio Economico Europeo', p: ['Alcuni fornitori hanno sede o infrastrutture negli Stati Uniti. I trasferimenti avvengono sulla base della decisione di adeguatezza della Commissione europea per i soggetti aderenti al Data Privacy Framework UE-USA oppure delle clausole contrattuali standard.'] },
    { h: 'Per quanto tempo conserviamo i dati', ul: [
      'Richieste e contatti ricevuti per email, telefono o WhatsApp: restano nella casella di posta e nei contatti del titolare per il tempo necessario a rispondere e, se non seguono incarichi, vengono cancellati periodicamente. Il sito non ne tiene copia.',
      'Se si instaura un rapporto contrattuale: per la durata del rapporto e poi per i termini previsti da legge fiscale e civile (in genere 10 anni).',
      'Log tecnici: per periodi brevi, in linea con la sicurezza del servizio.',
      'Dati statistici: secondo le impostazioni di conservazione dello strumento, impostate al minimo disponibile.',
    ] },
    { h: 'I tuoi diritti', p: ['Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità dei tuoi dati e opporti al trattamento fondato sul legittimo interesse. Puoi revocare il consenso in ogni momento senza pregiudicare la liceità del trattamento già avvenuto. Scrivi a info@marenetto.com: rispondiamo entro un mese.', 'Hai inoltre il diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).'] },
    { h: 'Conferimento dei dati', p: ['I campi contrassegnati come obbligatori nel modulo sono necessari per poterti ricontattare; senza di essi non possiamo gestire la richiesta. Tutto il resto è facoltativo.'] },
    { h: 'Contenuti generati con intelligenza artificiale', p: ['Il sito utilizza contenuti generati tramite intelligenza artificiale.'] },
    { h: 'Aggiornamenti', p: [`Questa informativa può essere aggiornata. La versione in vigore è sempre quella pubblicata su questa pagina, con la data di aggiornamento indicata sopra (versione ${LEGAL_VERSION}).`] },
  ],
};

export const cookiePage: LegalPageContent = {
  path: '/cookie',
  title: 'Cookie e analytics',
  description: 'Quali strumenti di misurazione usa marenettobuild.com, quando si attivano e come negare o revocare il consenso.',
  intro: `Questa pagina descrive i cookie e gli strumenti di misurazione del sito. Ultimo aggiornamento: ${LEGAL_UPDATED_LABEL}.`,
  blocks: [
    { h: 'In breve', ul: [
      'Il sito offre due scelte indipendenti: statistiche (Google Analytics 4) e marketing (Meta Pixel), entrambe inizialmente negate. Il consenso a una categoria non autorizza l’altra.',
      'Le statistiche di visita (Google Analytics 4) si attivano solo dopo il tuo consenso esplicito e si fermano subito se lo revochi.',
      'Se non scegli, o rifiuti, non si attivano statistiche né marketing. Accetta e Rifiuta hanno pari evidenza; Personalizza permette di scegliere le singole categorie.',
    ] },
    { h: 'Strumenti tecnici', p: ['Il sito può salvare nel tuo browser dati strettamente necessari al funzionamento, come la scelta sulle preferenze cookie, la lingua e l’eventuale sessione dell’area riservata. Non richiedono consenso e non servono a tracciarti. La scelta di statistiche e marketing è conservata nel browser per 180 giorni (circa sei mesi), senza identificativo personale. Le scelte precedenti a questa versione non autorizzano il marketing; una nuova versione richiede una nuova scelta. Se il browser impedisce il salvataggio, le due categorie restano disattivate.'] },
    { h: 'Google Analytics 4 (solo con consenso)', p: ['Se scegli di consentire le statistiche, misuriamo in forma aggregata le pagine visitate e il modo in cui arrivi al sito, per capire cosa migliorare. Lo strumento è configurato in modalità riservata: indirizzo IP non conservato, nessuna funzione pubblicitaria, nessun segnale per annunci personalizzati e nessuna condivisione dei dati con altri servizi Google a fini pubblicitari, con la conservazione dei dati al minimo disponibile.', 'Titolare del trattamento è Marenetto s.r.l. unipersonale; fornitore è Google (anche Google Ireland Ltd. e Google LLC, con possibile trasferimento negli Stati Uniti secondo quanto indicato nell’informativa privacy).'] },
    { h: 'Search Console', p: ['Usiamo Google Search Console per verificare come il sito compare nei risultati di ricerca. Riguarda dati aggregati delle ricerche, non i tuoi dati di navigazione.'] },
    { h: 'Meta Pixel (solo con consenso marketing)', p: [
      'Fornitore: Meta Platforms Ireland Ltd. Finalità: misurazione delle visite e delle azioni e pubblicità. Inviamo solo PageView sulle pagine pubbliche, Contact per clic di contatto e Lead dopo conferma di invio riuscito della richiesta via email: non è prova di consegna alla casella o di acquisizione di un cliente. Non inviamo eventi dalle aree riservate o dalle anteprime.',
      'Questa installazione usa il trasporto immagine documentato da Meta, generato via JavaScript dopo consenso: non carica l’SDK Meta e non esegue codice Meta nella pagina. Advanced Matching e rilevazione automatica di eventi e dati non sono abilitati. Nei parametri inviamo soltanto identificativo del Pixel, tipo e istante tecnico dell’evento e URL pubblico senza query o frammenti; il referrer HTTP è soppresso. Non inviamo titoli, nomi, recapiti, identificativi utente, valori o nomi dei campi né hash dei contatti. Meta riceve comunque IP e dati tecnici del browser e della connessione: non garantiamo assenza assoluta di dati personali.',
      'Cookie: questa variante non crea né trasmette identificatori proprietari _fbp o _fbc e usa richieste immagini anonime senza credenziali cross-origin, quindi non usa i cookie del dominio Meta per questi eventi. Non ha una durata di cookie pubblicitari da applicare. Le varianti SDK di Meta possono usare cookie con durate proprie, ma non sono caricate dal sito; non attribuiamo a questa installazione durate di cookie che non imposta. Alla revoca rimuoviamo anche eventuali _fbp e _fbc precedenti accessibili al sito; i cookie di altri domini e quelli non accessibili da JavaScript restano gestibili dalle impostazioni del browser.',
      'Documentazione del fornitore: https://developers.facebook.com/documentation/meta-pixel/advanced/ (trasporto immagine e configurazione automatica), https://developers.facebook.com/documentation/meta-pixel/implementation/gdpr (dati tecnici e consenso), https://www.facebook.com/privacy/policies/cookies/ (cookie), https://www.facebook.com/privacy/policy/ (privacy). Per i possibili trasferimenti si veda anche la sezione Meta dell’informativa privacy.',
    ] },
    { h: 'Documentazione Meta', links: [
      { label: 'Meta Pixel: implementazioni e configurazione', href: 'https://developers.facebook.com/documentation/meta-pixel/advanced/' },
      { label: 'Meta Pixel: dati tecnici e consenso', href: 'https://developers.facebook.com/documentation/meta-pixel/implementation/gdpr' },
      { label: 'Informativa cookie di Meta', href: 'https://www.facebook.com/privacy/policies/cookies/' },
      { label: 'Informativa privacy di Meta', href: 'https://www.facebook.com/privacy/policy/' },
      { label: 'Condizioni delle tecnologie Meta', href: 'https://www.facebook.com/legal/technology_terms' },
    ] },
    { h: 'Come dare o revocare il consenso', p: ['Puoi scegliere, cambiare o revocare in qualsiasi momento ciascuna categoria dal link “Preferenze cookie” nel footer. Aprirlo non modifica le scelte. Dopo il salvataggio la barra scompare; la scelta non viene rinnovata automaticamente durante la navigazione. Revocare marketing ferma subito i nuovi eventi Meta senza revocare statistiche ancora autorizzate. Non essendo eseguito codice Meta, non restano timer o rilevamenti dell’SDK da arrestare. Una richiesta di rete già partita non può essere ritirata dal fornitore. La revoca delle statistiche ferma Google e può ricaricare la pagina per eliminare il codice già eseguito, senza cambiare l’altra categoria. Puoi anche cancellare i dati del sito dalle impostazioni del browser.'] },
    { h: 'Altri servizi', p: ['I pulsanti per contattarci via telefono, email o WhatsApp aprono le relative applicazioni. Se li usi, la comunicazione è regolata dall’informativa del servizio scelto.'] },
    { h: 'Maggiori informazioni', p: ['Per sapere come trattiamo i tuoi dati personali leggi l’informativa sulla privacy. Per domande scrivi a info@marenetto.com.'] },
  ],
};

export const legalPages = [privacyPage, cookiePage] as const;
export const AI_NOTICE = 'Il sito utilizza contenuti generati tramite intelligenza artificiale.';
