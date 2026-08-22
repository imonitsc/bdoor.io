#!/usr/bin/env bash
# Rebuild a throwaway local database from the shim plus every production
# migration, in order. Used by `pnpm test:integration` and for SQL validation.
#
#   scripts/local-db/apply.sh [--seed]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PGHOST="${PGHOST:-/tmp}"
PGPORT="${PGPORT:-55432}"
PGUSER="${PGUSER:-postgres}"
DB="${PGDATABASE:-bdoor_test}"
export PGHOST PGPORT PGUSER

psql -q -d postgres -v ON_ERROR_STOP=1 -c "drop database if exists \"$DB\";" >/dev/null
psql -q -d postgres -v ON_ERROR_STOP=1 -c "create database \"$DB\";" >/dev/null

psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$ROOT/scripts/local-db/supabase-shim.sql" >/dev/null

for f in "$ROOT"/supabase/migrations/*.sql; do
  if ! psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$f" >/dev/null; then
    echo "FAILED: $(basename "$f")" >&2
    exit 1
  fi
done

if [[ "${1:-}" == "--seed" ]]; then
  psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$ROOT/supabase/seed.sql" >/dev/null
fi

echo "applied: $DB"
