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

Do not rewrite approval indexes during normal builds, including development
API startup builds. Compilation must verify the committed index rather than
silently regenerating a different public authorization.

**Why:** API and web artifact builds can run concurrently. A source-index write
restarted an active Vite SSR build and closed its renderer mid-render; allowing
different indexes would also let API authorization and client metadata diverge.

**How to apply:** Require an explicit reviewed authoring command for regeneration;
verify indexes in every normal API/web build, and disable source watching in
one-shot SSR generation. Development mode alone is not authoring permission.

Apply an explicitly authorized SEO-only title presentation without replacing an
unchanged approved manuscript merely to alter its search title. Keep its approval
digest distinct from the presentation/route authorization, and do not apply an
old presentation to a genuinely later owner-approved composition.

**Why:** The release authorization requires preserving shared purchase revisions
and later drafts while refining URLs and search titles. Reimporting old text for
a metadata adjustment would destroy that editorial continuity.

**How to apply:** Verify both payloads independently, retain manuscript history,
and let later approved content win over the earlier presentation.

An exact release approval does not automatically authorize reconciling unmatched
private imports. Obtain a separate, explicit decision for the enumerated cases
before extending the accepted bases, and retain the old revisions.

**Why:** The owner separately authorized only the ten reported private purchase
imports after seeing their conflict inventory. That decision was not a general
approval of future imports or permission to erase their history.

**How to apply:** Bind each exception to identity, locale, path, recorded hash,
semantic content digest, source and untouched private state. A later edit,
withdrawal or foreign collision must still fail closed.
