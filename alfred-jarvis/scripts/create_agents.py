"""Create Alfred's scheduled agents in E's time zone.

`jarvis scheduler create` has no time-zone option, so its cron times run in
UTC ("8 AM Monday" would fire at midnight in Vallejo). The scheduler does honor
a per-task ``metadata["timezone"]``, which this script sets.

Idempotent: tasks are tagged ``metadata["alfred_agent"]``; an existing tagged
task is updated in place (old UTC copies from earlier installs are cancelled).

Run with OpenJarvis's Python:  ~/.openjarvis/.venv/bin/python create_agents.py
"""

from __future__ import annotations

TZ = "America/Los_Angeles"

AGENTS = [
    {
        "key": "ecs-weekly-ops",
        "cron": "0 8 * * 1",  # Mondays 8:00 AM
        "tools": "knowledge_search,knowledge_sql,memory_store,memory_search,think",
        "prompt": (
            "ECS weekly ops review. Read woodhouse-today.md, the ECS docs, and your MEMORY notes. "
            "List this week's ECS Network deadlines, what is at risk, and the three moves that most "
            "advance the $BAY timeline and the $100K/month goal. Store the review as a dated memory note."
        ),
    },
    {
        "key": "career-scan",
        "cron": "0 9 * * 3",  # Wednesdays 9:00 AM
        "tools": "web_search,knowledge_search,memory_store,think",
        "prompt": (
            "Career scan. Find up to 5 open Program Manager roles (education, youth development, "
            "nonprofit, or media) within a 35-minute commute of Vallejo, CA that meet the salary floor "
            "in USER.md. For each, give the title, org, pay, link, and two lines on how E's experience "
            "fits. Store as a dated memory note."
        ),
    },
    {
        "key": "funding-scan",
        "cron": "0 9 1,15 * *",  # 1st and 15th, 9:00 AM
        "tools": "web_search,knowledge_search,memory_store,think",
        "prompt": (
            "Funding scan. Find open grants and local sponsors for $BAY (Bay Area city arts councils, "
            "community foundations, credit unions) and for North Star Network (ASES/ASSETS, youth "
            "media). List deadline, amount, fit, and link. Store as a dated memory note."
        ),
    },
]

# Prompt prefixes of the UTC tasks created by older versions of personalize.sh.
LEGACY_PREFIXES = ("ECS weekly ops review.", "Career scan.", "Funding scan.")


def main() -> None:
    from openjarvis.cli.scheduler_cmd import _get_scheduler, _get_store

    store = _get_store()
    sched = _get_scheduler(store)
    try:
        existing = sched.list_tasks()
        tagged = {t.metadata.get("alfred_agent"): t for t in existing if (t.metadata or {}).get("alfred_agent")}

        for t in existing:
            untagged = not (t.metadata or {}).get("alfred_agent")
            if untagged and t.prompt.startswith(LEGACY_PREFIXES) and t.status != "cancelled":
                sched.cancel_task(t.id)
                print(f"    cancelled old UTC task {t.id}")

        for a in AGENTS:
            old = tagged.get(a["key"])
            if old and old.status != "cancelled":
                sched.cancel_task(old.id)  # replace so prompt/schedule edits take effect
            task = sched.create_task(
                a["prompt"],
                "cron",
                a["cron"],
                agent="operative",
                tools=a["tools"],
                metadata={"timezone": TZ, "alfred_agent": a["key"]},
            )
            print(f"    {a['key']}: {a['cron']} ({TZ}) → next run {task.next_run}")
    finally:
        close = getattr(store, "close", None)
        if callable(close):
            close()


if __name__ == "__main__":
    main()
