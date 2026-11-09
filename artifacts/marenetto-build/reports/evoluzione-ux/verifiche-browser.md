# Marenetto public journey UX check

**Verdict: FAILURE — responsive request-page horizontal overflow.**

## Journey and checks

- Followed the public journey `/` → Services (`/servizi`) → request CTA (`/richiesta`); then used browser Back to return to `/servizi` with the transient menu closed. No form was submitted and no values were entered.
- Home passed the requested emulated viewports for horizontal overflow (`document.scrollWidth <= innerWidth`), logo/header fit, and first-viewport CTA visibility: 320×700 DPR2, 390×844 DPR3, 430×932 DPR3, 844×390 DPR2, 768×1024 DPR3, 1024×768 DPR2, 1440×900 DPR1, and 2560×1440 DPR2. On mobile, search/header CTA were hidden and the hero text/action preceded the illustrative image. The widescreen media frame measured 960×520 CSS px with `object-fit: contain`.
- The logo uses the expected thin M/MARENETTO and bold white BUILD.COM-on-copper treatment. BUILD.COM computed as bold Barlow; measured white/copper contrast was 5.00:1. At 320px the logo, language and menu targets fit without overlap; language/menu targets were 44×44px. Hero CTA was visible in the 320px and landscape first viewports.
- Keyboard menu: Enter opened it, the first Services link received focus, Escape closed it and restored focus to the trigger. Opening the mobile menu while the language picker was open closed the picker, so the menus did not coexist. At 390×844 menu links were 50px high and the request action 52px; no clipping/offscreen controls were observed.
- Home content order was services → method → articles. No Progetti navigation/footer links or empty-portfolio notice were found; the image disclosure explicitly identifies imagery as illustrative, not a verified project.
- French (`/fr/`) and Arabic (`/ar/`) home spot checks displayed localized hero/CTA. Arabic verified `.site-shell dir="rtl"` with document `dir="ltr"`. Article cards remain Italian; this is not approval of all 29 locales.
- Reduced-motion emulation produced `animation-name:none`, duration `0s`, opacity 1, transform none for `.animate-enter`.

## Failure: request page overflows horizontally

The public request page violates the viewport-width check at phone and tablet sizes: document scroll width was **541px at 390px**, **1309px at 768px**, and **1670px at 1024px**. The horizontal scrollbar is visible in the short-viewport form screenshot. At tablet sizes, a radio input hitbox was wider than its form option (753px at 768px and 1009px at 1024px), extending beyond the body; other overflowing descendants also need to be constrained. Text fields/textarea otherwise measured 48px / 132px high. At 390×450, clicking the empty location field scrolled it into view (297×48px at y=193.6) and its center hit-test returned that input; no fixed overlay covered the field.

**Minimal correction:** constrain each radio input hitbox to its own `.radio-choice` option, and ensure request-page grid/card descendants use `min-width:0`/`max-width:100%` so the form and document stay within the viewport. Recheck the horizontal scroll width at 390, 768 and 1024 CSS px.

## Safety and verification limits

A context-wide guard was installed before navigation and allowed only GET/HEAD/OPTIONS. Seven incidental Clerk development-telemetry POSTs to `/v1/dev_browser` were blocked and logged separately; they were not form submissions or application failures. No API/DB mutations, uploads, authentication, contact-link activations, private-page tests, workflow restarts, or configuration changes occurred. Browser console also showed a Clerk development-key warning, a failed external Clerk fetch and a client-blocked Inspector resource; treated as incidental environment/dependency noise.

Only emulated browser viewports/DPRs were tested—not real devices or a real virtual keyboard. No Lighthouse, conversion, or all-locale semantic claims are made.

## Focused post-fix retest — request surface only (not a full pass rerun)

After the CSS update, reopened only the public `/richiesta` route under a GET/HEAD/OPTIONS-only guard. The request-page document widths were 375 at 390px, 753 at 768px, and 1009 at 1024px: all within their respective viewports, so the earlier horizontal overflow was not reproduced on these three tested widths. At each width, all three native radio input rectangles matched and stayed within their own `.radio-choice` label; hitboxes were 44px high. At 390×844, keyboard Tab reached the selected `radio-request-project` radio with `:focus-visible=true`; its blue focus ring was visible and selection remained unchanged. The footer `.mb-logo__bar` at 390 computed to white (`rgb(255,255,255)`) on copper (`rgb(169,90,51)`), Barlow, 700 weight, 14.7772px.

No form values were changed and no submission/API mutation occurred. The GET-only guard blocked one incidental Clerk development-telemetry POST to `/v1/dev_browser`, logged separately. The attached 390px screenshot evidence is `78fhve`. This was only the requested fixed-surface retest; the earlier whole-pass checks were not rerun.
