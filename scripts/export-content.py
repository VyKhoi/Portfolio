#!/usr/bin/env python3
"""Write the site's content files from the running API, so the static pages show what is in the database.

    python3 scripts/export-content.py [--base http://localhost:18122] [--out src/Web/frontend/src/content]

Writes portfolio.json (profile, experiences, skills, now) and projects.json in the shape the frontend reads.
Exit code 1 and nothing written when the API is down or answers in an unexpected shape (an older backend,
an empty database): the build then keeps the files from the repo.
"""
import argparse
import json
import sys
import urllib.request
from pathlib import Path


def fetch(base: str, path: str):
    with urllib.request.urlopen(f"{base}/api/content/{path}", timeout=15) as res:
        return json.load(res)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:18122")
    parser.add_argument("--out", default="src/Web/frontend/src/content")
    args = parser.parse_args()

    try:
        profile = fetch(args.base, "profile")
        experiences = fetch(args.base, "experiences")
        skills = fetch(args.base, "skills")
        now = fetch(args.base, "now")
        projects = fetch(args.base, "projects")
    except Exception as exc:  # noqa: BLE001 - any failure means "keep the repo files"
        print(f"Content API not reachable ({exc}); keeping the files from the repo.", file=sys.stderr)
        return 1

    problems = []
    if not profile.get("fullName"):
        problems.append("profile has no name")
    if not experiences:
        problems.append("no experiences")
    if not skills:
        problems.append("no skills")
    if not now.get("items"):
        problems.append("no Now items")
    if not projects or not all("slug" in p and "copy" in p for p in projects):
        problems.append("projects are missing or in the old format")
    if problems:
        print("Content API answered in an unexpected shape: " + ", ".join(problems) + "; keeping the files from the repo.",
              file=sys.stderr)
        return 1

    out = Path(args.out)
    portfolio = {"profile": profile, "experiences": experiences, "skills": skills, "now": now}
    (out / "portfolio.json").write_text(json.dumps(portfolio, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (out / "projects.json").write_text(json.dumps(projects, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Exported {len(experiences)} experiences, {len(skills)} skills, {len(now['items'])} Now items, "
          f"{len(projects)} projects from {args.base}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
