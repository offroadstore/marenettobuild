---
name: Locale dates during hydration
description: Browser and server locale support can silently format the same calendar date differently.
---

Do not assume that passing the same locale to `Intl.DateTimeFormat` guarantees the
same server and browser text. Preserve deterministic initial calendar-date output.

**Why:** In the workspace, a complete rendered pass found hydration mismatches
concentrated in bosnian, macedonian and belarusian editions. Runtime ICU support and
browser fallback locale differed; a browser using its default English locale could
hide the failure seen with the configured Italian browser locale.

**How to apply:** Keep original editorial calendar dates unambiguous. If restoring
localized month names, preload the same locale data or provide identical explicit
formatting on both sides, and test with the actual browser locale rather than only
the default browser context.
