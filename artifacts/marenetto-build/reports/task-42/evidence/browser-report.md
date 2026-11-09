# Marenetto Build documentary browser audit

**Captured:** 2026-11-09 (timestamp also recorded in JSON)  
**Outcome:** Partial audit completed safely; no data-changing or outbound action was performed.  
**Full evidence register:** `/tmp/marenetto-audit-browser/evidence-register.json`

## A. Method and scope

Anonymous browser-only inspection of the running local proxy (`http://localhost:80/`) and public historical site (`https://www.marenettobuild.com/`) as separate origins at desktop 1440×900 and mobile 390×844. Browser context routing allowed only GET, HEAD, OPTIONS; no login, registration, form entry/review/send, upload, workflow restart, external tel/mail/WhatsApp activation, test suite, or app/config/code changes. Source manifests read: `artifacts/marenetto-build/src/localization/locales.json` and `artifacts/marenetto-build/src/localization/public-pages.json`. Findings and report are the only files written, under `/tmp/marenetto-audit-browser`.

## B. Anonymous discovery journey

- **Preview home:** Italian, “Costruzioni, ristrutturazioni e cura della tua proprietà a Cefalù.” CTA directs to services/request; hero explicitly identifies its image as illustrative, not portfolio. Desktop/mobile screenshots: `8vztkh`, `vruivz`.
- **Preview services:** `/servizi` lists construction, finishes, infiltration troubleshooting, outdoor spaces, property care, and pre-purchase support; request CTA goes to `/richiesta`. Screenshot `fs91vp`.
- **Remote owner:** `/proprietari-all-estero` discusses local assistance, communication, and agreed expectations. Explicitly qualifies that Herman speaks Italian, English, Dutch, and Spanish, and website language does not guarantee a matching contact. Screenshot `y47yt5`.
- **Enquiry preparation:** `/richiesta` starts with “Progetto / lavori”; required and optional fields are catalogued in JSON. No attachment control exists. Initial preview copy says not to enter real personal data, entered values are discarded and only a synthetic lead is retained, internal notifications persist, email sending awaits provider approval, and automated replies are inactive. No field was filled and “Rivedi la richiesta” was not pressed. Screenshot `xsxy91`.
- Contact targets were recorded (email, WhatsApp, telephone) but not activated. Public site has a floating WhatsApp action; public testimonial empty-state text is Italian despite English interface. Public mobile screenshot `6er1z3`.

## C. Metadata, branding, layouts

- Preview root title `Costruzioni e ristrutturazioni a Cefalù | Marenetto Build`, `lang=it-IT`, `robots=noindex, nofollow`, canonical points to the Replit app domain, 29 hreflang alternates, favicon `/favicon.svg`. Logo intrinsic dimensions 1536×560, desktop render about 150×62 and mobile about 110×46.
- Public `/en/` title `Home | marenettobuild.com`, `lang=en`, canonical `/en/`, no robots meta; nine alternates (IT/EN/FR/DE/ES/NL/RU/PT/PL). Logo is visible and reported as external CSS background; favicon/touch icon use an uploads3 URL.
- Sites show materially different hero copy. Public site uses legacy-template content and Home/Articles/About Us/Contacts navigation; preview has service/process/foreign-owner/articles/projects/contact navigation.
- No performance metrics or benchmark claims were made.

## D. Locale availability vs. translation quality

The source declares 29 locales × six core pages (174 manifest combinations). Runtime sampling confirmed localized title, h1, and non-empty body on 12 preview route combinations for FR/SV/DA/NO/AR/HE services and request. This establishes sampled **availability only**, not semantic equivalence or translation quality. Arabic/Hebrew content appears RTL, but `documentElement.dir` was `ltr` on both services and request routes. Exhaustive 174-route verification was not completed.

Public historical home probes rendered for IT/EN/FR/DE/ES/NL/RU/PT/PL; SV/DA/NO returned Italian-language 404 pages. Other detected selector locales were not fully checked. Public `/en/articles/` remained an English listing. Preview `/en/articoli` resolved to `/articoli` with Italian label “ARCHIVIO ARTICOLI”. A guessed legacy English article slug produced a 404; since the exact legacy slug was not confirmed, this does not conclusively establish redirect behavior. Unknown preview `/zz/` shows `404 Page Not Found` / “Did you forget to add the page to the router?”.

