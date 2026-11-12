---
name: Isolated pnpm test bundles
description: Avoid misleading missing peer-dependency errors in esbuild virtual test modules.
---

For isolated esbuild test replacements, resolve runtime dependencies with a resolver rooted at the package that declares them. Do not construct imports through workspace node_modules symlinks.

**Why:** A virtual test replacement importing PostgreSQL through its workspace symlink resolved the entry but lost the package's transitive dependencies during bundling; this looked like missing packages even though installation was healthy.

**How to apply:** Use Node's package resolver from the owning package when constructing virtual-module imports, and leave application dependency declarations intact. Test-only authentication replacements must remain isolated from application builds.
