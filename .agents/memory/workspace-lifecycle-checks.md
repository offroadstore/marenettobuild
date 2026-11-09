---
name: Workspace lifecycle checks
description: Avoid silent no-op package selection in critical setup commands.
---

Critical pnpm lifecycle commands should use an exact workspace package selector and `--fail-if-no-match`.

**Why:** A selector that matches no package can exit successfully without running the command. This left the internal portal without its database tables even though setup appeared successful.

**How to apply:** When changing post-merge or schema setup commands, confirm the selector actually runs the intended package. An HTTP health response alone does not prove that database-backed authorization is ready.
