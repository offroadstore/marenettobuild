import { professionalFormCopy } from './professionals';
// Localized UI copy for the callback request form, receipt and privacy addendum.
// Translations are working copy: their publication does not imply approval.
import type { CallDelivery } from '@workspace/api-client-react';
import { ownerDecisions } from './owner-decisions';
import { arabicCallCopy } from './call-request-ar';
import { callAtelierCopy } from './call-atelier-copy';

export const CALL_LOCALES = ['it', 'en', 'de', 'fr', 'es', 'nl', 'pt', 'pl', 'ru', 'sv', 'no', 'da', 'ar'] as const;
export type CallLang = typeof CALL_LOCALES[number];
export const toCallLang = (lang: string): CallLang => (CALL_LOCALES as readonly string[]).includes(lang) ? lang as CallLang : 'en';

export type CallCopy = {
  open: string; fixed: string; title: string; intro: string;
  firstName: string; lastName: string; email: string; mobile: string; mobileHint: string; whatsapp: string;
  project: string; projects: Record<'renovation' | 'construction' | 'concrete_furniture' | 'other', string>;
  location: string; budget: string; startWhen: string; timeSlot: string; morning: string; afternoon: string; noPref: string;
  prefLang: string; message: string; optional: string; requiredNote: string;
  privacyTitle: string; privacy: string[]; privacyAck: string; marketing: string; previewWarn: string;
  submit: string; sending: string; retry: string; close: string;
  errGeneric: string; errRequired: string; errEmail: string; errMobile: string; errPrivacy: string; errSummary: string;
  receiptTitle: string; receiptCode: string; synthetic: string; ownerLabel: string; customerLabel: string;
  delivery: Record<CallDelivery, string>; newRequest: string;
  ctx: { home: [string, string]; services: [string, string]; articles: [string, string] };
  errConfig: string; loadingConfig: string;
  footerLink: string; footerTitle: string; translationNote: string;
};

const en: CallCopy = {
  open: 'Request a callback', fixed: 'Callback', title: 'Request a callback', intro: 'Leave your details and we will call you back about your project. This is a request, not a booking.',
  firstName: 'First name', lastName: 'Last name', email: 'Email', mobile: 'Mobile number', mobileHint: 'International format, e.g. +44 7700 900123', whatsapp: 'You may also contact me on WhatsApp at this number',
  project: 'Type of project', projects: { renovation: 'Renovation', construction: 'Construction', concrete_furniture: 'Bespoke concrete furniture', other: 'Other' },
  location: 'Property location', budget: 'Indicative budget', startWhen: 'When would you like to start?', timeSlot: 'Best time to call', morning: 'Morning', afternoon: 'Afternoon', noPref: 'No preference',
  prefLang: 'Preferred language for the call', message: 'Message', optional: 'optional', requiredNote: 'Fields marked * are required.',
  privacyTitle: 'Privacy notice for callback requests',
  privacy: [
    'Controller contact: info@marenetto.com. We use your details to respond to your request before any contract (Art. 6(1)(b) GDPR). Optional marketing messages are sent only if you give separate consent (Art. 6(1)(a) GDPR), which you can withdraw at any time by writing to info@marenetto.com.',
    'First name, last name, email and mobile are required so we can reach you. WhatsApp contact is optional and used only if you tick it. Marketing consent is separate, optional and can be withdrawn at any time by writing to info@marenetto.com.',
    'We cannot guarantee availability, a call in your preferred language, or translation.',
    'Only the owner can access callback requests. Hosting infrastructure and email delivery providers process data under the site’s existing privacy notices and approvals.',
    'Requests are deleted after 12 months, except for actual contractual relationships subject to legal duties. Copies of emails already delivered to recipients must be deleted manually.',
    'We record the page you came from (sanitised) and only utm_source, utm_medium and utm_campaign. Analytics or advertising measurement runs only under a separate cookie consent and configuration; the checkboxes in this form do not enable it.',
    'To exercise your rights (access, correction, deletion, objection), write to info@marenetto.com.',
  ],
  privacyAck: 'I have read the privacy notice above and ask to be contacted about this request.', marketing: 'I also agree to receive occasional news from Marenetto Build (optional, can be withdrawn at any time).',
  previewWarn: 'Preview environment: the details you type are discarded. Only a synthetic test record is saved and the receipt will say so.',
  submit: 'Send request', sending: 'Sending…', retry: 'Try again', close: 'Close',
  errGeneric: 'The request could not be sent. Your details are still here; please try again.', errRequired: 'This field is required.', errEmail: 'Enter a valid email address.', errMobile: 'Use international format starting with +, e.g. +447700900123.', errPrivacy: 'Please confirm you have read the privacy notice.', errSummary: 'Please check the highlighted fields.',
  receiptTitle: 'Request recorded', receiptCode: 'Reference code', synthetic: 'Preview: your input was discarded and only a synthetic test record was saved.', ownerLabel: 'Notification to Marenetto', customerLabel: 'Confirmation email to you',
  delivery: { pending_provider: 'Not sent: email delivery is awaiting enablement, approval or configuration.', sending: 'Being sent; delivery not yet confirmed.', sent: 'Accepted by the email provider.', failed: 'Could not be sent.', uncertain: 'Status uncertain: it may or may not have been sent.', simulated: 'Simulated in preview; nothing was sent.' },
  newRequest: 'New request',
  ctx: { home: ['Prefer to talk it through?', 'Leave your number and we will call you back about your property near Cefalù.'], services: ['Not sure which service fits?', 'Describe the work in a short call. We will tell you what we do and what needs a specialist.'], articles: ['Questions after reading?', 'Ask for a callback about your own project.'] },
  errConfig: 'We could not check the request service, so the form cannot be sent yet.', loadingConfig: 'Checking the request service…',
  footerLink: 'Callback privacy notice', footerTitle: 'Callback requests', translationNote: 'This translation has not been formally approved.',
};

