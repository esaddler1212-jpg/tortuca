"""Install Alfred's always-on macOS jobs (launchd):

- com.ecs.alfred.briefing   runs `jarvis digest --fresh` at 6:15 AM on weekdays
                            and 8:15 AM on weekends (matches the 8 AM weekend wake)
- com.ecs.alfred.scheduler  keeps `jarvis scheduler start` running (weekly agents)
- com.ecs.alfred.cos-*      ECS Chief of Staff (only if COS_AGENT_TOKEN is in ~/.zshrc):
                            snapshot pull 6:05 AM daily (before the briefing),
                            kickoff memo Mon 6:30 AM, follow-up sweep Tue-Thu 5:30 PM,
                            close memo Fri 4:30 PM

launchd jobs don't read ~/.zshrc, so each job starts zsh, loads ~/.zshrc (for
ANTHROPIC_API_KEY etc.), then runs jarvis. No keys are written into the jobs.
Logs: /tmp/com.ecs.alfred.*.log. Safe to re-run.
"""

from __future__ import annotations

import plistlib
import shutil
import subprocess
import sys
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


# Run the CoS agent with this same Python (OpenJarvis's venv has `anthropic`).
COS = f'"{sys.executable}" -I "$HOME/.openjarvis/cos_agent.py"'
# Only run when the token is configured, so a half-finished setup stays quiet.
_cos = lambda cmd: _shell(f'[ -n "$COS_AGENT_TOKEN" ] || exit 0; exec {COS} {cmd}')

JOBS.update({
    "com.ecs.alfred.cos-pull": {
        "ProgramArguments": _cos("pull"),
        "StartCalendarInterval": [
            *({"Weekday": d, "Hour": 6, "Minute": 5} for d in range(1, 6)),
            {"Weekday": 6, "Hour": 8, "Minute": 5},
            {"Weekday": 0, "Hour": 8, "Minute": 5},
        ],
    },
    "com.ecs.alfred.cos-kickoff": {
        "ProgramArguments": _cos("kickoff"),
        "StartCalendarInterval": [{"Weekday": 1, "Hour": 6, "Minute": 30}],
    },
    "com.ecs.alfred.cos-sweep": {
        "ProgramArguments": _cos("sweep"),
        "StartCalendarInterval": [{"Weekday": d, "Hour": 17, "Minute": 30} for d in (2, 3, 4)],
    },
    "com.ecs.alfred.cos-close": {
        "ProgramArguments": _cos("close"),
        "StartCalendarInterval": [{"Weekday": 5, "Hour": 16, "Minute": 30}],
    },
})


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
