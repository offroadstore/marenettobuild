# Migration report — marenettobuild.com to Marenetto Build site

Source: content/source-articles-it.json and content/source-pages.json (fetched 2026-10-17). Both files are preserved untouched.

## Article inventory (14)

| # | Historical slug | New path | Original date | Review status | Guide |
|---|---|---|---|---|---|
| 1 | `comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali` | `/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali` (also `/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali/`) | 2026-03-25 | summary-reviewed | yes |
| 2 | `impresa-edile-a-cefalu` | `/impresa-edile-a-cefalu` (also `/impresa-edile-a-cefalu/`) | 2026-02-10 | editorial-review | no |
| 3 | `ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni` | `/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni` (also `/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/`) | 2026-02-06 | technical-review | yes |
| 4 | `garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto` | `/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto` (also `/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto/`) | 2025-12-31 | technical-review | no |
| 5 | `cappotto-termico-vs-intonaco-termico-cefalu` | `/cappotto-termico-vs-intonaco-termico-cefalu` (also `/cappotto-termico-vs-intonaco-termico-cefalu/`) | 2025-12-27 | technical-review | yes |
| 6 | `pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete` | `/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete` (also `/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete/`) | 2025-12-23 | technical-review | yes |
| 7 | `ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam` | `/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam` (also `/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam/`) | 2025-12-22 | technical-review | yes |
| 8 | `gestione-manutenzione-immobile` | `/gestione-manutenzione-immobile` (also `/gestione-manutenzione-immobile/`) | 2025-12-16 | summary-reviewed | yes |
| 9 | `garden-design-esclusivo` | `/garden-design-esclusivo` (also `/garden-design-esclusivo/`) | 2025-12-16 | editorial-review | no |
| 10 | `opere-in-pietra-e-prospetti` | `/opere-in-pietra-e-prospetti` (also `/opere-in-pietra-e-prospetti/`) | 2025-12-16 | editorial-review | no |
| 11 | `pavimenti-stampati-in-resina` | `/pavimenti-stampati-in-resina` (also `/pavimenti-stampati-in-resina/`) | 2025-12-15 | technical-review | no |
| 12 | `piscine-e-laghetti-zen` | `/piscine-e-laghetti-zen` (also `/piscine-e-laghetti-zen/`) | 2025-12-15 | editorial-review | no |
| 13 | `cucine-in-muratura-luxury` | `/cucine-in-muratura-luxury` (also `/cucine-in-muratura-luxury/`) | 2025-12-15 | editorial-review | no |
| 14 | `tecniche-avanzate-gestione-deformazioni-strutture-edili` | `/tecniche-avanzate-gestione-deformazioni-strutture-edili` (also `/tecniche-avanzate-gestione-deformazioni-strutture-edili/`) | 2024-06-20 | technical-review | no |

Article detail pages live at their exact historical path; trailing-slash variants replace-redirect to the slash-less form.

## Review classifications

- technical-review: claims on structure, performance, insurance, certifications, durations or tax bonuses that need a qualified professional.
- editorial-review: promotional or absolute language without documentation.
- summary-reviewed: neutral summary re-read; original specific claims still unverified.

Claims flagged per article are listed in `src/content/articles.ts` (`claimsToReview`) and shown on each detail page. No original body text is republished.

## Page route mapping (client-side replace redirects)

| Old path | New path |
|---|---|
| /articoli/ | /articoli (direct) |
| /contatti/ | /contatti (direct) |
| /chi-siamo/ | /come-lavoriamo |
| /recensioni/ | /progetti |
| /ristrutturazioni-chiavi-in-mano-cefalu-e-palermo-marenetto/ | /servizi |
| /general-contractor/ | /servizi |
| /edilizia-e-ristrutturazioni/ | /articoli |
| /bonus-edilizi-e-permessi/ | /guide |
| /cantieri-e-lavori/ | /progetti |
| /outdoor-e-garden-design/ | /servizi |
| /assistenza-e-pronto-intervento/ | /contatti |

## Exclusions

- `/translation-ok` — broken/incomplete booking form fragment on the source site, no meaningful content. Intentionally not routed; resolves to the 404 page.
- Original article body text — not republished pending review.
- Reviews page (/recensioni) had no reviews; no testimonials are shown or invented.

## Media

14 hero images copied locally to `public/media/articles/` (listed in manifest.json), one per article, all used by the archive, guide, search and detail views.

## New routes

/articoli, /ricerca, /guide, /progetti, plus 14 article detail paths. Preview `noindex, nofollow` in index.html is unchanged.
