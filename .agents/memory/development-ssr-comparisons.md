---
name: Development SSR comparisons
description: Separate raw development evidence, instrumentation and reconstructed production metadata.
---

Do not equate a full development HTML hash change across hot reload/restart
with a published article revision change. Preserve raw evidence, compare the
active editorial snapshot, and exclude only documented development-module
cache tokens when making a content-identity assertion. Development-to-production
body comparisons may also exclude the editor's `data-replit-metadata` and
`data-component-name` attributes when their exact whitelist is documented.
Keep requested structural additions separately identifiable; never normalize
away old paragraphs, links, metadata or language changes.

**Why:** A development restart restored the original article HTML while an
intermediate capture carried Vite's numeric module timestamp. Treating those
tokens as article changes produced a misleading isolation-check failure.

**How to apply:** Keep the old baseline and report its limitation instead of
silently replacing a failed comparison. Content, canonical, structured data
and language differences must still fail the comparison. Distinguish a new
post-restart baseline from proof against the original pre-change capture.

Production baseline builds must also use the same canonical source root, not
just identical frontend files.

**Why:** Moving a source snapshot into an ignored generated directory and
symlinking dependencies changed Tailwind's source discovery and CSS hashes,
despite byte-identical emitted client JavaScript. That isolated build was not
valid evidence of an application regression.

**How to apply:** Preserve the original raw capture. Prefer a baseline acquired
in the canonical root before edits. For post-sync comparisons, a baseline with
the incoming template in that same root is valid only after proving the frontend
sources match incoming Main. Do not hide asset-hash or content differences with
broader normalization.

Executable development scripts can contain literal HTML examples, including
`<title></title>`. Inspect actual document markup, not those script strings,
when counting titles, links or headings.

**Why:** The preview error reporter embeds such examples, while the editor
also injects source-location attributes absent from a production build. A
regex over the whole response falsely reported empty titles and changed
article bodies.

**How to apply:** Preserve raw files and hashes. Exclude executable script
bodies from markup extraction but parse JSON-LD separately. Do not call preview
noindex-to-production indexable flags an SEO improvement. If comparing old
production metadata by reconstructing its exact recorded source policy, label
that as reconstructed evidence, never an old production HTTP capture.