const it: CallCopy = {
  open: 'Richiedi una chiamata', fixed: 'Richiamami', title: 'Richiedi una chiamata', intro: 'Lascia i tuoi dati e ti richiamiamo per parlare del progetto. È una richiesta, non una prenotazione.',
  firstName: 'Nome', lastName: 'Cognome', email: 'Email', mobile: 'Cellulare', mobileHint: 'Formato internazionale, es. +39 333 123 4567', whatsapp: 'Potete contattarmi anche su WhatsApp a questo numero',
  project: 'Tipo di progetto', projects: { renovation: 'Ristrutturazione', construction: 'Costruzione', concrete_furniture: 'Arredo su misura in cemento', other: 'Altro' },
  location: 'Località dell’immobile', budget: 'Budget indicativo', startWhen: 'Quando vorresti iniziare?', timeSlot: 'Fascia oraria preferita', morning: 'Mattina', afternoon: 'Pomeriggio', noPref: 'Nessuna preferenza',
  prefLang: 'Lingua preferita per la chiamata', message: 'Messaggio', optional: 'facoltativo', requiredNote: 'I campi con * sono obbligatori.',
  privacyTitle: 'Informativa privacy per le richieste di chiamata',
  privacy: [
    'Contatto del titolare: info@marenetto.com. Usiamo i tuoi dati per rispondere alla richiesta prima di qualsiasi contratto (art. 6(1)(b) GDPR). Eventuali comunicazioni marketing facoltative sono inviate solo con un consenso separato (art. 6(1)(a) GDPR), revocabile in qualsiasi momento scrivendo a info@marenetto.com.',
    'Nome, cognome, email e cellulare sono necessari per ricontattarti. Il contatto WhatsApp è facoltativo e usato solo se lo selezioni. Il consenso marketing è separato, facoltativo e revocabile in qualsiasi momento scrivendo a info@marenetto.com.',
    'Non garantiamo disponibilità, una chiamata nella lingua preferita né traduzioni.',
    'Solo il titolare accede alle richieste. Infrastruttura di hosting e fornitori di invio email trattano i dati secondo le informative e approvazioni già in vigore sul sito.',
    'Le richieste sono cancellate dopo 12 mesi, salvo rapporti contrattuali effettivi soggetti agli obblighi di legge. Le copie delle email già recapitate ai destinatari vanno cancellate manualmente.',
    'Registriamo la pagina di provenienza (ripulita) e solo utm_source, utm_medium e utm_campaign. Statistiche o misurazioni pubblicitarie funzionano solo con un consenso cookie e una configurazione separati; le caselle di questo modulo non le attivano.',
    'Per esercitare i tuoi diritti (accesso, rettifica, cancellazione, opposizione) scrivi a info@marenetto.com.',
  ],
  privacyAck: 'Ho letto l’informativa qui sopra e chiedo di essere ricontattato per questa richiesta.', marketing: 'Accetto anche di ricevere occasionali novità da Marenetto Build (facoltativo, revocabile in qualsiasi momento).',
  previewWarn: 'Ambiente di anteprima: i dati inseriti vengono scartati. Viene salvato solo un record di prova sintetico e la ricevuta lo indicherà.',
  submit: 'Invia richiesta', sending: 'Invio…', retry: 'Riprova', close: 'Chiudi',
  errGeneric: 'Non è stato possibile inviare la richiesta. I dati sono ancora qui: riprova.', errRequired: 'Campo obbligatorio.', errEmail: 'Inserisci un indirizzo email valido.', errMobile: 'Usa il formato internazionale con +, es. +393331234567.', errPrivacy: 'Conferma di aver letto l’informativa.', errSummary: 'Controlla i campi evidenziati.',
  receiptTitle: 'Richiesta registrata', receiptCode: 'Codice di riferimento', synthetic: 'Anteprima: i dati inseriti sono stati scartati ed è stato salvato solo un record di prova sintetico.', ownerLabel: 'Notifica a Marenetto', customerLabel: 'Email di conferma a te',
  delivery: { pending_provider: 'Non inviata: l’invio email è in attesa di attivazione, approvazione o configurazione.', sending: 'In invio; consegna non ancora confermata.', sent: 'Accettata dal fornitore email.', failed: 'Invio non riuscito.', uncertain: 'Stato incerto: potrebbe essere stata inviata o no.', simulated: 'Simulata in anteprima; nulla è stato inviato.' },
  newRequest: 'Nuova richiesta',
  ctx: { home: ['Preferisci parlarne a voce?', 'Lascia il tuo numero e ti richiamiamo per la tua proprietà vicino a Cefalù.'], services: ['Non sai quale servizio fa per te?', 'Descrivi il lavoro in una breve chiamata: ti diciamo cosa facciamo noi e cosa richiede uno specialista.'], articles: ['Domande dopo la lettura?', 'Chiedi una chiamata sul tuo progetto.'] },
  errConfig: 'Non è stato possibile verificare il servizio richieste: il modulo non può ancora essere inviato.', loadingConfig: 'Verifica del servizio richieste…',
  footerLink: 'Informativa richieste di chiamata', footerTitle: 'Richieste di chiamata', translationNote: '',
};

const de: CallCopy = {
  open: 'Rückruf anfordern', fixed: 'Rückruf', title: 'Rückruf anfordern', intro: 'Hinterlassen Sie Ihre Daten, wir rufen Sie zu Ihrem Projekt zurück. Dies ist eine Anfrage, keine Buchung.',
  firstName: 'Vorname', lastName: 'Nachname', email: 'E-Mail', mobile: 'Mobilnummer', mobileHint: 'Internationales Format, z. B. +49 151 23456789', whatsapp: 'Sie dürfen mich unter dieser Nummer auch per WhatsApp kontaktieren',
  project: 'Art des Projekts', projects: { renovation: 'Renovierung', construction: 'Neubau', concrete_furniture: 'Betonmöbel nach Maß', other: 'Sonstiges' },
  location: 'Lage der Immobilie', budget: 'Ungefähres Budget', startWhen: 'Wann möchten Sie beginnen?', timeSlot: 'Beste Zeit für den Anruf', morning: 'Vormittag', afternoon: 'Nachmittag', noPref: 'Keine Präferenz',
  prefLang: 'Bevorzugte Sprache für den Anruf', message: 'Nachricht', optional: 'optional', requiredNote: 'Mit * markierte Felder sind Pflichtfelder.',
  privacyTitle: 'Datenschutzhinweis für Rückrufanfragen',
  privacy: [
    'Kontakt des Verantwortlichen: info@marenetto.com. Wir verwenden Ihre Daten, um vor einem Vertragsschluss auf Ihre Anfrage zu antworten (Art. 6 Abs. 1 lit. b DSGVO). Freiwillige Marketing-Nachrichten erhalten Sie nur mit gesonderter Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit per E-Mail an info@marenetto.com widerrufen können.',
    'Vorname, Nachname, E-Mail und Mobilnummer sind erforderlich, um Sie zu erreichen. WhatsApp-Kontakt ist freiwillig und erfolgt nur, wenn Sie ihn ankreuzen. Die Marketing-Einwilligung ist separat, freiwillig und jederzeit per E-Mail an info@marenetto.com widerrufbar.',
    'Wir garantieren weder Verfügbarkeit noch einen Anruf in Ihrer Wunschsprache noch eine Übersetzung.',
    'Nur der Inhaber hat Zugriff auf Rückrufanfragen. Hosting-Infrastruktur und E-Mail-Versanddienstleister verarbeiten Daten gemäß den bestehenden Datenschutzhinweisen und Freigaben der Website.',
    'Anfragen werden nach 24 Monaten gelöscht, außer bei ausdrücklich gewonnenen Kunden, deren Daten nach vertraglichen oder gesetzlichen Pflichten aufbewahrt werden. Kopien bereits zugestellter E-Mails müssen bei den Empfängern manuell gelöscht werden.',
    'Wir speichern die Herkunftsseite (bereinigt) und nur utm_source, utm_medium und utm_campaign. Statistik- oder Werbemessung erfolgt nur mit separater Cookie-Einwilligung und Konfiguration; die Kästchen dieses Formulars aktivieren sie nicht.',
    'Zur Ausübung Ihrer Rechte (Auskunft, Berichtigung, Löschung, Widerspruch) schreiben Sie an info@marenetto.com.',
  ],
  privacyAck: 'Ich habe den obigen Hinweis gelesen und bitte um Kontakt zu dieser Anfrage.', marketing: 'Ich möchte außerdem gelegentlich Neuigkeiten von Marenetto Build erhalten (freiwillig, jederzeit widerrufbar).',
  previewWarn: 'Vorschauumgebung: Ihre Eingaben werden verworfen. Gespeichert wird nur ein synthetischer Testdatensatz, die Bestätigung weist darauf hin.',
  submit: 'Anfrage senden', sending: 'Wird gesendet…', retry: 'Erneut versuchen', close: 'Schließen',
  errGeneric: 'Die Anfrage konnte nicht gesendet werden. Ihre Angaben sind noch vorhanden; bitte erneut versuchen.', errRequired: 'Pflichtfeld.', errEmail: 'Bitte gültige E-Mail-Adresse eingeben.', errMobile: 'Internationales Format mit +, z. B. +4915123456789.', errPrivacy: 'Bitte bestätigen Sie den Datenschutzhinweis.', errSummary: 'Bitte prüfen Sie die markierten Felder.',
  receiptTitle: 'Anfrage erfasst', receiptCode: 'Referenzcode', synthetic: 'Vorschau: Ihre Eingaben wurden verworfen, gespeichert wurde nur ein synthetischer Testdatensatz.', ownerLabel: 'Benachrichtigung an Marenetto', customerLabel: 'Bestätigungs-E-Mail an Sie',
  delivery: { pending_provider: 'Nicht gesendet: Der E-Mail-Versand wartet auf Freischaltung, Genehmigung oder Konfiguration.', sending: 'Wird gesendet; Zustellung noch nicht bestätigt.', sent: 'Vom E-Mail-Anbieter angenommen.', failed: 'Konnte nicht gesendet werden.', uncertain: 'Status unklar: möglicherweise gesendet, möglicherweise nicht.', simulated: 'In der Vorschau simuliert; nichts wurde gesendet.' },
  newRequest: 'Neue Anfrage',
  ctx: { home: ['Lieber persönlich sprechen?', 'Hinterlassen Sie Ihre Nummer, wir rufen Sie zu Ihrer Immobilie bei Cefalù zurück.'], services: ['Unsicher, welche Leistung passt?', 'Beschreiben Sie die Arbeiten in einem kurzen Gespräch.'], articles: ['Fragen nach dem Lesen?', 'Fordern Sie einen Rückruf zu Ihrem Projekt an.'] },
  errConfig: 'Der Anfragedienst konnte nicht geprüft werden; das Formular kann noch nicht gesendet werden.', loadingConfig: 'Anfragedienst wird geprüft…',
  footerLink: 'Datenschutz Rückrufanfragen', footerTitle: 'Rückrufanfragen', translationNote: 'Diese Übersetzung ist nicht formell freigegeben.',
};

