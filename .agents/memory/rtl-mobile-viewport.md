---
name: RTL mobile viewport
description: A Chromium mobile viewport issue with dynamically setting the root document direction in this SPA.
---

Keep the outer document direction LTR in the client-side app and apply RTL to the locale-specific site shell. Dynamically setting `document.documentElement.dir = "rtl"` caused Chromium mobile emulation to widen the layout viewport and horizontally offset the entire page; the site shell's own `dir="rtl"` preserves the needed reading and layout direction.

**Why:** A mobile RTL request page rendered shifted offscreen even though its internal grids fit the device width. Root-level RTL produced a wider `innerWidth` and negative `scrollX`; keeping RTL on the app shell restored the 402px viewport.

**How to apply:** When testing RTL in this SPA, verify the rendered page at mobile width and keep document-level direction separate from the locale shell unless root RTL behavior is revalidated across supported browsers.
