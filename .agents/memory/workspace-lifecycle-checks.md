---
name: Workspace lifecycle checks
description: Avoid silent no-op package selection in critical setup commands.
---

Critical pnpm lifecycle commands should use an exact workspace package selector and `--fail-if-no-match`.

**Why:** A selector that matches no package can exit successfully without running the command. This left the internal portal without its database tables even though setup appeared successful.

**How to apply:** When changing post-merge or schema setup commands, confirm the selector actually runs the intended package. An HTTP health response alone does not prove that database-backed authorization is ready.

Validate SEO responses through the active serving workflow as well as any isolated prepared handler.

**Why:** Passing delivery tests against a prepared server did not prevent the running development server from returning an HTML fallback for a sitemap URL.

**How to apply:** Check response content type and body, not merely HTTP 200 or a generated file's existence, before claiming the configured preview or release server serves valid sitemap/metadata.

Browser regression checks must wait for client hydration before clicking or
dragging controls in server-rendered pages; visible HTML is not proof that
React event handlers are active.

**Why:** Production-preview tests clicked menus and WhatsApp controls while
the server-rendered elements were visible but before their handlers were
attached. The first action was lost; waiting for hydration resolved the
failures without modifying site behavior.

**How to apply:** Use the shared readiness-aware navigation helper for
interactive assertions. Do not hide the race with arbitrary delays, repeated
clicks, or weaker assertions.
