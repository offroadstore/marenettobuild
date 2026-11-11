---
name: Editorial fallback safety
description: Why an immutable historical catalog is not a safe fallback when publication or withdrawal state is unavailable.
---

If the current editorial state cannot be read, return an unavailable response
instead of serving an older static article. Apply this both after a cold web
restart and after a previous successful read.

**Why:** A static catalog contains the pre-withdrawal article. Treating a failed
read as “no overrides” republishes withdrawn text, even though the originals
themselves were correctly preserved. Immutability of evidence is not permission
to serve it again.

**How to apply:** Keep an empty, successfully verified active snapshot distinct
from a failed read. Test a withdrawal, web-process restart and unavailable API
as one sequence, not only a renderer given an already-known withdrawal marker.

An unverified browser session is not a verified empty catalog either. Static
internal shells can start without a publication snapshot; client navigation
must wait for verification, and a failed refresh must hide public fallback
content rather than retaining permission to render it.

**Why:** A server-only 503 does not protect a client-side route change, which
does not request a new HTML document.

**How to apply:** Track loading, verified and unavailable states separately.
Only HTML produced after a successful state read may seed verified browser
state. Test cold private-shell navigation before the first response and after
a failed response, as well as a known withdrawal marker.
