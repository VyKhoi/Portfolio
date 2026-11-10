#!/usr/bin/env bash
# Rebuild the frontend when the database holds content the live static pages do not show yet.
# Runs on the home server from the repo root: at the end of every deploy, and every 30 minutes (publish.yml).
#
#   bash scripts/publish-content.sh            # rebuild only if something changed
#   FORCE=1 bash scripts/publish-content.sh    # rebuild anyway
set -euo pipefail

SITE=${SITE:-http://localhost:18122}

if ! python3 scripts/export-content.py --base "$SITE"; then
  echo "Nothing to publish: could not read the content API."
  exit 0
fi

# Compare what the API returns now with what the running build was made from
if [ "${FORCE:-0}" != 1 ] && python3 - "$SITE" <<'PY'
import json, sys, urllib.request
from pathlib import Path

site = sys.argv[1]
try:
    with urllib.request.urlopen(f"{site}/content-snapshot.json", timeout=15) as res:
        live = json.load(res)["content"]
except Exception:
    sys.exit(1)  # no snapshot yet (first build): publish

content = Path("src/Web/frontend/src/content")
fresh = json.loads((content / "portfolio.json").read_text(encoding="utf-8"))
fresh["projects"] = json.loads((content / "projects.json").read_text(encoding="utf-8"))
sys.exit(0 if fresh == live else 1)
PY
then
  echo "Static pages already show the latest content."
  git checkout -- src/Web/frontend/src/content
  exit 0
fi

echo "Content changed: rebuilding the frontend."
docker compose build frontend
docker compose up -d --no-deps frontend
git checkout -- src/Web/frontend/src/content

for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "$SITE/" && curl -fsS -o /dev/null "$SITE/content-snapshot.json"; then
    echo "Published."
    exit 0
  fi
  sleep 2
done
echo "Frontend did not come back after publishing"; docker compose logs --tail 40 frontend; exit 1