const fr: CallCopy = {
  open: 'Être rappelé', fixed: 'Rappel', title: 'Demander un rappel', intro: 'Laissez vos coordonnées et nous vous rappellerons au sujet de votre projet. Il s’agit d’une demande, pas d’une réservation.',
  firstName: 'Prénom', lastName: 'Nom', email: 'E-mail', mobile: 'Numéro de mobile', mobileHint: 'Format international, ex. +33 6 12 34 56 78', whatsapp: 'Vous pouvez aussi me contacter sur WhatsApp à ce numéro',
  project: 'Type de projet', projects: { renovation: 'Rénovation', construction: 'Construction', concrete_furniture: 'Mobilier en béton sur mesure', other: 'Autre' },
  location: 'Lieu du bien', budget: 'Budget indicatif', startWhen: 'Quand souhaitez-vous commencer ?', timeSlot: 'Moment préféré pour l’appel', morning: 'Matin', afternoon: 'Après-midi', noPref: 'Sans préférence',
  prefLang: 'Langue préférée pour l’appel', message: 'Message', optional: 'facultatif', requiredNote: 'Les champs marqués * sont obligatoires.',
  privacyTitle: 'Notice de confidentialité des demandes de rappel',
  privacy: [
    'Contact du responsable du traitement : info@marenetto.com. Nous utilisons vos données pour répondre à votre demande avant tout contrat (art. 6, par. 1, b) RGPD). Les messages marketing facultatifs ne sont envoyés qu’avec un consentement distinct (art. 6, par. 1, a) RGPD), révocable à tout moment en écrivant à info@marenetto.com.',
    'Prénom, nom, e-mail et mobile sont nécessaires pour vous joindre. Le contact WhatsApp est facultatif et utilisé seulement si vous le cochez. Le consentement marketing est distinct, facultatif et révocable à tout moment en écrivant à info@marenetto.com.',
    'Nous ne garantissons ni disponibilité, ni appel dans votre langue préférée, ni traduction.',
    'Seul le titulaire accède aux demandes de rappel. L’infrastructure d’hébergement et les prestataires d’envoi d’e-mails traitent les données selon les notices et validations déjà en vigueur sur le site.',
    'Les demandes sont supprimées après 24 mois, sauf pour les clients explicitement acquis, dont les données sont conservées selon les obligations contractuelles ou légales. Les copies d’e-mails déjà remis aux destinataires doivent être supprimées manuellement.',
    'Nous enregistrons la page d’origine (nettoyée) et seulement utm_source, utm_medium et utm_campaign. La mesure statistique ou publicitaire ne fonctionne qu’avec un consentement cookies et une configuration distincts ; les cases de ce formulaire ne l’activent pas.',
    'Pour exercer vos droits (accès, rectification, effacement, opposition), écrivez à info@marenetto.com.',
  ],
  privacyAck: 'J’ai lu la notice ci-dessus et je demande à être contacté pour cette demande.', marketing: 'J’accepte aussi de recevoir des nouvelles occasionnelles de Marenetto Build (facultatif, révocable à tout moment).',
  previewWarn: 'Environnement de prévisualisation : vos saisies sont supprimées. Seul un enregistrement de test synthétique est conservé et le reçu l’indiquera.',
  submit: 'Envoyer la demande', sending: 'Envoi…', retry: 'Réessayer', close: 'Fermer',
  errGeneric: 'La demande n’a pas pu être envoyée. Vos informations sont conservées ici ; réessayez.', errRequired: 'Champ obligatoire.', errEmail: 'Saisissez une adresse e-mail valide.', errMobile: 'Format international avec +, ex. +33612345678.', errPrivacy: 'Confirmez avoir lu la notice.', errSummary: 'Vérifiez les champs signalés.',
  receiptTitle: 'Demande enregistrée', receiptCode: 'Code de référence', synthetic: 'Prévisualisation : vos saisies ont été supprimées, seul un enregistrement de test synthétique a été conservé.', ownerLabel: 'Notification à Marenetto', customerLabel: 'E-mail de confirmation pour vous',
  delivery: { pending_provider: 'Non envoyé : l’envoi d’e-mails attend une activation, une approbation ou une configuration.', sending: 'Envoi en cours ; livraison non confirmée.', sent: 'Accepté par le fournisseur d’e-mail.', failed: 'Envoi impossible.', uncertain: 'Statut incertain : peut-être envoyé, peut-être pas.', simulated: 'Simulé en prévisualisation ; rien n’a été envoyé.' },
  newRequest: 'Nouvelle demande',
  ctx: { home: ['Vous préférez en parler ?', 'Laissez votre numéro, nous vous rappelons au sujet de votre bien près de Cefalù.'], services: ['Quel service vous convient ?', 'Décrivez les travaux lors d’un court appel.'], articles: ['Des questions après la lecture ?', 'Demandez un rappel sur votre propre projet.'] },
  errConfig: 'Impossible de vérifier le service de demandes : le formulaire ne peut pas encore être envoyé.', loadingConfig: 'Vérification du service de demandes…',
  footerLink: 'Confidentialité des rappels', footerTitle: 'Demandes de rappel', translationNote: 'Cette traduction n’a pas été formellement approuvée.',
};

