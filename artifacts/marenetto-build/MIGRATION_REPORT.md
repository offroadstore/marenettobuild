# Avvertenza sulla verifica storica successiva

Questo documento precedente descrive la ricostruzione e le rielaborazioni del
progetto; non certifica una copia fedele dei testi storici. La successiva
acquisizione indipendente di novembre 2026 ha riscontrato edizioni e archivi
pubblici mancanti o differenti. Vedere `HISTORICAL_FIDELITY_FINDINGS.md` e i
diff consegnati. La migrazione non è conclusa e nessun originale è stato
riscritto per nascondere le differenze.

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

## Reconstruction comparison — 2026-11-09

The live homepage, `/sitemap.xml` and `/en/chi-siamo/` were checked against
the unchanged October archives and the existing application. The live sitemap
still lists **27 URLs**: homepage + 11 content/listing pages + the 14 articles
listed above + the incomplete `/translation-ok/` endpoint.

### Complete historical page disposition

| Historical section | Current destination | Editorial decision |
|---|---|---|
| Homepage `/` | `/` (and approved locale home equivalents) | Keep revised service and overseas-owner content; restore recognizable historical presentation and links to reviewed articles. |
| Articles `/articoli/` | `/articoli` | All 14 revised articles, original dates, local cover images, review records and sources retained. |
| About `/chi-siamo/` | `/come-lavoriamo` | Method and responsibilities replace unsupported experience, technology and delivery guarantees. |
| Contacts `/contatti/` | `/contatti` | Existing phone, email, WhatsApp, address and preview-safe request journey retained. |
| Turnkey renovation landing page | `/servizi#contatti` when the old contact fragment is present; otherwise `/servizi` | Service scope retained; no free visit, rapid response, internal technical team or unconditional permit-handling promises restored. |
| General contractor | `/servizi` | Current six service groups cover this purpose with explicit scope and professional-role qualifications. |
| Construction and renovations category | `/articoli` | Reuse the current populated archive and its working topic filters. |
| Bonuses and permits category | `/guide` | Historical listing was empty. Link to populated guides instead of inventing incentives or republishing an empty category. |
| Works and construction category | `/progetti` | Keep the explicit verified-material requirements and useful guide/request links; no invented projects. |
| Outdoor and garden category | `/servizi` | Current outdoor group and related reviewed garden, stone, pool and kitchen articles cover the subject. |
| Support and emergency category | `/contatti` | Contact route only; no emergency availability or response-time commitment. |
| Reviews `/recensioni/` | `/progetti` | Historical reviews were empty. No testimonials restored; project criteria explicitly require consent and evidence. |
| 14 article URLs | Same historical Italian paths (inventory above) | All preserved, including trailing-slash canonicalization. No archived unreviewed body is imported into the browser. |
| `/translation-ok/` | Not found | Incomplete booking fragment, not a working calendar or enquiry service. |

### English links emitted by the source

The archived article listing contains 14 `/en/<translated-slug>/` links even
though the sitemap lists Italian paths. These exact English aliases now replace-
redirect to their corresponding reviewed **Italian** article; they do not claim
an English edition exists. The explicit alias inventory is in
`src/content/historical-routes.ts`. It also covers the source's English category
links and `/en/chi-siamo/`, `/en/contatti/` and `/en/articoli/`. Service/contact/
method aliases use the existing approved English page; library destinations
remain Italian. Both slash variants work, only approved UTM parameters are
carried forward, and fragments are preserved. Unknown English paths and
`/en/translation-ok/` remain not found; there is no wildcard translation fallback.

### Visual reconciliation and exclusions

Documented source cues: fine diagonal M and spaced black wordmark, Barlow body
text, Gilda Display headings, white/light neutral surfaces, charcoal text and
slate-blue accents, a centered title over the sunset construction image, and
image-led article navigation. Those cues replace the unrelated orange/Archivo
lockup while retaining the current responsive navigation, service hierarchy,
working-method content, owner-abroad pages and clear calls to action.

Only local historical imagery is used. Homepage provenance and usage limits
remain in `public/media/home/README.md`; article images retain their source
manifest and are illustrative, not evidence of company work or equipment.
The contact footer replaces the old empty account/useful-link columns and the
unconnected newsletter. No newsletter, calendar, reviews, fake project, insurer
coverage, equipment claim or new third-party embed is introduced.

The 29 owner-approved core language editions and their catalogs are unchanged;
the article library remains explicitly Italian. Document-level LTR and
locale-shell RTL are preserved. The internal portal, credentials, mail services,
domain, deployment configuration and indexing controls are not changed.

### Regression checks

`tests/historical-reconstruction.spec.ts` derives the 14 English article aliases
from the unchanged source archive and verifies their reviewed destinations,
campaign filtering, noindex, documented navigation aliases and excluded URLs.
Existing migration-route and home-brand suites continue to cover Italian
historical redirects, images, search, filters and desktop/mobile home navigation.

The additional `test:i18n` check currently reports six **pre-existing** missing
translation-source entries: the English home-link accessibility label and five
descriptive English illustrative-image alternatives. These phrases were already
in the original application before this reconstruction; the 29 approved
catalogs are not silently amended or marked approved here. The catalog,
metadata, RTL and bundle/indexing checks pass. Completing those six accessibility
translations requires the normal owner-review path.
