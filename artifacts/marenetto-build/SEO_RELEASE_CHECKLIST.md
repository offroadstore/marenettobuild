# Checklist per un eventuale rilascio — NON attivata

## Autorizzazioni prima di qualsiasi modifica pubblica

- [ ] Nuova autorizzazione esplicita del titolare a rilasciare e ad aprire l’indicizzazione.
- [ ] Dominio e origine canonica definitivi confermati. `https://preview.invalid` è un segnaposto sicuro, non un dominio aziendale.
- [ ] Conferma dell’identità legale, partita IVA, sede e area effettivamente servita.
- [ ] Conferma delle edizioni da pubblicare, pagina per pagina, con prova di approvazione nel registro editoriale. Le vecchie approvazioni dei cataloghi non approvano i nuovi testi.
- [ ] Revisione umana delle nuove traduzioni; PT proposto come portoghese europeo, SR in cirillico. Nessun revisore professionale è stato inventato.
- [ ] Verifica delle informazioni commerciali, documenti tecnici e consensi mancanti elencati nel rapporto.
- [ ] Privacy, fornitore notifiche e modalità dati reali approvati separatamente. Non inviare richieste reali come collaudo.

## Preparazione già presente, ma non rilasciata

- Inventario per edizione, registro delle approvazioni, HTML completo della stessa UI React.
- Handler web minimo preparato in `scripts/serve-seo.mjs`, invece del fallback universale alla home.
- Stato sicuro predefinito: header e HTML `noindex, nofollow`, robots `Disallow: /`.
- Esempio di policy inattiva in `config/release-policy.example.json`: host consentiti vuoti, origine non confermata, nessuna attivazione automatica.
- La sitemap descrive soltanto le 22 destinazioni italiane oggi eleggibili; non autorizza l’indicizzazione.
- Le bozze di revisione sono consultabili senza login: non sono un deposito privato. I dati delle aree interne continuano a richiedere autenticazione/autorizzazione.

## Controlli sul futuro host definitivo

- [ ] **Blocco analytics del passaggio da Framework360**: completare la checklist P0 e `docs/monitoring/GUIDA.html`, inclusi OAuth, continuità della proprietà, consenso, raccolta reale e ricontrolli differiti. Il solo salvataggio di G-… non supera il blocco.
- [ ] Runtime analytics su origine HTTPS dedicata, dominio registrabile distinto e nessuna API/login/cookie condiviso; verificare raggiungibilità, CSP e isolamento prima della raccolta. Predisposizione del runtime non autorizza DNS o pubblicazione.
- [ ] Nessun tag in preview/login/console/demo/revisione, anche dopo navigazione SPA; un solo GA4 diretto e GTM non installato. Informative approvate e origine autorizzata sono prerequisiti distinti dal consenso visitatore.
- [ ] Impostare l’origine confermata nel build, senza dedurla dal nome del progetto.
- [ ] Verificare build e servizio Node preparati, porta, MIME, asset e comportamento delle route. Nessun fallback a home per route sconosciute.
- [ ] Provare HTTP reale senza JavaScript su ogni URL ammissibile, non soltanto la navigazione SPA.
- [ ] 200 per documenti validi, 308 per alias giustificati, 404 per inesistenti e CMS non approvati, 410 per `/translation-ok`.
- [ ] Controllare query di campagna, esclusione di parametri personali, frammenti, slash e assenza di catene.
- [ ] Canonical sul dominio definitivo, un solo H1, metadati specifici; nessun URL `preview.invalid`.
- [ ] Hreflang soltanto tra equivalenti effettivamente approvati, reciproci e auto-riferiti.
- [ ] Sitemap: articoli e guide approvati inclusi; ricerca, bozze, hub editoriale, aree interne e errori esclusi.
- [ ] Ricontrollare idratazione, URL/lingua espliciti e assenza di passaggi automatici dalla home italiana.
- [ ] Verificare AR/HE su Chromium mobile e WebKit/iOS reali. Non rimuovere la protezione `html` LTR con struttura locale RTL senza questa prova.
- [ ] Ricontrollare tastiera, focus, zoom, telefono/email, WhatsApp e moduli con consegna notifiche isolata.
- [ ] Misurare le prestazioni della build servita sull’host reale e con immagini/font definitivi. Le misure locali non sono Core Web Vitals di campo.
- [ ] Solo dopo autorizzazione separata: modificare intenzionalmente header, meta robots e robots.txt. Nessuna promessa di ranking o indicizzazione.

Search Console, dominio, Google Business Profile e pubblicazione non sono stati modificati.