const es: CallCopy = {
  open: 'Solicitar una llamada', fixed: 'Llamada', title: 'Solicitar una llamada', intro: 'Déjanos tus datos y te llamaremos para hablar de tu proyecto. Es una solicitud, no una reserva.',
  firstName: 'Nombre', lastName: 'Apellidos', email: 'Correo electrónico', mobile: 'Móvil', mobileHint: 'Formato internacional, p. ej. +34 612 345 678', whatsapp: 'También podéis contactarme por WhatsApp en este número',
  project: 'Tipo de proyecto', projects: { renovation: 'Reforma', construction: 'Construcción', concrete_furniture: 'Muebles de hormigón a medida', other: 'Otro' },
  location: 'Ubicación del inmueble', budget: 'Presupuesto orientativo', startWhen: '¿Cuándo te gustaría empezar?', timeSlot: 'Mejor momento para llamar', morning: 'Mañana', afternoon: 'Tarde', noPref: 'Sin preferencia',
  prefLang: 'Idioma preferido para la llamada', message: 'Mensaje', optional: 'opcional', requiredNote: 'Los campos con * son obligatorios.',
  privacyTitle: 'Aviso de privacidad para solicitudes de llamada',
  privacy: [
    'Contacto del responsable: info@marenetto.com. Usamos tus datos para responder a tu solicitud antes de cualquier contrato (art. 6.1.b RGPD). Los mensajes de marketing opcionales solo se envían con un consentimiento aparte (art. 6.1.a RGPD), que puedes retirar en cualquier momento escribiendo a info@marenetto.com.',
    'Nombre, apellidos, correo y móvil son necesarios para contactarte. El contacto por WhatsApp es opcional y solo se usa si lo marcas. El consentimiento de marketing es independiente, opcional y puede retirarse en cualquier momento escribiendo a info@marenetto.com.',
    'No garantizamos disponibilidad, una llamada en tu idioma preferido ni traducción.',
    'Solo el titular accede a las solicitudes. La infraestructura de alojamiento y los proveedores de envío de correo tratan los datos según los avisos y aprobaciones ya vigentes en el sitio.',
    'Las solicitudes se eliminan a los 24 meses, salvo clientes adquiridos explícitamente, cuyos datos se conservan según obligaciones contractuales o legales. Las copias de correos ya entregados a los destinatarios deben eliminarse manualmente.',
    'Registramos la página de origen (depurada) y solo utm_source, utm_medium y utm_campaign. La medición analítica o publicitaria solo funciona con un consentimiento de cookies y una configuración aparte; las casillas de este formulario no la activan.',
    'Para ejercer tus derechos (acceso, rectificación, supresión, oposición), escribe a info@marenetto.com.',
  ],
  privacyAck: 'He leído el aviso anterior y pido que me contacten sobre esta solicitud.', marketing: 'También acepto recibir novedades ocasionales de Marenetto Build (opcional, revocable en cualquier momento).',
  previewWarn: 'Entorno de vista previa: los datos que escribas se descartan. Solo se guarda un registro de prueba sintético y el justificante lo indicará.',
  submit: 'Enviar solicitud', sending: 'Enviando…', retry: 'Reintentar', close: 'Cerrar',
  errGeneric: 'No se pudo enviar la solicitud. Tus datos siguen aquí; inténtalo de nuevo.', errRequired: 'Campo obligatorio.', errEmail: 'Introduce un correo válido.', errMobile: 'Formato internacional con +, p. ej. +34612345678.', errPrivacy: 'Confirma que has leído el aviso.', errSummary: 'Revisa los campos marcados.',
  receiptTitle: 'Solicitud registrada', receiptCode: 'Código de referencia', synthetic: 'Vista previa: tus datos se descartaron y solo se guardó un registro de prueba sintético.', ownerLabel: 'Aviso a Marenetto', customerLabel: 'Correo de confirmación para ti',
  delivery: { pending_provider: 'No enviado: el envío de correo está pendiente de activación, aprobación o configuración.', sending: 'Enviándose; entrega no confirmada.', sent: 'Aceptado por el proveedor de correo.', failed: 'No se pudo enviar.', uncertain: 'Estado incierto: puede que se haya enviado o no.', simulated: 'Simulado en vista previa; no se envió nada.' },
  newRequest: 'Nueva solicitud',
  ctx: { home: ['¿Prefieres hablarlo?', 'Deja tu número y te llamamos sobre tu propiedad cerca de Cefalù.'], services: ['¿No sabes qué servicio encaja?', 'Describe el trabajo en una llamada breve.'], articles: ['¿Dudas tras la lectura?', 'Pide una llamada sobre tu proyecto.'] },
  errConfig: 'No se pudo comprobar el servicio de solicitudes; aún no se puede enviar el formulario.', loadingConfig: 'Comprobando el servicio de solicitudes…',
  footerLink: 'Privacidad de llamadas', footerTitle: 'Solicitudes de llamada', translationNote: 'Esta traducción no ha sido aprobada formalmente.',
};

const nl: CallCopy = {
  open: 'Terugbelverzoek', fixed: 'Terugbellen', title: 'Vraag een terugbelverzoek aan', intro: 'Laat uw gegevens achter en wij bellen u terug over uw project. Dit is een verzoek, geen boeking.',
  firstName: 'Voornaam', lastName: 'Achternaam', email: 'E-mail', mobile: 'Mobiel nummer', mobileHint: 'Internationaal formaat, bijv. +31 6 12345678', whatsapp: 'U mag mij op dit nummer ook via WhatsApp benaderen',
  project: 'Soort project', projects: { renovation: 'Renovatie', construction: 'Bouw', concrete_furniture: 'Betonnen meubels op maat', other: 'Overig' },
  location: 'Locatie van de woning', budget: 'Indicatief budget', startWhen: 'Wanneer wilt u beginnen?', timeSlot: 'Beste tijd om te bellen', morning: 'Ochtend', afternoon: 'Middag', noPref: 'Geen voorkeur',
  prefLang: 'Voorkeurstaal voor het gesprek', message: 'Bericht', optional: 'optioneel', requiredNote: 'Velden met * zijn verplicht.',
  privacyTitle: 'Privacyverklaring voor terugbelverzoeken',
  privacy: [
    'Contact van de verwerkingsverantwoordelijke: info@marenetto.com. We gebruiken uw gegevens om vóór een eventuele overeenkomst op uw verzoek te reageren (art. 6, lid 1, b AVG). Optionele marketingberichten sturen we alleen met aparte toestemming (art. 6, lid 1, a AVG), die u altijd kunt intrekken via info@marenetto.com.',
    'Voornaam, achternaam, e-mail en mobiel zijn nodig om u te bereiken. Contact via WhatsApp is optioneel en alleen als u dit aanvinkt. Toestemming voor marketing is los, optioneel en altijd in te trekken via info@marenetto.com.',
    'We garanderen geen beschikbaarheid, geen gesprek in uw voorkeurstaal en geen vertaling.',
    'Alleen de eigenaar heeft toegang tot terugbelverzoeken. Hostinginfrastructuur en e-mailverzenders verwerken gegevens volgens de bestaande privacyverklaringen en goedkeuringen van de site.',
    'Verzoeken worden na 24 maanden verwijderd, behalve bij uitdrukkelijk binnengehaalde klanten, van wie gegevens worden bewaard zoals contract of wet vereist. Kopieën van reeds afgeleverde e-mails moeten handmatig worden verwijderd.',
    'We registreren de herkomstpagina (opgeschoond) en alleen utm_source, utm_medium en utm_campaign. Analyse- of advertentiemeting werkt alleen met aparte cookietoestemming en configuratie; de vakjes in dit formulier schakelen die niet in.',
    'Voor uw rechten (inzage, correctie, verwijdering, bezwaar) schrijft u naar info@marenetto.com.',
  ],
  privacyAck: 'Ik heb de verklaring hierboven gelezen en vraag om contact over dit verzoek.', marketing: 'Ik ontvang ook graag af en toe nieuws van Marenetto Build (optioneel, altijd in te trekken).',
  previewWarn: 'Previewomgeving: wat u invult wordt verworpen. Alleen een synthetisch testrecord wordt opgeslagen en het ontvangstbewijs vermeldt dat.',
  submit: 'Verzoek versturen', sending: 'Versturen…', retry: 'Opnieuw proberen', close: 'Sluiten',
  errGeneric: 'Het verzoek kon niet worden verstuurd. Uw gegevens staan er nog; probeer het opnieuw.', errRequired: 'Verplicht veld.', errEmail: 'Vul een geldig e-mailadres in.', errMobile: 'Internationaal formaat met +, bijv. +31612345678.', errPrivacy: 'Bevestig dat u de verklaring hebt gelezen.', errSummary: 'Controleer de gemarkeerde velden.',
  receiptTitle: 'Verzoek geregistreerd', receiptCode: 'Referentiecode', synthetic: 'Preview: uw invoer is verworpen en alleen een synthetisch testrecord is opgeslagen.', ownerLabel: 'Melding aan Marenetto', customerLabel: 'Bevestigingsmail aan u',
  delivery: { pending_provider: 'Niet verzonden: e-mailverzending wacht op activering, goedkeuring of configuratie.', sending: 'Wordt verzonden; aflevering nog niet bevestigd.', sent: 'Geaccepteerd door de e-mailprovider.', failed: 'Kon niet worden verzonden.', uncertain: 'Status onzeker: mogelijk wel of niet verzonden.', simulated: 'Gesimuleerd in preview; er is niets verzonden.' },
  newRequest: 'Nieuw verzoek',
  ctx: { home: ['Liever even bellen?', 'Laat uw nummer achter, wij bellen u terug over uw woning bij Cefalù.'], services: ['Welke dienst past?', 'Beschrijf het werk in een kort gesprek.'], articles: ['Vragen na het lezen?', 'Vraag een terugbelverzoek over uw project aan.'] },
  errConfig: 'De aanvraagdienst kon niet worden gecontroleerd; het formulier kan nog niet worden verstuurd.', loadingConfig: 'Aanvraagdienst wordt gecontroleerd…',
  footerLink: 'Privacy terugbelverzoeken', footerTitle: 'Terugbelverzoeken', translationNote: 'Deze vertaling is niet formeel goedgekeurd.',
};

