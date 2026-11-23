#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @workspace/db --fail-if-no-match run push
pnpm --filter @workspace/db --fail-if-no-match run check:internal-schema
node lib/db/scripts/migrate-editorial.mjs
node lib/db/scripts/migrate-monitoring.mjs
node lib/db/scripts/migrate-call-requests.mjs
