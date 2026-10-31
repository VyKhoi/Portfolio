#!/usr/bin/env bash
# Server-managed secrets for the Portfolio deploy (run by the self-hosted runner).
#
#   scripts/server-secrets.sh ensure        create missing secrets in $SECRETS_DIR (never overwrites)
#   scripts/server-secrets.sh sync-db       set the Postgres user's password to the stored value
#
# Values are generated on the server and never leave it: they are not GitHub secrets and are never
# printed. To rotate one, delete its file and deploy again.
set -euo pipefail

SECRETS_DIR="${PORTFOLIO_SECRETS_DIR:-$HOME/.config/portfolio}"
PG_CONTAINER="${PG_CONTAINER:-portfolio_postgres}"

generate() { # <file> <bytes>
  local file="$SECRETS_DIR/$1"
  if [ ! -s "$file" ]; then
    (umask 077 && openssl rand -hex "$2" > "$file")
    echo "Generated new secret: $1"
  fi
}

case "${1:-}" in
  ensure)
    mkdir -p "$SECRETS_DIR"
    chmod 700 "$SECRETS_DIR"
    generate postgres_password 24
    generate jwt_secret 48
    ;;
  sync-db)
    # The official image trusts local socket connections inside the container, so this works whatever
    # the current password is. The value goes through stdin, never through command-line arguments.
    printf "ALTER USER postgres WITH PASSWORD '%s';\n" "$(cat "$SECRETS_DIR/postgres_password")" \
      | docker exec -i "$PG_CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -q
    echo "Postgres password synced."
    ;;
  *)
    echo "usage: $0 ensure|sync-db" >&2
    exit 2
    ;;
esac