const pt: CallCopy = {
  open: 'Pedir uma chamada', fixed: 'Chamada', title: 'Pedir uma chamada', intro: 'Deixe os seus dados e ligamos-lhe sobre o seu projeto. É um pedido, não uma marcação.',
  firstName: 'Nome', lastName: 'Apelido', email: 'E-mail', mobile: 'Telemóvel', mobileHint: 'Formato internacional, ex. +351 912 345 678', whatsapp: 'Também me podem contactar por WhatsApp neste número',
  project: 'Tipo de projeto', projects: { renovation: 'Remodelação', construction: 'Construção', concrete_furniture: 'Mobiliário em betão por medida', other: 'Outro' },
  location: 'Localização do imóvel', budget: 'Orçamento indicativo', startWhen: 'Quando gostaria de começar?', timeSlot: 'Melhor altura para ligar', morning: 'Manhã', afternoon: 'Tarde', noPref: 'Sem preferência',
  prefLang: 'Língua preferida para a chamada', message: 'Mensagem', optional: 'opcional', requiredNote: 'Os campos com * são obrigatórios.',
  privacyTitle: 'Aviso de privacidade para pedidos de chamada',
  privacy: [
    'Contacto do responsável: info@marenetto.com. Usamos os seus dados para responder ao pedido antes de qualquer contrato (art. 6.º, n.º 1, al. b) RGPD). Mensagens de marketing opcionais só são enviadas com consentimento separado (art. 6.º, n.º 1, al. a) RGPD), que pode retirar a qualquer momento escrevendo para info@marenetto.com.',
    'Nome, apelido, e-mail e telemóvel são necessários para o contactar. O contacto por WhatsApp é opcional e só é usado se o assinalar. O consentimento de marketing é separado, opcional e pode ser retirado a qualquer momento escrevendo para info@marenetto.com.',
    'Não garantimos disponibilidade, chamada na sua língua preferida nem tradução.',
    'Apenas o titular acede aos pedidos. A infraestrutura de alojamento e os fornecedores de envio de e-mail tratam dados ao abrigo dos avisos e aprovações já existentes no site.',
    'Os pedidos são apagados após 24 meses, exceto clientes explicitamente adquiridos, cujos dados são conservados conforme obrigações contratuais ou legais. As cópias de e-mails já entregues aos destinatários têm de ser apagadas manualmente.',
    'Registamos a página de origem (limpa) e apenas utm_source, utm_medium e utm_campaign. A medição analítica ou publicitária só funciona com consentimento de cookies e configuração separados; as caixas deste formulário não a ativam.',
    'Para exercer os seus direitos (acesso, retificação, apagamento, oposição), escreva para info@marenetto.com.',
  ],
  privacyAck: 'Li o aviso acima e peço para ser contactado sobre este pedido.', marketing: 'Aceito também receber novidades ocasionais da Marenetto Build (opcional, revogável a qualquer momento).',
  previewWarn: 'Ambiente de pré-visualização: os dados escritos são descartados. Só é guardado um registo de teste sintético e o recibo indicá-lo-á.',
  submit: 'Enviar pedido', sending: 'A enviar…', retry: 'Tentar de novo', close: 'Fechar',
  errGeneric: 'Não foi possível enviar o pedido. Os seus dados continuam aqui; tente de novo.', errRequired: 'Campo obrigatório.', errEmail: 'Introduza um e-mail válido.', errMobile: 'Formato internacional com +, ex. +351912345678.', errPrivacy: 'Confirme que leu o aviso.', errSummary: 'Verifique os campos assinalados.',
  receiptTitle: 'Pedido registado', receiptCode: 'Código de referência', synthetic: 'Pré-visualização: os seus dados foram descartados e só foi guardado um registo de teste sintético.', ownerLabel: 'Notificação à Marenetto', customerLabel: 'E-mail de confirmação para si',
  delivery: { pending_provider: 'Não enviado: o envio de e-mail aguarda ativação, aprovação ou configuração.', sending: 'A ser enviado; entrega ainda não confirmada.', sent: 'Aceite pelo fornecedor de e-mail.', failed: 'Não foi possível enviar.', uncertain: 'Estado incerto: pode ter sido enviado ou não.', simulated: 'Simulado na pré-visualização; nada foi enviado.' },
  newRequest: 'Novo pedido',
  ctx: { home: ['Prefere conversar?', 'Deixe o seu número e ligamos sobre o seu imóvel perto de Cefalù.'], services: ['Não sabe que serviço escolher?', 'Descreva o trabalho numa chamada curta.'], articles: ['Dúvidas depois de ler?', 'Peça uma chamada sobre o seu projeto.'] },
  errConfig: 'Não foi possível verificar o serviço de pedidos; o formulário ainda não pode ser enviado.', loadingConfig: 'A verificar o serviço de pedidos…',
  footerLink: 'Privacidade dos pedidos de chamada', footerTitle: 'Pedidos de chamada', translationNote: 'Esta tradução não foi formalmente aprovada.',
};

const pl: CallCopy = {
  open: 'Poproś o telefon', fixed: 'Oddzwoń', title: 'Prośba o kontakt telefoniczny', intro: 'Zostaw dane, a oddzwonimy w sprawie projektu. To prośba, nie rezerwacja.',
  firstName: 'Imię', lastName: 'Nazwisko', email: 'E-mail', mobile: 'Telefon komórkowy', mobileHint: 'Format międzynarodowy, np. +48 512 345 678', whatsapp: 'Możecie się ze mną kontaktować także przez WhatsApp pod tym numerem',
  project: 'Rodzaj projektu', projects: { renovation: 'Remont', construction: 'Budowa', concrete_furniture: 'Meble z betonu na wymiar', other: 'Inne' },
  location: 'Lokalizacja nieruchomości', budget: 'Orientacyjny budżet', startWhen: 'Kiedy chcesz zacząć?', timeSlot: 'Najlepsza pora rozmowy', morning: 'Rano', afternoon: 'Po południu', noPref: 'Bez preferencji',
  prefLang: 'Preferowany język rozmowy', message: 'Wiadomość', optional: 'opcjonalnie', requiredNote: 'Pola oznaczone * są wymagane.',
  privacyTitle: 'Informacja o prywatności dla próśb o kontakt',
  privacy: [
    'Kontakt do administratora: info@marenetto.com. Używamy danych, aby odpowiedzieć na prośbę przed zawarciem umowy (art. 6 ust. 1 lit. b RODO). Opcjonalne wiadomości marketingowe wysyłamy tylko na podstawie odrębnej zgody (art. 6 ust. 1 lit. a RODO), którą można w każdej chwili wycofać, pisząc na info@marenetto.com.',
    'Imię, nazwisko, e-mail i telefon są potrzebne do kontaktu. Kontakt przez WhatsApp jest dobrowolny i tylko po zaznaczeniu. Zgoda marketingowa jest odrębna, dobrowolna i można ją wycofać w każdej chwili, pisząc na info@marenetto.com.',
    'Nie gwarantujemy dostępności, rozmowy w preferowanym języku ani tłumaczenia.',
    'Dostęp do próśb ma wyłącznie właściciel. Infrastruktura hostingowa i dostawcy wysyłki e-mail przetwarzają dane zgodnie z istniejącymi informacjami i zatwierdzeniami serwisu.',
    'Prośby są usuwane po 24 miesiącach, z wyjątkiem wyraźnie pozyskanych klientów, których dane są przechowywane zgodnie z obowiązkami umownymi lub prawnymi. Kopie e-maili już dostarczonych odbiorcom trzeba usunąć ręcznie.',
    'Zapisujemy stronę źródłową (oczyszczoną) i tylko utm_source, utm_medium i utm_campaign. Pomiary analityczne lub reklamowe działają tylko przy odrębnej zgodzie na cookies i konfiguracji; pola tego formularza ich nie włączają.',
    'Aby skorzystać z praw (dostęp, sprostowanie, usunięcie, sprzeciw), napisz na info@marenetto.com.',
  ],
  privacyAck: 'Przeczytałem/am powyższą informację i proszę o kontakt w tej sprawie.', marketing: 'Zgadzam się też na okazjonalne wiadomości od Marenetto Build (dobrowolne, można wycofać w każdej chwili).',
  previewWarn: 'Środowisko podglądu: wpisane dane są odrzucane. Zapisywany jest tylko syntetyczny rekord testowy, co potwierdzenie wskaże.',
  submit: 'Wyślij prośbę', sending: 'Wysyłanie…', retry: 'Spróbuj ponownie', close: 'Zamknij',
  errGeneric: 'Nie udało się wysłać prośby. Dane pozostały w formularzu; spróbuj ponownie.', errRequired: 'Pole wymagane.', errEmail: 'Podaj prawidłowy e-mail.', errMobile: 'Format międzynarodowy z +, np. +48512345678.', errPrivacy: 'Potwierdź zapoznanie się z informacją.', errSummary: 'Sprawdź zaznaczone pola.',
  receiptTitle: 'Prośba zarejestrowana', receiptCode: 'Kod referencyjny', synthetic: 'Podgląd: dane zostały odrzucone, zapisano tylko syntetyczny rekord testowy.', ownerLabel: 'Powiadomienie do Marenetto', customerLabel: 'E-mail potwierdzający do Ciebie',
  delivery: { pending_provider: 'Nie wysłano: wysyłka e-mail czeka na włączenie, zatwierdzenie lub konfigurację.', sending: 'Wysyłanie; doręczenie niepotwierdzone.', sent: 'Przyjęte przez dostawcę e-mail.', failed: 'Nie udało się wysłać.', uncertain: 'Status niepewny: mogło zostać wysłane lub nie.', simulated: 'Symulacja w podglądzie; nic nie wysłano.' },
  newRequest: 'Nowa prośba',
  ctx: { home: ['Wolisz porozmawiać?', 'Zostaw numer, oddzwonimy w sprawie nieruchomości koło Cefalù.'], services: ['Nie wiesz, która usługa pasuje?', 'Opisz prace w krótkiej rozmowie.'], articles: ['Pytania po lekturze?', 'Poproś o telefon w sprawie swojego projektu.'] },
  errConfig: 'Nie udało się sprawdzić usługi zgłoszeń; formularza nie można jeszcze wysłać.', loadingConfig: 'Sprawdzanie usługi zgłoszeń…',
  footerLink: 'Prywatność próśb o kontakt', footerTitle: 'Prośby o kontakt', translationNote: 'To tłumaczenie nie zostało formalnie zatwierdzone.',
};

