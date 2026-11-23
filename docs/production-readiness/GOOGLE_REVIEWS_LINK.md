# LINK GOOGLE RECENSIONI — RIPIEGO

> Il requisito solo-collegamento del 22 novembre è superato dall'integrazione
> server Places API (New). Vedere [attivazione, policy e verifiche](GOOGLE_PLACES_REVIEWS.md).
> Questo documento conserva la provenienza del collegamento di ripiego e
> le verifiche storiche, non descrive più l'intera funzionalità.

**SEGNAPOSTO PER IL TITOLARE: manca il link definitivo alle recensioni della
scheda Google Business di Marenetto Build.**

Nessun Place ID o URL ufficiale è stato trovato nei contatti o nei cataloghi
storici del progetto. Per ora il pulsante apre la ricerca autorizzata:

https://www.google.com/maps/search/?api=1&query=Marenetto%20Build%20Cefal%C3%B9

Per completare: fornire il collegamento pubblico alle recensioni della scheda
corretta, verificandone nome, telefono e indirizzo. Non servono credenziali.
Inserirlo in `GOOGLE_REVIEWS_OFFICIAL_URL` nel file
`artifacts/marenetto-build/src/config/google-reviews.ts`.

Il segnaposto è documentale, per il proprietario: sul sito resta un normale
pulsante tradotto, non un avviso tecnico per i clienti.

In assenza di risposta Places valida resta questo collegamento, senza dati
inventati. Non aggiungere widget, scraping o Review/AggregateRating.
Il collegamento non carica Google fino al click.

## Verifiche sul candidato — 22 novembre 2026

- Build e typecheck riusciti; 47 test superati fra controlli recensioni,
  estrazione homepage e localizzazione.
- HTML generato delle 12 home pubbliche: un solo pulsante Google per pagina,
  nessuna vecchia lista di nomi e nessuno schema Review/AggregateRating.
- Anche le pagine storiche “Recensioni” usano il nuovo blocco senza nomi.
- Vista mobile a 320, 390 e 430 px: nessuno scorrimento orizzontale o incrocio
  fra pulsante Google e WhatsApp nelle posizioni iniziale, recensioni e footer.
- Su mobile WhatsApp cede lo spazio quando intersecherebbe testo o comandi;
  resta visibile nelle aree libere. Nessun errore pagina durante il controllo.
- Screenshot della sezione in anteprima a 390 × 844 px verificato.

Sono prove del candidato, **non della produzione dopo il Republish**.
