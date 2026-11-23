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
