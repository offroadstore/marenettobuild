# Esito dei controlli — 23 novembre 2026

## Superati

- Rigenerazione contratti: `pnpm --filter @workspace/api-spec run codegen`.
- Typecheck completo: `pnpm run typecheck`.
- Autorizzazioni e fixture:
  `pnpm --filter @workspace/api-server run test:permissions`.
  Include due test API aggregati con schema PostgreSQL temporaneo e
  controlli granulari per tre adapter IA, Bing, GA4, Search Console,
  zero/preview, HMAC e replay, doppio avvio manuale/settimanale,
  prenotazioni concorrenti, lease persa, mese/DST, errori parziali,
  filtri/cache, classificazione e minimizzazione. Sette test di rendering/
  CSV/consenso, incluso form IA a budget0 con comandi disabilitati.
- Schema interno: `pnpm --filter @workspace/db run check:internal-schema`.
- SMTP simulato e idempotenza invariati:
  `pnpm --filter @workspace/api-server run test:project-requests`.
- Testi legali e scanner invariati:
  `pnpm --filter @workspace/marenetto-build run test:legal`.
- Build finale:
  `PORT=4188 BASE_PATH=/ pnpm --filter @workspace/marenetto-build run build`.
  Guardia produzione superata su1092 asset testuali; nessuna eccezione nuova.
- `git diff --check` e controllo sintassi del runner esterno superati.
- Migrazione additiva applicata al solo DB di sviluppo; schema/indici
  inclusi nel modello Drizzle e nel post-merge. Nessun budget esistente
  modificato, nessuna migrazione o interrogazione produzione effettuata.

## Suite rotte esistente

`pnpm --filter @workspace/marenetto-build run test:routes` ha completato
build e primi136 casi, poi è stato fermato dal limite di300secondi del
comando. Nessun fallimento fino a quel punto. I file rimasti sono stati
eseguiti separatamente nel progetto `production-preview`:

```
pnpm exec playwright test --project=production-preview \
  home-brand.spec.ts legal-pages.spec.ts migration-routes.spec.ts \
  seo-rendering.spec.ts whatsapp-access.spec.ts
```

47 passati; due controlli SEO hanno incontrato l'interruzione del server
durante il riavvio dei workflow. Dopo il ripristino sono stati ripetuti
**soltanto** quei due casi:

```
pnpm exec playwright test --project=production-preview \
  seo-rendering.spec.ts \
  --grep 'all exposed editions|explicit Italian URL, keyboard'
```

Esito2/2superati. Tutti i182 casi della suite sono coperti fra le
invocazioni:175passati e7esclusioni già previste dalla configurazione,
senza modificare test pubblici per ottenere il risultato. Nessuna nuova
suite browser dell'area autenticata è stata lanciata.

## Limiti della verifica e stato lasciato

La preview di `/internal?section=monitoring` mostra correttamente il
controllo di accesso. Il rendering del contenuto privato, permessi,
form, tabelle e CSV sono collaudati con fixture; **non** è stata verificata
una sessione browser autenticata né una ricezione reale dei fornitori.
I workflow applicativi sono stati riavviati dopo le modifiche.

Nessuna chiamata IA, report Google/Bing o invio SMTP reale. Credenziali
provider reali escluse dal processo fixture prima di copiarne i valori;
le sole credenziali usate nei test sono stringhe sintetiche.
Il runner è solo predisposto, mai eseguito o programmato.
Budget iniziale0, calendario spento. Gemini rimane bloccato per termini
e costo non verificabile; Meta non configurata. Nessuna pubblicazione,
modifica a chiavi, tracciamento pubblico, email o testi/scanner legali.

La misura anonima SMTP è stata esclusa secondo l'alternativa autorizzata:
copertura non dimostrabile non viene sostituita da zeri o vecchi lead.
La documentazione operativa è in `CRUSCOTTO.md`; fonti e scadenza della
verifica dei costi in `PROVIDER.md`.
