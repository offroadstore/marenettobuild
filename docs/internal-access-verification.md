# Internal access verification

Verified on 2026-11-09 in the development preview using programmatically authenticated Clerk test users and synthetic records. No production deployment or production-data changes were performed.

## Defect corrected

The connected development database had only the original enquiry table, without the membership, CMS, notification or attachment schema. Anonymous checks and typechecks did not detect this.

Applied the existing app-owned Drizzle schema with `pnpm --filter @workspace/db run push` (additive changes, no records deleted). Added the read-only `pnpm --filter @workspace/db run check:internal-schema` readiness check to post-merge setup.

## Integration with the main project

The incoming main project already contains production approval flags and shared invitation/mail settings. This task preserves those settings unchanged; it does **not** introduce or enable them. Comparing the parsed `userenv` sections of incoming main and this branch confirmed equality, including the production subsection. The task's `.replit` difference against incoming main adds validation workflows only.

After rebasing, the new main-project Playwright and mailer dependencies needed installation. Reinstalled the existing frozen lockfile; no dependency versions were changed. The initial post-rebase command failures were missing executables/modules, not failed authorization assertions.

## Authenticated results

| Check | Owner | Editor | Viewer |
| --- | --- | --- | --- |
| Session, lead/CMS reads | 200 | 200 | 200 |
| Update test lead | Allowed, persisted | Allowed, persisted | 403, unchanged |
| Create/edit test CMS draft | Allowed | Allowed | 403 |
| Team/member access | Allowed | 403 | 403 |
| Private-file list/upload/download | Allowed | Allowed | 403 |
| Team / Files navigation | Both visible | Files only | Neither |

The test CMS page was edited, published (public lookup 200), then returned to draft (public lookup 404). The viewer could read the draft through the internal API but could not modify it.

The owner revoked the generated editor and viewer through the member API. Their existing signed-in sessions then received 403 for session, lead/CMS reads and writes, attachment list/upload/finalize, and download of the known registered PDF. Rejected requests did not change the fixtures.

## Real private PDF flow

- Uploaded a 609-byte synthetic PDF using the actual owner file input and associated it only with the test enquiry.
- Owner and editor downloads returned identical content, SHA-256 `2b3e9a967ddcda859128843306a239d128f261158b107568f6a18558d27f9ac1`.
- Headers: `Content-Type: application/pdf`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`.
- The same registered object returned 401 anonymously and 403 to viewer/revoked sessions.
- Unknown object: 404. Invalid attachment metadata and path: 400.

## Logout and restored development gates

The textual Sign out control was visible on desktop and at a 402px mobile viewport. Clicking it returned the owner to the public home page. The same browser context then received 401 for session and known-PDF download.

Before the controlled test window, privileged writes and upload requests were blocked by the approval guard; viewer requests were rejected by the role guard.

The three data-mode approval flags were enabled **only temporarily in the development API process for the authorized synthetic test**. After restoration, an authenticated test session again reported synthetic mode and upload-url returned 403. These test overrides do not constitute a production/privacy/vendor approval.

## Cleanup and verification

The uploaded private object was deleted and its absence verified. The exact generated attachment, CMS, enquiry and membership rows were removed; the original enquiry count was unchanged. Temporary files and browser contexts were removed. No email was sent and no SMTP settings were changed.

Additional passing checks:

- `pnpm --filter @workspace/api-server run test:permissions` — 6 tests.
- `pnpm run typecheck` — all workspace projects.
- `pnpm --filter @workspace/db run check:internal-schema`.
- `bash -n scripts/post-merge.sh` and `git diff --check`.

No authorization bypass was observed in the tested flows. The mobile navigation uses a horizontal scroll row; some labels are outside the initial viewport, while logout remains visible.
