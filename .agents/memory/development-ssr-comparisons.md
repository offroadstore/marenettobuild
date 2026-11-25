---
name: Development SSR comparisons
description: Preserve content-sensitive evidence when development hot reload changes module cache tokens.
---

Do not equate a full development HTML hash change across hot reload/restart
with a published article revision change. Preserve raw evidence, compare the
active editorial snapshot, and exclude only documented development-module
cache tokens when making a content-identity assertion.

**Why:** A development restart restored the original article HTML while an
intermediate capture carried Vite's numeric module timestamp. Treating those
tokens as article changes produced a misleading isolation-check failure.

**How to apply:** Keep the old baseline and report its limitation instead of
silently replacing a failed comparison. Content, canonical, structured data
and language differences must still fail the comparison. Distinguish a new
post-restart baseline from proof against the original pre-change capture.
