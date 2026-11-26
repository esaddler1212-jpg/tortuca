# Deep dive: MAYA Sentinel (cherry-pick hygiene)

Upstream: [MAYA-Platform/MAYA-Sentinel](https://github.com/MAYA-Platform/MAYA-Sentinel) — **MIT**, local ZIP static scanner (Python 3.11–3.13). **Not** production uptime monitoring (see Hub → Watch + `watch-now` / Uptime Kuma in [`SERVER_PLAN.md`](./SERVER_PLAN.md)).

## What it is

**Question:** “Should I run or install this repo?”  
**Method:** User-supplied **ZIP only** — no `npm install`, no code execution, no network telemetry.

| Scan mode | Use when cherry-picking |
|-----------|-------------------------|
| `safety` (default) | First pass on any unknown tarball |
| `supply-chain` | Medusa, Sure Docker, n8n workflows — lockfiles + install hooks |
| `ai-surface` | MCP servers, agent skills, prompt-injection surfaces (Craft Anything, Iris plugins) |
| `phishing` | Lookalike domains / scam funnels in markdown or UI |
| `exfil` | Webhooks, tracking, phone-home strings |
| `archive` | Zip bombs, traversal, symlink tricks |

Verdicts are bounded: **No signal / Review / Risk / Blocked** — never “safe to run.”

## Fit for Tortuca / IRIS

| Layer | Tool | Role |
|-------|------|------|
| **This repo (committed)** | `gitleaks`, `npm run scan:secrets`, `test:thin` | Prevent secrets and auth holes in *our* code |
| **Before vendoring OSS** | **MAYA Sentinel** | Scan *their* ZIP on your Mac/VM **before** `npm ci` or Docker up |
| **Production watch** | Hub Watchers, `weekly-audit` | *Your* deployed URLs, not random GitHub zips |

Complements [`CHERRY_PICK_OPEN_SOURCE.md`](./CHERRY_PICK_OPEN_SOURCE.md): Sure, Medusa, Astryx, Craft agents, workshop clones.

### What Sentinel does **not** replace

- Legal review (AGPL Sure hosted separately)
- Full dependency audit (`npm audit`, OSV)
- Runtime behavior (only static/archive signals)

## Local workflow (recommended)

1. Clone upstream to `/tmp` or zip a release — **do not commit** the clone.
2. `bash tools/maya-sentinel/zip-repo-for-scan.sh /tmp/some-repo`
3. Run Sentinel UI or CLI on the ZIP (see [`tools/maya-sentinel/README.md`](../tools/maya-sentinel/README.md)).
4. If **Blocked** or **Risk** on `ai-surface` / `supply-chain`, stop — document findings in `docs/` before any Tortuca adapter.
5. If **Review**, proceed only with explicit human OK; no Netlify env for that project until reviewed.

## Iris / cloud agents

`shared/mayaSentinelIrisBridge.ts` adds ask context: agents must **not** run install scripts from repos the user has not scanned when the task is “plug in” or “clone” from GitHub.

Cloud agents on Cursor already run in isolated VMs; Sentinel is for **your machines** when you pull skills, MCP bundles, or Docker stacks locally.

## Optional CI (your fork of Sentinel)

Upstream ships `docs/ci/verify.yml.example`. Tortuca does **not** embed Sentinel in `test:os` (Python + ZIP uploads are manual). You may add a **personal** workflow on a Sentinel fork — keep receipts out of the Tortuca git repo unless redacted.

## Related

- [`DEEP_DIVE_SURE_ASTRYX.md`](./DEEP_DIVE_SURE_ASTRYX.md) — AGPL + MCP write risk  
- [`DEEP_DIVE_MEDUSA.md`](./DEEP_DIVE_MEDUSA.md) — commerce VPS install  
- `AGENTS.md` — cherry-pick + `scan:secrets` before release