## E. Manual keyboard/accessibility notes

Preview mobile Tab traversal reached logo, search, language selector, menu, then page links; each of 12 sampled focus stops computed `outline: solid 2px`. Language and menu controls remained collapsed; no navigation or external action occurred. Public mobile hamburger is rendered as a link (`href=#`), not activated. This is a limited manual spot check, not a WCAG audit; screen-reader, contrast, and exhaustive keyboard checks were not performed.

## F. Limitations and operational notes

The proxy returned rendered app content; no workflow restart was needed. Preview console included Clerk development-key warning and `TypeError: Failed to fetch`; public pages logged failed-resource errors and Framework360 info. These did not prevent captured pages from rendering. Form validation/error copy was not sampled by submission because sending was explicitly forbidden. The full 174-route matrix, exhaustive selector enumeration, exact legacy article slug redirect, full translation equivalence for all requested languages, public header/footer natural logo dimensions (logo is not an `<img>`), exhaustive contact inventory, and performance timings remain unverified.

## Evidence register

See JSON for captured timestamp, URLs, viewports, methods, route findings, contact href safety, and screenshot IDs/descriptions.

## Targeted evidence-gap correction / appendix (2026-11-09)

This appendix supersedes ambiguous logo-source, RTL, legacy-slug and escape-key statements above. It is a targeted continuation, not a full audit rerun. Browser actions remained read-only and GET-only for navigations; no app changes or form actions.

### Visible logo image evidence (all `document.images`, after image decode)

- **Preview**: `http://localhost/brand/current-logo.png`, natural 1536×560. Desktop 1440×900: header image 150.05×62 at (102.5,14), CSS-visible and in viewport; footer instance 150.05×62 at y=6014.75, CSS-visible but outside viewport. Mobile 390×844: header image 110.16×46 at (12,16), CSS-visible and in viewport; footer instance 110.16×46 at y=7499.08, CSS-visible but outside viewport.
- **Public historical site**: visible logo is the requested `https://uploads3.fw360.it/uploads/env/4/15607/img/logos/bg-8fafd03d-5e74-4dce-b4b9-fd878182c53a-1.png` image in an `IMG > PICTURE > A` inside the top navigation logo block (`div.ms-block-logo`; not a semantic `<header>` element). Natural size 1097×400. Desktop 1440×900: 191.97×70 at (157.5,15); mobile 390×844: 137.125×50 at (43.94,10). Both CSS-visible and in viewport. `currentSrc` varies with query/version and uses WebP width 400. The Framework360 console graphic `https://marenettobuild.myframework360.com/assets/img/logo.png` is a vendor console graphic and is **not** evidence for the visible page logo.
- Favicon targets: preview `http://localhost/favicon.svg`; public `https://uploads3.fw360.it/uploads/env/4/15607/img/logos/favicon-32x32.png?1766850951305&v=1794255531` for both `shortcut icon` and `apple-touch-icon-precomposed` (query/version may vary).

### Direction metadata

On both `/ar/services` and `/he/services`, `.site-shell[lang=ar/he]` had `dir="rtl"` and computed CSS `direction: rtl`; `documentElement.dir` and body computed direction were `ltr`. Therefore the shell-level RTL behavior is present; the document/body values alone do not establish a broken RTL implementation.

### Exact historical English alias

Read `artifacts/marenetto-build/src/content/historical-routes.ts` and tested the exact source-defined alias by GET: `/en/buying-and-renovating-a-house-in-cefalu-a-technical-guide-to-the-5-essential-checks` resolved to `/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali`, with Italian document language and article title. This replaces the earlier test of an unverified guessed path; the exact alias works.

### Keyboard menu close behavior

At 390×844 on a preview page, keyboard Enter on the focused menu trigger opened the menu (`aria-expanded=true`, label “Close menu”, menu links exposed). Keyboard Escape left it open (`aria-expanded=true`, menu still visible, focus remained on the trigger with a 2px outline). No link was followed and no form was touched. Screenshots: `662ivj` open menu; `43dldq` after Escape. This is a specific observed keyboard behavior, not a full accessibility assessment.

Updated exact values and screenshot references are appended to `evidence-register.json`.
