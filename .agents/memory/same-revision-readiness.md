---
name: Same-revision readiness
description: Why startup editorial verification must avoid public deployment domains and assumed proxy ports.
---

Readiness must verify the same deployment's editorial state. Keep browser
shared-proxy routing separate from server-side service discovery; do not guess
an internal deployment proxy port from a workspace port or an observed log.

**Why:** A failed publish opened its service listeners but could not verify the
homepage because the deployment proxy mapping differed from the workspace
loopback address. Fetching the public domain instead is also unsafe: during
promotion it can still serve the previous successful deployment and mask a
broken new revision.

**How to apply:** Use explicitly configured same-deployment service connectivity
for server readiness and verify the actual homepage. Never interpret API
liveness or successful local checks as proof that the new production revision
or its editorial database passed startup.
