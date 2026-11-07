#!/usr/bin/env bash
# Runs every database/updates/*.sql that has not run yet, in file-name order, one transaction each.
# Applied files are recorded in applied_scripts, so a deploy never repeats them and never
# overwrites what was edited in the admin console. To change data again, add a new numbered file.
set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-portfolio_postgres}"
BACKEND="${BACKEND_CONTAINER:-portfolio_backend}"
FRONTEND="${FRONTEND_CONTAINER:-portfolio_frontend}"
cd "$(dirname "$0")/.."

db() { docker exec -i "$CONTAINER" psql -U postgres -d portfolio_db -v ON_ERROR_STOP=1 -q "$@"; }

db -c 'CREATE TABLE IF NOT EXISTS applied_scripts (
  name text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);'

applied=0
for file in database/updates/*.sql; do
  [ -e "$file" ] || continue
  name="$(basename "$file")"
  checksum="$(tr -d '\r' < "$file" | sha256sum | cut -d' ' -f1)"
  known="$(db -At -c "SELECT checksum FROM applied_scripts WHERE name = '$name'")"

  if [ "$known" = "$checksum" ]; then
    continue
  fi
  if [ -n "$known" ]; then
    echo "$name was changed after it ran. Add a new numbered file instead." >&2
    exit 1
  fi

  echo "Applying $name"
  {
    echo 'BEGIN;'
    cat "$file"
    echo
    echo "INSERT INTO applied_scripts (name, checksum) VALUES ('$name', '$checksum');"
    echo 'COMMIT;'
  } | db
  applied=$((applied + 1))
done

echo "Applied $applied new script(s)"

# Content is cached in the backend for 30 minutes
if [ "$applied" -gt 0 ]; then
  docker restart "$BACKEND" > /dev/null
  # nginx resolved the backend address at startup; make sure it follows the restarted container
  docker exec "$FRONTEND" nginx -s reload
fi
