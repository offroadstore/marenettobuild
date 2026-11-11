---
name: Marenetto visual direction
description: Owner's visual priorities and limits for homepage simplification.
---

The homepage should communicate a competent, concrete local construction company
through broad photographs, elegant readable typography, short text and restrained
copper details. Simplification must remove obstacles, not impoverish the
presentation. Avoid a framed opening image, generic text-only service boxes and
large nearly empty sections.

**Why:** The owner said the previous implementation was less attractive than the
original site, then explicitly rejected its loss of photographic impact in the
homepage revision brief. Functional professionalism is not a substitute for the
historical site's visual character.

**How to apply:** Preserve photographic richness when improving usability.
Keep the approved thin-line hybrid logo; use verified real project evidence
only when available. Missing authorised photographs require a clear preview
qualification and a request for originals, not invented portfolio material.
Keep comparisons at identical viewport sizes when demonstrating a visual
revision. A request to revise preview is not permission to publish.

Treat the homepage and article archives as separate presentation contexts.
Do not flatten every recovered CMS row globally to fix article thumbnail sizing.
The homepage should show each article once with consistent image proportions,
not reproduce both repeated CMS article widgets.

**Why:** A global row-sizing change produced a very long, narrow homepage with
uneven photos and repeated articles. The owner explicitly rejected that result
and requested coherent UI/UX rather than more isolated size adjustments.

**How to apply:** Preserve immutable source catalogs, but use scoped semantic
presentation for the public home. Check the entire page on desktop and mobile,
not just the hero or the article archive.

Server-rendered public pages must have their presentation styles available before
first paint, without depending on JavaScript hydration.

**Why:** The hybrid logo uses two crops of a large original image. Without its
styles at first paint, visitors briefly see two enormous originals before the
page resizes; a settled screenshot alone does not catch this defect.

**How to apply:** Preserve render-blocking stylesheet delivery and cascade order
when changing HTML templates or style entry points; verify the initial HTML and
production build, not only the page after scripts finish.

Disclose AI illustration through a plain, visible 12–13 px secondary-text note
at the end of the relevant section, translated into the page language:
“Immagini illustrative generate con IA; non rappresentano lavori eseguiti.”
One note may cover a clearly bounded group. No overlaid labels, boxes, icons,
highlighting, opacity tricks, tooltips or collapsed notices. Do not attach this
note to authentic photographs. Portfolio and construction before/after evidence
must be reserved for real work.

**Why:** The owner explicitly requested this disclosure treatment after seeing
the photographic homepage, rather than labels on each picture.

**How to apply:** Apply only to known illustrative AI imagery; when authorised
real photographs replace it, remove the corresponding group disclosure.
