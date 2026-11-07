#!/usr/bin/env python3
"""Warns when the live API and the fallback file portfolio.json have drifted apart."""
import json
import sys
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:18122"


def api(path):
    with urllib.request.urlopen(f"{BASE}/api/content/{path}", timeout=10) as res:
        return json.load(res)


with open("src/Web/frontend/src/content/portfolio.json", encoding="utf-8") as f:
    local = json.load(f)

drift = []
profile = api("profile")
for key in ("title", "titleEn", "bio", "bioEn"):
    if profile.get(key) != local["profile"][key]:
        drift.append(f"profile.{key}")

live = sorted(api("experience"), key=lambda e: e["order"])
if len(live) != len(local["experiences"]):
    drift.append("experience count")
else:
    for row, expected in zip(live, local["experiences"]):
        for key in ("role", "company", "period", "periodEn", "projectName", "highlights", "highlightsEn"):
            if row.get(key) != expected[key]:
                drift.append(f"experience[{expected['order']}].{key}")

if drift:
    print("::warning::Live content differs from portfolio.json: " + ", ".join(drift))
else:
    print("Live content matches portfolio.json")
