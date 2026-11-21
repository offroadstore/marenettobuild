---
name: RTL mobile viewport
description: Owner-required document RTL and the historical mobile viewport regression.
---

Do not restore the old fixed-LTR document workaround without owner approval. Arabic and Hebrew must use RTL on the document as well as the locale-specific content.

**Why:** The owner explicitly requested locale-dependent document direction, superseding the earlier LTR-root workaround. Changing root direction previously affected Chromium mobile viewport geometry even when content fitted, so the historical regression still needs attention.

**How to apply:** Validate document and shell direction, horizontal overflow and viewport offset on mobile in both RTL locales, including navigation back to an LTR page. Correct any geometry regression rather than silently forcing the document back to LTR.
