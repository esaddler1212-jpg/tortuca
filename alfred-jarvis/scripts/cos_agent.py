#!/usr/bin/env python3
"""ECS Chief of Staff agent (runs on the iMac).

Reads the Chief of Staff snapshot from Alfred (GET /api/cos), writes the
weekly memos with Claude, saves them into Alfred's knowledge folder (so chat
and the morning briefing can use them) and posts them to the Chief of Staff
inbox in the Alfred app (POST /api/cos), which also pings E's phone.

  cos_agent.py pull        save the snapshot to ~/.openjarvis/knowledge/ecs/chief-of-staff.md
  cos_agent.py kickoff     Monday memo: top 3, what E owes, who to nudge, what to drop
  cos_agent.py sweep       weekday follow-ups: drafts nudges (skips quietly if nothing is due)
  cos_agent.py close       Friday memo: what moved, win / lesson, next week's top 3
  cos_agent.py post TITLE  post stdin as a memo (for your own scripts)

Env (put these in ~/.zshrc; install_jobs.py loads it):
  ALFRED_URL        e.g. https://alfred2.netlify.app
  COS_AGENT_TOKEN   same value as COS_AGENT_TOKEN on Netlify
  ANTHROPIC_API_KEY Claude key (already set for OpenJarvis)
  COS_MODEL         optional; default claude-opus-5-5

Run with OpenJarvis's Python (it already has the anthropic package):
  ~/.openjarvis/.venv/bin/python cos_agent.py kickoff
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

OJ = Path(os.environ.get("OPENJARVIS_HOME", Path.home() / ".openjarvis"))
KNOWLEDGE = OJ / "knowledge"
SNAPSHOT_FILE = KNOWLEDGE / "ecs" / "chief-of-staff.md"
MEMO_DIR = KNOWLEDGE / "ecs" / "memos"
MODEL = os.environ.get("COS_MODEL", "claude-opus-5-5")

SYSTEM = """You are E's chief of staff for ECS Network. E (Eric Saddler II) is the founder; home base Vallejo, CA.
ECS runs four divisions under Vantage, its operating company:
- Tortuga Productions: film and media. 2027 flagship is $BAY, a 7-city POV doc series (shoots Saturdays Mar 6 - May 1, weekly YouTube drops Jun 12 - Jul 31, July 3 Oakland pop-up), then the Recluse Without a Cause short in August.
- Easy Supply Co.: merch ($80 sweat suits, $BAY city editions, Sample Sale drops).
- North Star Network: nonprofit afterschool program; 2027-28 pilot in Mt. Diablo Unified.
- 2EASY: E's music (Trilogy Deluxe, Sample Sales).
Near-term target: $100K/month across ECS, climbing a revenue ladder. E works days as an SEL counselor, so ECS time is evenings and weekends: plan for about 10 focused hours a week.

