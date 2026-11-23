/** Testi delle pagine legali pubbliche. Versione unica usata anche come versione dell'informativa analytics. */
export const LEGAL_VERSION = '2026-11-23';
export const LEGAL_UPDATED_LABEL = '23 novembre 2026';

export type LegalBlock = { h: string; p?: string[]; ul?: string[] };
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
      'Area riservata: per il personale autorizzato, i dati di accesso gestiti dal fornitore di autenticazione. Non è destinata ai visitatori e non contiene dati dei clienti raccolti dal sito.',
    ] },
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
      'Il sito non usa cookie di profilazione né di marketing.',
      'Le statistiche di visita (Google Analytics 4) si attivano solo dopo il tuo consenso esplicito e si fermano subito se lo revochi.',
      'Se non scegli, o rifiuti, non viene raccolto alcun dato statistico.',
    ] },
    { h: 'Strumenti tecnici', p: ['Il sito può salvare nel tuo browser dati strettamente necessari al funzionamento, come la scelta sulle preferenze analytics, la lingua e l’eventuale sessione dell’area riservata. Non richiedono consenso e non servono a tracciarti.'] },
    { h: 'Google Analytics 4 (solo con consenso)', p: ['Se scegli di consentire le statistiche, misuriamo in forma aggregata le pagine visitate e il modo in cui arrivi al sito, per capire cosa migliorare. Lo strumento è configurato in modalità riservata: indirizzo IP non conservato, nessuna funzione pubblicitaria, nessun segnale per annunci personalizzati e nessuna condivisione dei dati con altri servizi Google a fini pubblicitari, con la conservazione dei dati al minimo disponibile.', 'Titolare del trattamento è Marenetto s.r.l. unipersonale; fornitore è Google (anche Google Ireland Ltd. e Google LLC, con possibile trasferimento negli Stati Uniti secondo quanto indicato nell’informativa privacy).'] },
    { h: 'Search Console', p: ['Usiamo Google Search Console per verificare come il sito compare nei risultati di ricerca. Riguarda dati aggregati delle ricerche, non i tuoi dati di navigazione.'] },
    { h: 'Come dare o revocare il consenso', p: ['Puoi scegliere, cambiare o revocare in qualsiasi momento il consenso dalle preferenze analytics del sito. Revocare è semplice quanto accettare: dopo la revoca le statistiche si fermano subito. Puoi anche cancellare i dati del sito dalle impostazioni del browser.'] },
    { h: 'Altri servizi', p: ['I pulsanti per contattarci via telefono, email o WhatsApp aprono le relative applicazioni. Se li usi, la comunicazione è regolata dall’informativa del servizio scelto.'] },
    { h: 'Maggiori informazioni', p: ['Per sapere come trattiamo i tuoi dati personali leggi l’informativa sulla privacy. Per domande scrivi a info@marenetto.com.'] },
  ],
};

export const legalPages = [privacyPage, cookiePage] as const;
export const AI_NOTICE = 'Il sito utilizza contenuti generati tramite intelligenza artificiale.';
