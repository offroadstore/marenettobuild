---
name: RTL mobile viewport
description: Separate document direction from locale content direction in this SPA.
---

Keep the outer document direction LTR in the client-side app and apply RTL to the locale-specific site shell.

**Why:** Dynamically changing root direction can affect Chromium mobile viewport geometry even when the content itself fits. Locale-shell direction preserves RTL reading without changing the outer viewport.

**How to apply:** When testing RTL in this SPA, verify the rendered page at mobile width and keep document-level direction separate from the locale shell unless root RTL behavior is revalidated across supported browsers.
