---
name: Browser locale and geometry
description: Screenshots and regression browsers can have different language prompts and therefore different control positions.
---

Matching viewport dimensions does not establish matching browser context.
Compare browser locale, language-suggestion banners and font readiness before
using a screenshot to explain a headless geometry failure.

**Why:** The screenshot browser displayed a language-suggestion banner on the
Italian homepage while the regression browser used Italian and did not.
The banner changed which content intersected the mobile WhatsApp control;
visibility in the screenshot did not establish visibility in the regression.

**How to apply:** Preserve the content-overlap safeguard. Do not infer a safe
test viewport from a screenshot alone or disable the safeguard to obtain a
passing test. Confirm the actual locale and geometry in the failing context.
