---
name: RTL mobile viewport
description: Owner-required document RTL and the historical mobile viewport regression.
---

Do not restore the old fixed-LTR document workaround without owner approval. Arabic and Hebrew must use RTL on the document as well as the locale-specific content.

**Why:** The owner explicitly requested locale-dependent document direction, superseding the earlier LTR-root workaround. Changing root direction previously affected Chromium mobile viewport geometry even when content fitted, so the historical regression still needs attention.

**How to apply:** Validate document and shell direction, horizontal overflow and viewport offset on mobile in both RTL locales, including navigation back to an LTR page. Correct any geometry regression rather than silently forcing the document back to LTR.

Localized content and search metadata can look correct while the document
still retains the previous language and direction after client navigation.

**Why:** A pillar journey changed its URL and heading from Arabic to German
while the document remained Arabic/RTL; fresh page loads did not expose it.

**How to apply:** Inspect document `lang` and `dir` after in-app language changes,
not only on reload. Do not dismiss persistent stale attributes as a timing
issue merely because the content has already changed.
