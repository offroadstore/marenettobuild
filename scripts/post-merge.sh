#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @workspace/db --fail-if-no-match run push
pnpm --filter @workspace/db --fail-if-no-match run check:internal-schema
