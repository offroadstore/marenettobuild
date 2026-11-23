---
name: Google review data restrictions
description: No short-TTL cache exemption for reviews; server-only avatar delivery and billing boundaries.
---

Treat Google review texts, ratings and author photos as restricted content,
not as data eligible for a short-TTL response cache. Share only work still in
flight and retain the data solely for the current display; never add real
review screenshots or payloads to build outputs, editorial archives or tests.

**Why:** The official Places policies checked on 2026-11-23 explicitly exempt
place IDs and certain coordinates from caching restrictions, not reviews.
A short TTL is not itself permission to store protected content. The owner
also requires browser-to-Google requests to be avoided, including avatars.

**How to apply:** Recheck current policies before changing transport or
retention. Avatar bytes may pass through the server for current display,
without becoming an image library/cache or accepting visitor-supplied URLs.
Keep fallback links when full attribution cannot be delivered safely.
Counter-based throttles are not content caches or guaranteed spending caps;
process-local limits reset on restart and multiply across instances.
For EEA billing, verify the actual permitted use for the owner's official
location rather than assuming non-EEA terms apply.
