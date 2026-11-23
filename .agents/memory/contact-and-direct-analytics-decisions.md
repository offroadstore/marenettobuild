---
name: Contact and direct analytics decisions
description: Owner-approved email-only contact handling and direct consent-gated GA4; preserve the alternative isolated runtime.
---

The owner requires the public enquiry form to send only a notification email
to the approved business inbox. Do not retain submitted names, emails, phone
numbers or messages in the site's database; do not create leads, synthetic lead
codes or lead receipts. Show only an email-submission confirmation. Remove form
copy referring to attachments and leads.

**Why:** The owner explicitly replaced the database-backed enquiry requirement
with email-only handling. The new supplied privacy text already describes that
intended behavior, but importing text is not implementation or proof of it.

**How to apply:** The owner approved the separate enquiry and direct-analytics
plans on 2026-11-23. Implement within those boundaries.
Include queues, notifications, retry records and request logs in the no-persistence
boundary. Do not delete existing records or remove unrelated internal features
without separate authorization.

The owner chose direct GA4 loading on public pages, only after explicit
consent, with no advertising features and immediate revocation. Exclude all
private/authenticated surfaces, including internal, sign-in and sign-up routes.
The dedicated-domain requirement is no longer desired for this direct path;
retain the isolated runtime code for the existing alternative.

**Why:** The owner explicitly superseded the dedicated-domain-only approach.
The separate analytics plan was subsequently approved on 2026-11-23.

**How to apply:** Explain direct-script privacy and revocation limits, preserve
preview/release safeguards, and test no pre-consent requests, private-route
exclusion and withdrawal using simulated providers before real collection.
Do not modify Secrets or set approval flags for the dedicated runtime.
The direct path does not need that runtime's dedicated-domain prerequisite.

The consent interface must be a thin bottom bar with brief statistics-only
copy and equally weighted Accept/Reject actions, not persistent analytics
preferences/withdrawal controls. After either choice it disappears for six
months; the sole persistent access is a small “Preferenze cookie” footer link
that reopens the same bar. No overlay or overlap with mobile contact/WhatsApp.

**Why:** The owner found the old four-button panel obscured the homepage motto
and that the remaining fixed preferences/withdrawal strip could not be closed.

**How to apply:** Keep GA4 strictly opt-in and Consent Mode v2 unchanged.
Reopening alone does not change consent; Reject after acceptance withdraws it.
Preserve valid stored choices across this visual-only change. Target one desktop
row and two mobile rows at 375 px without sacrificing legibility or tap targets.

The owner subsequently authorized Meta Pixel with a marketing consent category
separate from analytics, denied by default and revocable. The former
statistics-only consent UI and legal claim of no marketing are superseded for
this integration; existing analytics consent must never imply marketing consent.
Google advertising consent remains denied.

**Why:** The owner explicitly requested Meta measurement/advertising, but limited
events to public PageView and non-personal Lead/Contact and prohibited Advanced
Matching or customer data transfer.

**How to apply:** Update notices only within the authorized Meta scope and explain
technical network data honestly. Maintain private-route exclusion, compact consent
UI and footer reopening; do not equate installation with connected Insights data.

The Meta integration deliberately uses the official manual image transport,
not the executable SDK, and omits cross-origin credentials and HTTP referrer.
No Meta first-party advertising identifiers are generated.

**Why:** The SDK's documented automatic URL/referrer and page/button collection
conflicts with the strict boundary around public enquiry data. A reduced,
explicit transport avoids executing vendor code next to the form; attribution
is correspondingly limited and event receipt must not be certified locally.

**How to apply:** Do not replace it with the SDK or add matching/click identifiers
as a routine optimization. Any such change needs a new privacy and consent review.

Failed consent withdrawals must remain denied across a provider's required
document reload, not merely until React next restores storage.

**Why:** A browser can allow reading an old grant while refusing its replacement
or deletion. Reloading to unload third-party code can otherwise restore that grant.

**How to apply:** Treat failed writes as a separate denial condition that survives
the controlled reload. Clear it only following a successfully saved explicit choice.
