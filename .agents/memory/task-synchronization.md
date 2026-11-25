---
name: Task synchronization
description: Preserve validated behavior when completion replays a branch containing merges.
---

Do not leave functional changes solely in merge resolutions. Preserve the
complete intended result in ordinary commits before finishing task synchronization.

**Why:** Completion synchronization has replayed non-merge commits while
dropping changes introduced only by merge resolutions. This can discard owner
decisions or resurrect duplicate imports and obsolete tests, even when Main
was already integrated and the candidate had passed its checks.

**How to apply:** After synchronization, compare the full source tree with the
last validated candidate as well as incoming Main. Preserve both intended
sets of changes in ordinary commits. Base additional verification on the
actual resulting differences, not merely on a successful conflict resolution.
