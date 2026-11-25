---
name: New-tab links beside unfinished forms
description: Preserve form state when opening notices; router-link target behaviour can differ from native anchors.
---

Use a native HTML anchor for a notice that must open in another tab while an
unfinished form stays mounted. Keep `target="_blank"` and
`rel="noopener noreferrer"`.

**Why:** In the installed Wouter 3.13.0, a plain click on its Link component
was intercepted despite the target attribute, navigating the same tab and
discarding the form state. A Ctrl-click worked, hiding the failure if only
modifier-click navigation was checked. No form submission was needed to
reproduce the loss.

**How to apply:** Check ordinary left-click behaviour, not just the rendered
target attribute or modifier clicks. Reassess router behaviour on upgrades;
do not assume that a routed link has the browser's native new-tab semantics.