How you work:
- Lead with the one thing that matters most. Short sections, plain language, confident, community-first. No corporate filler.
- Only use facts from the snapshot and notes you are given. If something is unknown, say so or mark it [check]. Never invent people, numbers, dates or commitments.
- Priorities are finished outcomes ("Sponsor deck v1 sent to 3 credit unions"), not activities ("work on deck").
- Protect E's time: if the week is overloaded, say what to drop or delay.
- Write for a phone screen: plain text with simple dashes, no tables, under 350 words.
"""

TASKS = {
    "kickoff": (
        "Monday kickoff memo",
        "Write E's Monday kickoff memo from the snapshot.\n"
        "1. TOP 3 THIS WEEK: three outcomes that most move ECS, each one line. If E already set a top 3, "
        "react to it (keep, sharpen, or swap one, with a reason).\n"
        "2. YOU OWE: what E owes people this week, in the order to do it.\n"
        "3. NUDGE: who E is waiting on, with a one-line text E can send each.\n"
        "4. RED FLAGS: red or yellow divisions and the single move that fixes each.\n"
        "5. DROP OR DELAY: one thing, and why.",
    ),
    "sweep": (
        "Follow-ups to send",
        "Write E's follow-up sweep. For each overdue item E owes, give a one-line way to close it today or "
        "renegotiate the date. For each item marked [nudge], draft a 1-2 sentence friendly text to that person. "
        "End with the single most important follow-up.",
    ),
    "close": (
        "Friday close memo",
        "Write E's Friday close memo (motto: win or learn).\n"
        "- WHAT MOVED: by division, one line each (skip divisions with nothing).\n"
        "- WHAT SLIPPED: and the honest reason.\n"
        "- WIN: one to celebrate. LESSON: one to keep. Use E's own win/lesson if the snapshot has them.\n"
        "- NEXT WEEK: a draft top 3.\n"
        "- CARRY OVER: commitments still open that need a new date.",
    ),
}


def env(name: str, required: bool = True) -> str:
    v = os.environ.get(name, "").strip().strip('"').strip("'")
    if required and not v:
        sys.exit(f"Set {name} (see the top of cos_agent.py).")
    return v


def api(method: str, path: str, body: dict | None = None) -> bytes:
    url = env("ALFRED_URL").rstrip("/") + path
    req = urllib.request.Request(
        url,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "Authorization": f"Bearer {env('COS_AGENT_TOKEN')}",
            "Content-Type": "application/json",
            "User-Agent": "alfred-cos-agent",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:300]
        sys.exit(f"Alfred {method} {path} failed: {e.code} {detail}")


def index(path: Path) -> None:
    jarvis = shutil.which("jarvis") or str(Path.home() / ".local" / "bin" / "jarvis")
    if Path(jarvis).exists():
        subprocess.run([jarvis, "memory", "index", str(path)], check=False, capture_output=True)


def pull() -> str:
    md = api("GET", "/api/cos").decode()
    SNAPSHOT_FILE.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT_FILE.write_text(md)
    index(SNAPSHOT_FILE)
    print(f"Wrote {SNAPSHOT_FILE}")
    return md


def context_notes() -> str:
    """Woodhouse feed and Alfred's memory, if present (small files only)."""
    out = []
    for p in (KNOWLEDGE / "woodhouse-today.md", OJ / "personas" / "alfred" / "MEMORY.md"):
        if p.exists() and p.stat().st_size < 40_000:
            out.append(f"## {p.name}\n{p.read_text()}")
    return "\n\n".join(out)


def write_memo(kind: str, snapshot: str) -> str:
    import anthropic  # from OpenJarvis's virtualenv

    client = anthropic.Anthropic()
    _, ask = TASKS[kind]
    today = datetime.now().strftime("%A %B %d, %Y")
    user = f"Today is {today}.\n\n{ask}\n\n<snapshot>\n{snapshot}\n</snapshot>"
    notes = context_notes()
    if notes:
        user += f"\n\n<notes>\n{notes}\n</notes>"
    resp = client.beta.messages.create(
        model=MODEL,
        max_tokens=16000,
        system=SYSTEM,
        messages=[{"role": "user", "content": user}],
        output_config={"effort": "medium"},
        # If a safety classifier declines, retry on a fallback model in the same call.
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
    )
    if resp.stop_reason == "refusal":
        sys.exit("Claude declined to write this memo; nothing was posted.")
    text = "".join(b.text for b in resp.content if b.type == "text").strip()
    if not text:
        sys.exit("Claude returned an empty memo; nothing was posted.")
    return text


def post(title: str, body: str) -> None:
    res = json.loads(api("POST", "/api/cos", {"items": [{"kind": "memo", "title": title, "body": body}]}))
    print(f"Posted to Alfred: {', '.join(i['title'] for i in res.get('added', []))}")


def run(kind: str) -> None:
    snapshot = pull()
    if kind == "sweep":
        state = json.loads(api("GET", "/api/cos?format=json"))
        c = state.get("commitments", {})
        owed_late = [x for x in c.get("overdue", []) if x.get("direction") == "mine"]
        waiting = [x for b in c.values() for x in b if x.get("direction") == "theirs"]
        if not owed_late and not waiting:
            print("Nothing to follow up on; skipping.")
            return
    title, _ = TASKS[kind]
    memo = write_memo(kind, snapshot)
    MEMO_DIR.mkdir(parents=True, exist_ok=True)
    path = MEMO_DIR / f"{datetime.now():%Y-%m-%d}-{kind}.md"
    path.write_text(f"# {title} ({datetime.now():%A %B %d, %Y})\n\n{memo}\n")
    index(path)
    post(f"{title} · {datetime.now():%a %b %-d}", memo)


def main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else ""
    if cmd == "pull":
        pull()
    elif cmd in TASKS:
        run(cmd)
    elif cmd == "post" and len(argv) > 2:
        post(" ".join(argv[2:]), sys.stdin.read().strip())
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
