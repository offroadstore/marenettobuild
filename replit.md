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
- The request form persists enquiries before returning a reference; outbound notifications are not yet configured and are not simulated.
- Configure `INTERNAL_INVITES` as comma-separated `verified-email:owner|editor|viewer` entries before staff can enter `/internal`. With no configured owner, access remains closed; invitations do not send email.
- Private attachments use App Storage and remain inaccessible until the same approvals are complete. Do not move private documents to public object paths.
- All 29 requested languages have owner-approved page copy and SEO metadata. Keep the locale registry, translation catalogs, route equivalents and sitemap synchronized; never publish an unapproved catalog.
## Product

- Responsive 29-language public site with equivalent-page language switching
- Service, working method, owners-abroad, contact, and guided request pages
- Persistent project request submission with review and idempotent reference code
- Invite-only internal lead/CMS management, permission checks, persistent notifications, and private App Storage attachments
- A clearly labeled owner-portal demonstration at `/owner-demo` using fictional sample records only

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
