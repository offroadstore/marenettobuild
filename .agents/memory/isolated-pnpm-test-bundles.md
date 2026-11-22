---
name: Isolated pnpm test bundles
description: Avoid misleading missing peer-dependency errors in esbuild virtual test modules.
---

For isolated esbuild test replacements, resolve runtime dependencies with a resolver rooted at the package that declares them. Do not construct imports through workspace node_modules symlinks.

**Why:** A virtual test replacement importing PostgreSQL through its workspace symlink resolved the entry but lost the package's transitive dependencies during bundling; this looked like missing packages even though installation was healthy.

**How to apply:** Use Node's package resolver from the owning package when constructing virtual-module imports, and leave application dependency declarations intact. Test-only authentication replacements must remain isolated from application builds.

Browser component fixtures bundled outside Vite should receive their route/content inventory as plain data rather than importing the full content catalog.

**Why:** Transitive catalog imports can require both Vite environment replacement and glob expansion before a component mounts. Fixing only environment constants leaves another unrelated bootstrap failure, obscuring the behavior under test.

**How to apply:** Keep the real application as the inventory owner; inject a minimal inventory into the same production component for isolated consent/browser tests. Do not add a runtime preview bypass to make tests collect analytics.

Use consistent JSON import attributes between a fixture and the module it
configures when bundling isolated tests.

**Why:** esbuild can treat imports of the same JSON path with and without
attributes as separate module instances. A fixture may mutate one policy
object while the tested code continues using another, producing misleading
consent failures.

**How to apply:** Prefer explicit test dependency injection; when sharing a
test configuration module, keep its import identity consistent and verify
that production defaults remain unchanged.
