#!/usr/bin/env python3
"""Pull Alfred's Woodhouse feed into OpenJarvis memory.

Fetches GET <ALFRED_URL>/api/woodhouse (woodhouse/v3) and writes a plain-text
summary to ~/.openjarvis/knowledge/woodhouse-today.md, then re-indexes it so
Alfred (OpenJarvis) can answer "what's on my plate?" and the morning briefing
can read the ECS deadlines.

Env:
  ALFRED_URL                Base URL of the Alfred Netlify site (required)
  WOODHOUSE_REGISTRY_FILE   Optional JSON registry to send as X-Woodhouse-Registry

Standard library only; works with Python 3.10+.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

OUT_DIR = Path.home() / ".openjarvis" / "knowledge"
OUT_FILE = OUT_DIR / "woodhouse-today.md"


def fetch(base_url: str) -> dict:
    req = urllib.request.Request(
        base_url.rstrip("/") + "/api/woodhouse",
        headers={"Accept": "application/json", "User-Agent": "alfred-openjarvis"},
    )
    registry_file = os.environ.get("WOODHOUSE_REGISTRY_FILE", "").strip()
    if registry_file:
        registry = json.loads(Path(registry_file).expanduser().read_text())
        req.add_header("X-Woodhouse-Registry", json.dumps(registry))
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def render(snap: dict) -> str:
    lines = [
        "# Woodhouse status (ECS Network apps)",
        "",
        f"Synced: {datetime.now().strftime('%A %B %d, %Y %I:%M %p')}",
        f"Protocol: {snap.get('protocol', '?')}",
        "",
        "## Priority actions",
    ]
    actions = snap.get("priorityActions") or []
    lines += [f"- {a}" for a in actions] or ["- None"]

    lines += ["", "## Today's calendar from apps"]
    cal = snap.get("calendar") or []
    lines += [f"- {c.get('title')} ({c.get('kind')}) {c.get('detail') or ''}".rstrip() for c in cal] or ["- None"]

    lines += ["", "## Nodes"]
    for node in snap.get("nodes") or []:
        s = node.get("snapshot") or {}
        name = node.get("displayName") or node.get("registryId")
        if not node.get("ok") or not s:
            lines.append(f"### {name}: unavailable ({node.get('error') or 'no data'})")
            continue
        lines.append(f"### {name} [{s.get('status', 'ok')}]")
        lines.append(s.get("summary", ""))
        for m in s.get("metrics") or []:
            flag = " (!)" if m.get("alert") else ""
            lines.append(f"- {m.get('label')}: {m.get('value')}{flag}")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    base = os.environ.get("ALFRED_URL", "").strip()
    if not base:
        print("Set ALFRED_URL to your Alfred site, e.g. https://alfred.netlify.app", file=sys.stderr)
        return 2
    try:
        snap = fetch(base)
    except Exception as exc:  # network errors shouldn't break the scheduler
        print(f"Woodhouse fetch failed: {exc}", file=sys.stderr)
        return 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(render(snap))
    print(f"Wrote {OUT_FILE}")

    jarvis = shutil.which("jarvis")
    if jarvis:
        subprocess.run([jarvis, "memory", "index", str(OUT_FILE)], check=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
