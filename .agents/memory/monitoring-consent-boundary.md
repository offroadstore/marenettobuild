---
name: Monitoring consent boundary
description: Distinguish owner authorization to configure reporting from permission to track visitors.
---

The owner explicitly authorized configuring and using monitoring. Do not keep requesting general permission to implement it. A supplied public GA4 measurement ID does not grant report access or approve visitor tracking.

**Why:** The owner clarified “certo che puoi configurare e usare monitoraggio” after supplying the public measurement ID. Repeating a general permission question would misrepresent the remaining technical prerequisite as missing permission.

**How to apply:** Continue configuring the reporting capability independently. Explain missing Google OAuth application setup or account consent as specific technical requirements. Do not infer privacy approval, consent from visitors, or authorization to load tags on the public website from that statement.

**Publication check:** Replit can inject a telemetry script from `i.replit.com` into live HTML even when the app does not reference it and the local build has none. Do not whitelist it merely to silence CSP Report-Only messages.

**Why:** It is platform telemetry, not a dependency of the consent-gated site; allowing it would add an unrelated collection path.

Analytics isolation must prevent provider code from accessing the main site's authenticated context, not merely put it in a removable element. Do not grant a script-enabled srcdoc frame same-origin access.

**Why:** A same-origin frame can read the parent and install timers there, which defeats removal-based revocation and exposes an owner visiting the public site while signed in.

**How to apply:** Preserve an opaque sandbox or a genuinely separate origin, restrict network access, and validate a narrow messaging protocol. Test attempted parent DOM/storage/timer access as well as normal tracking and withdrawal. Simulated acceptance still does not certify real GA4 reception.

For collection tests, acceptance and an iframe-ready message are not proof of a working loader: assert that the provider script is actually requested before asserting events.

**Why:** A sandbox bootstrap can execute and report readiness while its external provider script never loads; consent controls alone can therefore look healthy while no data can be collected.

**How to apply:** Keep loader-request, received-event and parent-isolation checks separate. A later failing full validation supersedes earlier successful focused runs; do not weaken isolation or claim collection works from the earlier result.

The owner chose preparation of a dedicated analytics origin, independently isolated from the website and console. This approval is not permission to deploy it or modify DNS.

**Why:** Keeping third-party analytics outside the authenticated site's context requires a real security boundary; accepting infrastructure prerequisites is preferable to granting the provider access to that context.

**How to apply:** Keep the dedicated runtime on an exclusively reserved, different registrable domain, not merely a subdomain that could share authentication cookies. Require confirmed origins and separate release/privacy approvals; do not fall back to the application origin when the dedicated deployment is missing.
