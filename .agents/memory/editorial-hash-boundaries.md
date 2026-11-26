---
name: Editorial hash boundaries
description: Preserve approval digests while comparing content after PostgreSQL jsonb serialization and parallel builds.
---

Keep the original approval digest scheme stable. After PostgreSQL `jsonb`
round-trips, compare stored manuscripts structurally against the exact approved
payload as well as checking recorded revision/source hashes and events.

**Why:** `jsonb` reorders object keys. Recomputing an insertion-order
`JSON.stringify` fingerprint can reject an unchanged approved manuscript.
Conversely, trusting just the stored hash/event can accept a body changed
without updating its hash. Both content equality and ledger identity matter.

**How to apply:** Never change a historical digest algorithm merely to repair
a comparison boundary. Normalize object-key order for semantic comparison,
retain array order, and fail closed if recorded identity and content diverge.

Do not rewrite an unchanged approval index during a build. Production
compilation must verify its committed index rather than silently regenerating
a different public authorization.

**Why:** API and web artifact builds can run concurrently. A source-index write
restarted an active Vite SSR build and closed its renderer mid-render; allowing
different indexes would also let API authorization and client metadata diverge.

**How to apply:** Make development generation deterministic/no-op when identical;
require an explicit reviewed regeneration for changes, and disable source
watching in one-shot SSR generation.
