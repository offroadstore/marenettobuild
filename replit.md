# Marenetto Build

Multilingual website and portal for Marenetto Build, helping owners understand services and send structured project enquiries in Cefalù.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/marenetto-build run dev` — run the public website
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/marenetto-build` — public website, 29 language routes, request form
- `artifacts/api-server` — shared API, including request persistence
- `lib/api-spec/openapi.yaml` — API source of truth
- `lib/db/src/schema/project-requests.ts` — project request persistence

## Architecture decisions

- The preview is deliberately `noindex`; change the HTML robots tag and `public/robots.txt` only at an approved production release.
- Italian remains at root and translated routes use stable language prefixes.
- The request form persists enquiries before returning a reference. Persistent notifications and an Aruba SMTP delivery path are implemented; actual delivery and recovery after interruption require an authorized controlled test, not an assumption from configuration flags.
- Configure `INTERNAL_INVITES` as comma-separated `verified-email:owner|editor|viewer` entries before staff can enter `/internal`. Staff must also register/sign in through Clerk with that verified primary email. The allowlist creates membership on authenticated access, not a Clerk login account, and does not send email. Uninvited or unverified accounts remain denied.
- Private attachments use App Storage and remain inaccessible until the same approvals are complete. Do not move private documents to public object paths.
- The legacy catalogs retain their historical approval record. This is not approval of newer page compositions or article translations. The page-by-language edition inventory governs current eligibility, equivalents and sitemap; all 29 languages remain in review scope. Draft corrections are AI-generated and require owner review.
- Public HTML retains its generated immutable fallback; editorial revisions use the same active database snapshot for runtime SSR and client rendering. Build both web and API bundles with their existing scripts; article edits do not require new builds. The Node delivery handler distinguishes 200/308/404/410; do not restore the universal home fallback. Preview remains noindex in headers and HTML, with robots disallow; production indexing has not been enabled.
- The owner confirmed the visible email `info@marenetto.com` on 10 November 2026. This confirms the contact to display, not SMTP delivery, legal identity or address verification.
## Product

- Responsive 29-language public site with equivalent-page language switching
- Service, working method, owners-abroad, contact, and guided request pages
- Persistent project request submission with review and idempotent reference code
- Invite-only internal lead/CMS management, permission checks, persistent notifications, and private App Storage attachments
- Internal Articoli/Lingue management: persistent revisions, immutable catalog evidence, owner-only approval/activation, and a 29-language comparison matrix. See `docs/editorial/MIGRAZIONE.md` and the Italian guide `docs/editorial/GUIDA.html`.
- A clearly labeled owner-portal demonstration at `/owner-demo` using fictional sample records only
- Internal Dashboard/Monitoraggio: role-protected Google read-only OAuth and property selection, separate Google/operational KPI sources, encrypted server tokens and environment-isolated settings. Setup and Italian operating guide: `docs/monitoring/GUIDA.html`. Public GA4 ID supplied by the owner is an initial configuration only, not report access or consent to install tracking. Tracking installation remains unavailable; no public page loads tags.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
