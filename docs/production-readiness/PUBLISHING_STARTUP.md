# Publishing startup verification — 16 November 2026

## Finding and limits of the evidence

The failed publishing revision opened both configured service listeners.
Its startup log reported the deployment proxy mapped to port 1104, while the
web reader requested `http://localhost:80/api/editorial/active`. The homepage
then repeatedly returned 503, even while `/api/healthz` returned 200.
There were no editorial requests in that startup log.

This establishes a mismatch between the reader's fixed loopback proxy address
and the deployment routing. It does **not** establish a compilation failure or
an editorial database failure. The old reader swallowed the original exception,
so the exact transport exception from that failed revision cannot be recovered.
An API health response checks the process, not editorial database access.

The local real-socket regressions distinguish transport failure, timeout, HTTP
503, invalid JSON and invalid snapshot. They reproduce the readiness outcome
without replacing global fetch or matching the legacy URL.

## Correction

- `EDITORIAL_API_ORIGIN` is server-only configuration. Production explicitly
  targets the same deployment's API listener declared in the API artifact:
  `http://127.0.0.1:8080`.
- This intentionally uses the declared service address rather than guessing the
  deployment proxy's dynamically mapped port. If the API listener changes, its
  server-side origin must change with it; a regression checks that agreement.
- Development retains its shared proxy at `localhost:80`. Browser `/api`
  requests still use normal artifact routing. No browser API base URL changed.
- The public deployment domain is not used for readiness: before promotion,
  it could return the previous deployment's editorial state.
- The production web startup probe explicitly requests `/`, not an always-200
  endpoint. A healthy API process alone cannot pass this check.
- Production without a configured origin fails closed. Upstream failures retain
  the five-second timeout, 503, `Cache-Control: no-store`, `Retry-After: 30`,
  and noindex. There is no cached or static-content fallback on failure.
- Diagnostics contain only fixed failure categories and an optional HTTP
  status, at most once every 30 seconds per web process. They omit upstream
  URLs, response content, raw errors, headers, credentials and personal data.

Artifact configuration was accepted by the artifact schema validator.
No deployment target, authentication, content, translation approval, indexing
permission, or production data was changed.

## Local verification

- Full workspace `pnpm run typecheck`: passed.
- Production API bundle build: passed.
- `pnpm --filter @workspace/marenetto-build run test:seo`: passed (11 tests),
  including all-edition HTTP metadata, redirects, errors and deliberate holds.
- Real TCP production HTML tests: cold start with an empty verified snapshot,
  both through an internal API listener and a path-routing proxy; withdrawal,
  outage, web restart and recovery; upstream failure classification; bounded
  diagnostics; GET and HEAD unavailable responses.
- Both actual built production processes were cold-started on isolated test
  ports, behind a path-routing gateway, using **only the development database**.
  `/`, `/api/healthz`, and `/api/editorial/active` returned 200 with the expected
  content types. The homepage contained its H1 and verified empty snapshot.
- The managed development web workflow was restarted cleanly. Through the
  configured workspace proxy, `/`, `/api/healthz` and `/api/editorial/active`
  returned 200; editorial returned a JSON array rather than an HTML fallback.
  A screenshot confirmed the actual homepage, without a visual redesign.

The route-regression workflow result is recorded with task completion checks.
The SEO fixtures are synthetic and do not change live editorial revisions.

## Production verification still required

These are local validations, **not a successful publication**. No new publish
was initiated. After this change is merged, a user-initiated publish must still
confirm that the new revision passes its `/` startup check against its own API
and production editorial database. Any future failure can now be distinguished
as configuration, connection, timeout, upstream HTTP status or invalid response.
Do not replace the homepage probe with API liveness to bypass that failure.

## Extension on 26 November 2026: exact public-series readiness

The web startup path is now `/__release-readiness`. This is stricter than the
previous homepage-only check: it reads the same deployment's editorial API,
requires all 120 authorized series identities/paths to be indexable (including
the 24 pre-existing purchase/pool URLs), **and renders the real homepage using
that same verified snapshot**. API startup `/api/healthz` now initializes the
existing transactional importer and checks exact active revision/source hashes.
A missing edition, withdrawal, conflict or unavailable state returns 503.
Neither probe reads the old public deployment, and neither is an always-200
process-liveness substitute. See `INDEXING_RECOVERY_2026-11-26.md` for the
isolated PostgreSQL tests, raw public baseline and release verification.
