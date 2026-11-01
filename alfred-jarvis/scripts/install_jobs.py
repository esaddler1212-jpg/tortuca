"""Install Alfred's always-on macOS jobs (launchd):

- com.ecs.alfred.briefing   runs `jarvis digest --fresh` at 6:15 AM on weekdays
                            and 8:15 AM on weekends (matches the 8 AM weekend wake)
- com.ecs.alfred.scheduler  keeps `jarvis scheduler start` running (weekly agents)

launchd jobs don't read ~/.zshrc, so each job starts zsh, loads ~/.zshrc (for
ANTHROPIC_API_KEY etc.), then runs jarvis. No keys are written into the jobs.
Logs: /tmp/com.ecs.alfred.*.log. Safe to re-run.
"""

from __future__ import annotations

import plistlib
import shutil
import subprocess
from pathlib import Path

LA = Path.home() / "Library" / "LaunchAgents"


def _shell(cmd: str) -> list[str]:
    return [
        "/bin/zsh",
        "-c",
        f'source "$HOME/.zshrc" >/dev/null 2>&1; export PATH="$HOME/.local/bin:$PATH"; {cmd}',
    ]


JOBS = {
    "com.ecs.alfred.briefing": {
        "ProgramArguments": _shell("exec jarvis digest --fresh"),
        # launchd Weekday: 0/7 = Sunday, 1 = Monday ... 6 = Saturday
        "StartCalendarInterval": [
            *({"Weekday": d, "Hour": 6, "Minute": 15} for d in range(1, 6)),
            {"Weekday": 6, "Hour": 8, "Minute": 15},
            {"Weekday": 0, "Hour": 8, "Minute": 15},
        ],
    },
    "com.ecs.alfred.scheduler": {
        "ProgramArguments": _shell("exec jarvis scheduler start"),
        "RunAtLoad": True,
        "KeepAlive": True,
        "ThrottleInterval": 60,
    },
}


def main() -> None:
    LA.mkdir(parents=True, exist_ok=True)
    launchctl = shutil.which("launchctl")
    for label, spec in JOBS.items():
        path = LA / f"{label}.plist"
        plist = {
            "Label": label,
            **spec,
            "StandardOutPath": f"/tmp/{label}.log",
            "StandardErrorPath": f"/tmp/{label}.log",
        }
        with path.open("wb") as f:
            plistlib.dump(plist, f)
        if launchctl:
            subprocess.run([launchctl, "unload", str(path)], capture_output=True)
            subprocess.run([launchctl, "load", str(path)], check=False)
        print(f"    installed {label}")


if __name__ == "__main__":
    main()
