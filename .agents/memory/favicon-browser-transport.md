---
name: Favicon browser transport
description: Distinguish Chromium favicon handling under request interception from actual static-server delivery.
---

A failed browser fetch of the exact `/favicon.ico` URL under Playwright request
routing is not sufficient evidence of a site delivery regression.

**Why:** In this environment, Chromium failed that fetch before the routing
callback or server saw it, while an isolated context without interception and
independent HTTP requests received the correct ICO. A query-string variant
also behaved differently, so cache-busted success alone did not verify the
required exact URL.

**How to apply:** Keep browser-interception observations separate from exact-URL
server GET/HEAD evidence. Confirm a suspected favicon failure in an isolated
read-only browser context without request routing before changing delivery code;
do not weaken the site's security policy to work around the test harness.
