# Migration report — marenettobuild.com to Marenetto Build site

Source: content/source-articles-it.json and content/source-pages.json (fetched 2026-10-17). Both files are preserved untouched.

## Article inventory (14)

| # | Historical slug | New path | Original date | Review status | Guide |
|---|---|---|---|---|---|
| 1 | `comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali` | `/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali` (also `/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali/`) | 2026-03-25 | documentary-review | yes |
| 2 | `impresa-edile-a-cefalu` | `/impresa-edile-a-cefalu` (also `/impresa-edile-a-cefalu/`) | 2026-02-10 | documentary-review | no |
| 3 | `ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni` | `/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni` (also `/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/`) | 2026-02-06 | documentary-review | yes |
| 4 | `garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto` | `/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto` (also `/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto/`) | 2025-12-31 | documentary-review | no |
| 5 | `cappotto-termico-vs-intonaco-termico-cefalu` | `/cappotto-termico-vs-intonaco-termico-cefalu` (also `/cappotto-termico-vs-intonaco-termico-cefalu/`) | 2025-12-27 | documentary-review | yes |
| 6 | `pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete` | `/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete` (also `/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete/`) | 2025-12-23 | documentary-review | yes |
| 7 | `ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam` | `/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam` (also `/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam/`) | 2025-12-22 | documentary-review | yes |
| 8 | `gestione-manutenzione-immobile` | `/gestione-manutenzione-immobile` (also `/gestione-manutenzione-immobile/`) | 2025-12-16 | documentary-review | yes |
| 9 | `garden-design-esclusivo` | `/garden-design-esclusivo` (also `/garden-design-esclusivo/`) | 2025-12-16 | documentary-review | no |
| 10 | `opere-in-pietra-e-prospetti` | `/opere-in-pietra-e-prospetti` (also `/opere-in-pietra-e-prospetti/`) | 2025-12-16 | documentary-review | no |
| 11 | `pavimenti-stampati-in-resina` | `/pavimenti-stampati-in-resina` (also `/pavimenti-stampati-in-resina/`) | 2025-12-15 | documentary-review | no |
| 12 | `piscine-e-laghetti-zen` | `/piscine-e-laghetti-zen` (also `/piscine-e-laghetti-zen/`) | 2025-12-15 | documentary-review | no |
| 13 | `cucine-in-muratura-luxury` | `/cucine-in-muratura-luxury` (also `/cucine-in-muratura-luxury/`) | 2025-12-15 | documentary-review | no |
| 14 | `tecniche-avanzate-gestione-deformazioni-strutture-edili` | `/tecniche-avanzate-gestione-deformazioni-strutture-edili` (also `/tecniche-avanzate-gestione-deformazioni-strutture-edili/`) | 2024-06-20 | documentary-review | no |

Article detail pages live at their exact historical path; trailing-slash variants replace-redirect to the slash-less form.

## Review status and publication gate

- documentary-review: complete Italian text rewritten against the archived source, checked against cited public sources, and reviewed on the displayed date by automated editorial research. This is not human or professional approval.
- technical-review / editorial-review / summary-reviewed: retained as supported statuses for future items; no article currently uses these states.

Each article has a review record (`responsible`, `reviewedAt`, `sources`) and separately published full text. A build-time guard rejects full text without the complete review record or unresolved claim flags. Detail pages show the review method, date, source links and what each source supports; archive cards show the current status and date.

At the user's direction, no human review was required. The 14 public articles are revised Italian texts, not verbatim republication of the historical English copy. The review record states that the check was automated and lists sources consulted on 2026-11-09. Unsupported company-specific promises, guarantees, credentials, service availability, performance figures and tax claims were removed or qualified. The original source bodies remain unchanged and archival-only in `content/source-articles-it.json`. Automated documentary review is not a professional technical inspection, legal opinion, insurance confirmation, or approval by a licensed practitioner; the articles say so where relevant.

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
- Historical article bodies — retained unchanged in the source archive; the public versions are revised Italian texts with citations.
- Reviews page (/recensioni) had no reviews; no testimonials are shown or invented.

## Media

14 hero images copied locally to `public/media/articles/` (listed in manifest.json), one per article, all used by the archive, guide, search and detail views.

## New routes

/articoli, /ricerca, /guide, /progetti, plus 14 article detail paths. Preview `noindex, nofollow` in index.html is unchanged.
