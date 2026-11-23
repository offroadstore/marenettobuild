---
name: Font source validation
description: Upstream font responses can vary even for the same Google Fonts CSS request.
---

Treat the upstream stylesheet's declared format and downloaded file signature as
authoritative, not the download URL's filename extension.

**Why:** Google Fonts can return either a `.woff2` path or an extensionless
`/l/font?kit=...` URL for the same variable-family request. Rejecting URLs solely
because they lack the extension incorrectly rejects valid licensed WOFF2.

**How to apply:** During explicit asset maintenance, verify `format('woff2')`,
the `wOF2` signature, license and content hash. Preserve Unicode ranges and
optical-size axes. Keep acquisition separate from build/runtime so visitors
never contact the upstream service.