const ru: CallCopy = {
  open: 'Заказать звонок', fixed: 'Звонок', title: 'Заказать обратный звонок', intro: 'Оставьте данные, и мы перезвоним по вашему проекту. Это запрос, а не бронирование.',
  firstName: 'Имя', lastName: 'Фамилия', email: 'Эл. почта', mobile: 'Мобильный телефон', mobileHint: 'Международный формат, напр. +7 912 345 67 89', whatsapp: 'Со мной также можно связаться в WhatsApp по этому номеру',
  project: 'Тип проекта', projects: { renovation: 'Ремонт', construction: 'Строительство', concrete_furniture: 'Мебель из бетона на заказ', other: 'Другое' },
  location: 'Местоположение объекта', budget: 'Ориентировочный бюджет', startWhen: 'Когда вы хотите начать?', timeSlot: 'Удобное время звонка', morning: 'Утро', afternoon: 'День', noPref: 'Без предпочтений',
  prefLang: 'Предпочтительный язык звонка', message: 'Сообщение', optional: 'необязательно', requiredNote: 'Поля со * обязательны.',
  privacyTitle: 'Уведомление о конфиденциальности для запросов звонка',
  privacy: [
    'Контакт оператора: info@marenetto.com. Мы используем ваши данные, чтобы ответить на запрос до заключения договора (ст. 6(1)(b) GDPR). Необязательные маркетинговые сообщения отправляются только при отдельном согласии (ст. 6(1)(a) GDPR), которое можно отозвать в любой момент письмом на info@marenetto.com.',
    'Имя, фамилия, эл. почта и мобильный нужны, чтобы связаться с вами. Связь через WhatsApp необязательна и используется, только если вы её отметите. Согласие на маркетинг отдельное, необязательное и может быть отозвано в любой момент письмом на info@marenetto.com.',
    'Мы не гарантируем доступность, звонок на предпочтительном языке или перевод.',
    'Доступ к запросам имеет только владелец. Хостинг-инфраструктура и поставщики отправки почты обрабатывают данные в рамках уже действующих уведомлений и согласований сайта.',
    'Запросы удаляются через 24 месяца, кроме явно привлечённых клиентов, данные которых хранятся согласно договорным или законным обязательствам. Копии уже доставленных писем получатели должны удалить вручную.',
    'Мы сохраняем страницу перехода (очищенную) и только utm_source, utm_medium и utm_campaign. Аналитика или рекламные измерения работают только при отдельном согласии на cookie и настройке; флажки этой формы их не включают.',
    'Чтобы воспользоваться своими правами (доступ, исправление, удаление, возражение), пишите на info@marenetto.com.',
  ],
  privacyAck: 'Я прочитал(а) уведомление выше и прошу связаться со мной по этому запросу.', marketing: 'Я также согласен(на) получать новости Marenetto Build (необязательно, можно отозвать в любой момент).',
  previewWarn: 'Тестовая среда: введённые данные отбрасываются. Сохраняется только синтетическая тестовая запись, и квитанция это укажет.',
  submit: 'Отправить запрос', sending: 'Отправка…', retry: 'Повторить', close: 'Закрыть',
  errGeneric: 'Не удалось отправить запрос. Данные сохранены в форме; попробуйте ещё раз.', errRequired: 'Обязательное поле.', errEmail: 'Введите корректный адрес эл. почты.', errMobile: 'Международный формат с +, напр. +79123456789.', errPrivacy: 'Подтвердите, что прочитали уведомление.', errSummary: 'Проверьте отмеченные поля.',
  receiptTitle: 'Запрос зарегистрирован', receiptCode: 'Код запроса', synthetic: 'Тестовая среда: ваши данные отброшены, сохранена только синтетическая тестовая запись.', ownerLabel: 'Уведомление Marenetto', customerLabel: 'Письмо-подтверждение вам',
  delivery: { pending_provider: 'Не отправлено: отправка писем ожидает включения, утверждения или настройки.', sending: 'Отправляется; доставка не подтверждена.', sent: 'Принято почтовым провайдером.', failed: 'Не удалось отправить.', uncertain: 'Статус неясен: возможно, отправлено, возможно, нет.', simulated: 'Смоделировано в тестовой среде; ничего не отправлено.' },
  newRequest: 'Новый запрос',
  ctx: { home: ['Удобнее поговорить?', 'Оставьте номер, и мы перезвоним по вашей недвижимости у Чефалу.'], services: ['Не знаете, какая услуга нужна?', 'Опишите работы в коротком разговоре.'], articles: ['Остались вопросы?', 'Закажите звонок по своему проекту.'] },
  errConfig: 'Не удалось проверить сервис запросов; форму пока нельзя отправить.', loadingConfig: 'Проверка сервиса запросов…',
  footerLink: 'Конфиденциальность запросов звонка', footerTitle: 'Запросы звонка', translationNote: 'Этот перевод официально не утверждён.',
};

