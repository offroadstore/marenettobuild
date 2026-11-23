---
name: Privacy and AI transparency
description: Owner requirements for factual privacy notices, conditional consent and per-image AI disclosure.
---

General consent controls and per-image AI transparency must cover all
12 public languages. The owner-supplied legal pages are an explicit exception:
keep `/privacy` and `/cookie` exclusively Italian, with their original wording
unchanged from the latest owner-designated remote revision as documented in
`legal-text-fidelity.md`. Do not recreate foreign legal editions or replace the supplied general
AI notice with older wording. Use only documented company details, actual services and
approved retention periods; disclose missing or unconfirmed information.

**Why:** The owner requires verified implementation, not invented legal facts
or a decorative claim of GDPR compliance.

**How to apply:** Inventory actual cookies, storage and third-party requests.
If only technical tools are active, do not add an unnecessary consent banner.
Otherwise block consent-requiring tools until choice, offer equally prominent
accept/reject plus customization, record choices minimally and allow revocation
through footer preferences. Do not confuse a contact request with marketing consent.

The public `/richiesta` form now has an owner-requested email-only direction,
with no database persistence, subject to a separate plan before implementation;
see `contact-and-direct-analytics-decisions.md`. Do not confuse this new rule
with the separate callback flow described below.

For callback enquiries, the owner requires automatic deletion after 24 months,
except where the enquiry became an acquired client. A privacy-read
acknowledgement is mandatory and initially unchecked; marketing permission and
permission to use WhatsApp are separate, optional and initially unchecked.
Consent evidence must include date/time, notice version and language.

Serve site fonts from the site's own domain, not Google Fonts or another
third-party font CDN, while preserving the approved typography and required
language glyphs.

**Why:** The owner requires removing visitor requests to Google Fonts without
changing the site's appearance.

**How to apply:** Use licensed local WOFF2 assets, only the needed weights,
font-display swap and targeted preloads. Keep remote font imports and connection
hints out of served CSS/HTML and remove their CSP allowances.

**Why:** The owner expressly defined the callback retention policy and
separated responding to an enquiry from permission for offers or WhatsApp.

**How to apply:** Reflect these business rules in the callback flow, retention
process and privacy notice; do not infer marketing permission from submission
or treat a closed enquiry as proof of an acquired client.

AI-generated or AI-modified images require individual visible, localized labels
as well as the general footer disclosure and linked AI-use page. Unknown
provenance is not proof of authenticity; ordinary resizing/WebP conversion is
not evidence of AI generation.

**Why:** The owner explicitly replaced the earlier footer-only disclosure
direction with per-image transparency and prohibited AI imagery as real-work evidence.

**How to apply:** Keep an evidence-based asset inventory. Preserve the approved
logo and hero masters, label their presentation where applicable, and reserve
portfolio/before-after evidence for documented originals. Claim team verification
only after actual human review; distinguish the owner's broad disclosure policy
from the specific legal scope of AI Act Article 50.

YouTube embeds require a valid external-media choice before loading, with
local placeholders when a video is absent or consent is refused/revoked.

**Why:** The owner requested article/video episodes with cookie-gated loading
and prohibited invented content. Privacy-enhanced embeds alone do not establish
consent or justify fabricated video metadata.

**How to apply:** Avoid remote player/thumbnail requests before consent. Publish
VideoObject and a claimed transcript only for an actual available video with
verified metadata; an article is not a transcript of a video never recorded.
