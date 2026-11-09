---
name: Documentary asset recovery
description: Distinguishing missing repository files from reports registered as Library outputs.
---

An audit report absent from the merged workspace may still have been registered as a Library output. Distinguish recovered original bytes, an output registration trace, and a reconstructed replacement; never describe these as equivalent.

**Why:** A report saved in an ignored directory had HTML/ZIP asset registrations but no merged report files. Looking only at the filesystem produced an incomplete account of the prior delivery.

**How to apply:** Inspect available output registrations and Git history before concluding that a deliverable was not produced. Document where recovery was attempted. An anonymous storage HTTP 403 proves lack of access by that method, not deletion. Keep the consultable replacement in a versionable documentary directory.