const sv: CallCopy = {
  open: 'Bli uppringd', fixed: 'Ring mig', title: 'Begär att bli uppringd', intro: 'Lämna dina uppgifter så ringer vi upp om ditt projekt. Detta är en förfrågan, inte en bokning.',
  firstName: 'Förnamn', lastName: 'Efternamn', email: 'E-post', mobile: 'Mobilnummer', mobileHint: 'Internationellt format, t.ex. +46 70 123 45 67', whatsapp: 'Ni får även kontakta mig via WhatsApp på detta nummer',
  project: 'Typ av projekt', projects: { renovation: 'Renovering', construction: 'Byggnation', concrete_furniture: 'Måttbeställda betongmöbler', other: 'Annat' },
  location: 'Fastighetens plats', budget: 'Ungefärlig budget', startWhen: 'När vill du börja?', timeSlot: 'Bästa tid att ringa', morning: 'Förmiddag', afternoon: 'Eftermiddag', noPref: 'Ingen preferens',
  prefLang: 'Önskat språk för samtalet', message: 'Meddelande', optional: 'valfritt', requiredNote: 'Fält med * är obligatoriska.',
  privacyTitle: 'Integritetsmeddelande för uppringningsförfrågningar',
  privacy: [
    'Kontakt till personuppgiftsansvarig: info@marenetto.com. Vi använder dina uppgifter för att svara på förfrågan innan något avtal ingås (art. 6.1 b GDPR). Valfria marknadsföringsutskick skickas bara med separat samtycke (art. 6.1 a GDPR), som du när som helst kan återkalla via info@marenetto.com.',
    'Förnamn, efternamn, e-post och mobil krävs för att nå dig. WhatsApp-kontakt är valfri och används bara om du kryssar i den. Marknadsföringssamtycke är separat, valfritt och kan när som helst återkallas via info@marenetto.com.',
    'Vi garanterar inte tillgänglighet, samtal på önskat språk eller översättning.',
    'Endast ägaren har åtkomst till förfrågningarna. Hostinginfrastruktur och leverantörer av e-postutskick behandlar uppgifter enligt webbplatsens befintliga integritetsmeddelanden och godkännanden.',
    'Förfrågningar raderas efter 24 månader, utom för uttryckligen förvärvade kunder vars uppgifter sparas enligt avtal eller lag. Kopior av redan levererade e-postmeddelanden måste raderas manuellt.',
    'Vi sparar ursprungssidan (rensad) och endast utm_source, utm_medium och utm_campaign. Statistik- eller annonsmätning körs bara med separat cookiesamtycke och konfiguration; kryssrutorna i formuläret aktiverar den inte.',
    'För att utöva dina rättigheter (tillgång, rättelse, radering, invändning), skriv till info@marenetto.com.',
  ],
  privacyAck: 'Jag har läst meddelandet ovan och ber om att bli kontaktad om denna förfrågan.', marketing: 'Jag vill även få nyheter ibland från Marenetto Build (valfritt, kan återkallas när som helst).',
  previewWarn: 'Förhandsmiljö: det du skriver kasseras. Endast en syntetisk testpost sparas och kvittot anger det.',
  submit: 'Skicka förfrågan', sending: 'Skickar…', retry: 'Försök igen', close: 'Stäng',
  errGeneric: 'Förfrågan kunde inte skickas. Dina uppgifter finns kvar; försök igen.', errRequired: 'Obligatoriskt fält.', errEmail: 'Ange en giltig e-postadress.', errMobile: 'Internationellt format med +, t.ex. +46701234567.', errPrivacy: 'Bekräfta att du läst meddelandet.', errSummary: 'Kontrollera de markerade fälten.',
  receiptTitle: 'Förfrågan registrerad', receiptCode: 'Referenskod', synthetic: 'Förhandsvisning: dina uppgifter kasserades och endast en syntetisk testpost sparades.', ownerLabel: 'Avisering till Marenetto', customerLabel: 'Bekräftelsemejl till dig',
  delivery: { pending_provider: 'Inte skickat: e-postutskick väntar på aktivering, godkännande eller konfiguration.', sending: 'Skickas; leverans ej bekräftad.', sent: 'Accepterat av e-postleverantören.', failed: 'Kunde inte skickas.', uncertain: 'Osäker status: kan ha skickats eller inte.', simulated: 'Simulerat i förhandsvisning; inget skickades.' },
  newRequest: 'Ny förfrågan',
  ctx: { home: ['Vill du hellre prata?', 'Lämna ditt nummer så ringer vi om din fastighet nära Cefalù.'], services: ['Osäker på vilken tjänst?', 'Beskriv arbetet i ett kort samtal.'], articles: ['Frågor efter läsningen?', 'Be om att bli uppringd om ditt projekt.'] },
  errConfig: 'Förfrågningstjänsten kunde inte kontrolleras; formuläret kan inte skickas än.', loadingConfig: 'Kontrollerar förfrågningstjänsten…',
  footerLink: 'Integritet för uppringning', footerTitle: 'Uppringningsförfrågningar', translationNote: 'Denna översättning är inte formellt godkänd.',
};

const no: CallCopy = {
  open: 'Bli oppringt', fixed: 'Ring meg', title: 'Be om å bli oppringt', intro: 'Legg igjen opplysningene dine, så ringer vi deg om prosjektet. Dette er en forespørsel, ikke en bestilling.',
  firstName: 'Fornavn', lastName: 'Etternavn', email: 'E-post', mobile: 'Mobilnummer', mobileHint: 'Internasjonalt format, f.eks. +47 412 34 567', whatsapp: 'Dere kan også kontakte meg på WhatsApp på dette nummeret',
  project: 'Type prosjekt', projects: { renovation: 'Renovering', construction: 'Bygging', concrete_furniture: 'Skreddersydde betongmøbler', other: 'Annet' },
  location: 'Eiendommens beliggenhet', budget: 'Omtrentlig budsjett', startWhen: 'Når vil du starte?', timeSlot: 'Beste tid å ringe', morning: 'Formiddag', afternoon: 'Ettermiddag', noPref: 'Ingen preferanse',
  prefLang: 'Foretrukket språk for samtalen', message: 'Melding', optional: 'valgfritt', requiredNote: 'Felt merket * er obligatoriske.',
  privacyTitle: 'Personvernerklæring for forespørsler om oppringing',
  privacy: [
    'Kontakt for behandlingsansvarlig: info@marenetto.com. Vi bruker opplysningene til å svare på forespørselen før en eventuell avtale (art. 6 nr. 1 b GDPR). Valgfrie markedsføringsmeldinger sendes bare med eget samtykke (art. 6 nr. 1 a GDPR), som du når som helst kan trekke tilbake via info@marenetto.com.',
    'Fornavn, etternavn, e-post og mobil kreves for å nå deg. WhatsApp-kontakt er valgfri og brukes bare hvis du krysser av. Samtykke til markedsføring er separat, valgfritt og kan når som helst trekkes tilbake via info@marenetto.com.',
    'Vi garanterer ikke tilgjengelighet, samtale på ønsket språk eller oversettelse.',
    'Kun eieren har tilgang til forespørslene. Hostinginfrastruktur og leverandører av e-postutsending behandler data etter nettstedets eksisterende personvernerklæringer og godkjenninger.',
    'Forespørsler slettes etter 24 måneder, unntatt uttrykkelig ervervede kunder, hvis data oppbevares etter avtale eller lov. Kopier av allerede leverte e-poster må slettes manuelt.',
    'Vi lagrer opprinnelsessiden (renset) og kun utm_source, utm_medium og utm_campaign. Statistikk- eller annonsemåling kjører bare med eget cookiesamtykke og egen konfigurasjon; avkrysningene i skjemaet aktiverer den ikke.',
    'For å utøve rettighetene dine (innsyn, retting, sletting, innsigelse), skriv til info@marenetto.com.',
  ],
  privacyAck: 'Jeg har lest erklæringen over og ber om å bli kontaktet om denne forespørselen.', marketing: 'Jeg vil også motta nyheter av og til fra Marenetto Build (valgfritt, kan trekkes tilbake når som helst).',
  previewWarn: 'Forhåndsvisning: det du skriver forkastes. Kun en syntetisk testpost lagres, og kvitteringen sier fra om det.',
  submit: 'Send forespørsel', sending: 'Sender…', retry: 'Prøv igjen', close: 'Lukk',
  errGeneric: 'Forespørselen kunne ikke sendes. Opplysningene ligger fortsatt her; prøv igjen.', errRequired: 'Obligatorisk felt.', errEmail: 'Oppgi en gyldig e-postadresse.', errMobile: 'Internasjonalt format med +, f.eks. +4741234567.', errPrivacy: 'Bekreft at du har lest erklæringen.', errSummary: 'Sjekk de markerte feltene.',
  receiptTitle: 'Forespørsel registrert', receiptCode: 'Referansekode', synthetic: 'Forhåndsvisning: opplysningene ble forkastet, og kun en syntetisk testpost ble lagret.', ownerLabel: 'Varsel til Marenetto', customerLabel: 'Bekreftelse på e-post til deg',
  delivery: { pending_provider: 'Ikke sendt: e-postutsending venter på aktivering, godkjenning eller konfigurasjon.', sending: 'Sendes; levering ikke bekreftet.', sent: 'Akseptert av e-postleverandøren.', failed: 'Kunne ikke sendes.', uncertain: 'Usikker status: kan være sendt eller ikke.', simulated: 'Simulert i forhåndsvisning; ingenting ble sendt.' },
  newRequest: 'Ny forespørsel',
  ctx: { home: ['Vil du heller snakke?', 'Legg igjen nummeret ditt, så ringer vi om eiendommen din nær Cefalù.'], services: ['Usikker på hvilken tjeneste?', 'Beskriv arbeidet i en kort samtale.'], articles: ['Spørsmål etter lesingen?', 'Be om å bli oppringt om prosjektet ditt.'] },
  errConfig: 'Forespørselstjenesten kunne ikke kontrolleres; skjemaet kan ikke sendes ennå.', loadingConfig: 'Kontrollerer forespørselstjenesten…',
  footerLink: 'Personvern for oppringing', footerTitle: 'Forespørsler om oppringing', translationNote: 'Denne oversettelsen er ikke formelt godkjent.',
};

const da: CallCopy = {
  open: 'Bliv ringet op', fixed: 'Ring mig', title: 'Bed om at blive ringet op', intro: 'Efterlad dine oplysninger, så ringer vi dig op om dit projekt. Dette er en forespørgsel, ikke en booking.',
  firstName: 'Fornavn', lastName: 'Efternavn', email: 'E-mail', mobile: 'Mobilnummer', mobileHint: 'Internationalt format, f.eks. +45 20 12 34 56', whatsapp: 'I må også kontakte mig på WhatsApp på dette nummer',
  project: 'Projekttype', projects: { renovation: 'Renovering', construction: 'Byggeri', concrete_furniture: 'Skræddersyede betonmøbler', other: 'Andet' },
  location: 'Ejendommens beliggenhed', budget: 'Omtrentligt budget', startWhen: 'Hvornår vil du gerne starte?', timeSlot: 'Bedste tidspunkt at ringe', morning: 'Formiddag', afternoon: 'Eftermiddag', noPref: 'Ingen præference',
  prefLang: 'Foretrukket sprog til opkaldet', message: 'Besked', optional: 'valgfrit', requiredNote: 'Felter markeret med * er obligatoriske.',
  privacyTitle: 'Privatlivsmeddelelse for opkaldsforespørgsler',
  privacy: [
    'Kontakt til den dataansvarlige: info@marenetto.com. Vi bruger dine oplysninger til at besvare forespørgslen, før der indgås en aftale (art. 6, stk. 1, litra b, GDPR). Valgfri markedsføring sendes kun med separat samtykke (art. 6, stk. 1, litra a, GDPR), som du altid kan trække tilbage via info@marenetto.com.',
    'Fornavn, efternavn, e-mail og mobil er nødvendige for at kontakte dig. WhatsApp-kontakt er valgfri og bruges kun, hvis du sætter kryds. Samtykke til markedsføring er separat, valgfrit og kan altid trækkes tilbage via info@marenetto.com.',
    'Vi garanterer ikke tilgængelighed, opkald på dit foretrukne sprog eller oversættelse.',
    'Kun ejeren har adgang til forespørgslerne. Hostinginfrastruktur og udbydere af e-mailafsendelse behandler data under sidens eksisterende privatlivsmeddelelser og godkendelser.',
    'Forespørgsler slettes efter 24 måneder, undtagen udtrykkeligt erhvervede kunder, hvis data opbevares efter aftale eller lov. Kopier af allerede leverede e-mails skal slettes manuelt.',
    'Vi registrerer oprindelsessiden (renset) og kun utm_source, utm_medium og utm_campaign. Statistik- eller annoncemåling kører kun med separat cookiesamtykke og konfiguration; afkrydsningerne i formularen aktiverer den ikke.',
    'For at udøve dine rettigheder (indsigt, berigtigelse, sletning, indsigelse), skriv til info@marenetto.com.',
  ],
  privacyAck: 'Jeg har læst meddelelsen ovenfor og beder om at blive kontaktet om denne forespørgsel.', marketing: 'Jeg vil også gerne modtage nyheder fra Marenetto Build en gang imellem (valgfrit, kan altid trækkes tilbage).',
  previewWarn: 'Forhåndsvisning: det, du skriver, kasseres. Kun en syntetisk testpost gemmes, og kvitteringen oplyser det.',
  submit: 'Send forespørgsel', sending: 'Sender…', retry: 'Prøv igen', close: 'Luk',
  errGeneric: 'Forespørgslen kunne ikke sendes. Dine oplysninger er her stadig; prøv igen.', errRequired: 'Obligatorisk felt.', errEmail: 'Angiv en gyldig e-mailadresse.', errMobile: 'Internationalt format med +, f.eks. +4520123456.', errPrivacy: 'Bekræft, at du har læst meddelelsen.', errSummary: 'Tjek de markerede felter.',
  receiptTitle: 'Forespørgsel registreret', receiptCode: 'Referencekode', synthetic: 'Forhåndsvisning: dine oplysninger blev kasseret, og kun en syntetisk testpost blev gemt.', ownerLabel: 'Besked til Marenetto', customerLabel: 'Bekræftelsesmail til dig',
  delivery: { pending_provider: 'Ikke sendt: e-mailafsendelse afventer aktivering, godkendelse eller konfiguration.', sending: 'Sendes; levering ikke bekræftet.', sent: 'Accepteret af e-mailudbyderen.', failed: 'Kunne ikke sendes.', uncertain: 'Usikker status: kan være sendt eller ej.', simulated: 'Simuleret i forhåndsvisning; intet blev sendt.' },
  newRequest: 'Ny forespørgsel',
  ctx: { home: ['Vil du hellere tale?', 'Efterlad dit nummer, så ringer vi om din ejendom nær Cefalù.'], services: ['Usikker på hvilken ydelse?', 'Beskriv arbejdet i et kort opkald.'], articles: ['Spørgsmål efter læsningen?', 'Bed om et opkald om dit projekt.'] },
  errConfig: 'Forespørgselstjenesten kunne ikke kontrolleres; formularen kan ikke sendes endnu.', loadingConfig: 'Kontrollerer forespørgselstjenesten…',
  footerLink: 'Privatliv for opkaldsforespørgsler', footerTitle: 'Opkaldsforespørgsler', translationNote: 'Denne oversættelse er ikke formelt godkendt.',
};

export const callCopy: Record<CallLang, CallCopy> = { it, en, de, fr, es, nl, pt, pl, ru, sv, no, da, ar: arabicCallCopy };
for (const locale of CALL_LOCALES) {
  // Authoritative current retention rule replaces the previous acquired-client
  // wording: only contractual relationships qualify for the exception.
  if (ownerDecisions[locale]) callCopy[locale].privacy[4] = ownerDecisions[locale].retention;
}
export const getCallCopy = (lang: string) => {
  const locale = toCallLang(lang);
  const base = callCopy[locale], atelier = callAtelierCopy[locale];
  return { ...base, country: atelier.country, confidential: atelier.confidential, atelierIntro: atelier.intro,
    projects: { ...base.projects, atelier_international: atelier.project, professional_studio: professionalFormCopy(locale).project },
    privacy: [...base.privacy, atelier.privacy, professionalFormCopy(locale).privacy] };
};
