# Agent guardrails (IRIS / Tortuca)

This repo runs **Iris** (voice chief of staff), **eleven module specialists** (`consult_specialist`), and **Scout / Business Researcher** on Netlify Functions. Treat these rules as non-negotiable when changing AI behavior or adding tools.

## Runtime policy (enforced in code)

| Area | Rule | Where |
|------|------|--------|
| Auth | `/api/ask` and `/api/business-research` require a valid Google session | `netlify/functions/ask.ts`, `business-research.ts` |
| Cost caps | Ask turns per account per day; research runs per day | `shared/agentGuardrails.ts` |
| Context size | Truncate ask history, Iris “Right now”, research context | `normalizeAskTurns`, `clampIrisContext` |
| Memory | `safeFact()` blocks credentials and long digit sequences; max fact count | `shared/agentGuardrails.ts`, `ask.ts` |
| Delegates | Duplicate / overlapping specialist work blocked | `shared/irisTeamActivity.ts` |
| Scout | Min query length + daily research limit before `runBusinessResearch` | `_irisSpecialists.ts` |
| Refusal | Model `stop_reason === "refusal"` → safe spoken decline | `_iris.ts`, `_businessResearch.ts` |
| Privacy | No student names in Iris context (Family Purpose); inbox subjects only | ask context builders, persona |
| Secrets | API keys only in Netlify env; run `npm run scan:secrets` before release (install [gitleaks](https://github.com/gitleaks/gitleaks) for a real scan; otherwise the script skips with a message) | `.gitleaks.toml`, `scripts/scan-secrets.mts` |

**Single source of truth for numeric limits:** `shared/agentGuardrails.ts`. Do not duplicate caps in handlers without importing from there.

## Adding a new agent capability

1. **Prefer server tools** with strict JSON schemas (`strict: true`, `additionalProperties: false`).
2. **Validate all tool inputs** in TypeScript before side effects (network, blobs, drafts, email).
3. **Add rate or daily limits** if the tool calls an external API or runs a sub-agent loop.
4. **Log usage** via `_irisUsage` / research usage stores where applicable.
5. **Extend** `scripts/check-agent-guardrails.mts` and run `npm run test:os`.

## External code reviews (e.g. DeepSeek)

- Hand off **Iris** server and policy context with `docs/DEEPSEEK_IRIS_CODE_REVIEW.md` (paths, constraints, copy-paste review prompt). Do not paste secrets or `.env` values into external chats.

## Cursor / Cloud agents working on this repo

- **City Nights browser research:** [`docs/CITY_NIGHTS_CRAFT_ANYTHING.md`](docs/CITY_NIGHTS_CRAFT_ANYTHING.md). Install `bash tools/craft-anything/install.sh --cursor`, use MCP toolset `craft-anything` (enable `browser` / `javascript`). Write outcomes to `drive-world/research/findings/*.md` — do not commit Craft `capture/` blobs.
- Minimize scope; match existing patterns in `netlify/functions/` and `shared/`.
- Never commit `.env`, tokens, or real student/parent PII in fixtures.
- Do not weaken `safeFact`, duplicate-delegate checks, or session gates without explicit product approval.
- Do not embed third-party agent marketplaces (Voicebox, n8n flows, etc.) into the PWA unless requested — optional docs/links only.
- Before opening a PR: `npm run test:os` (build, time, iris, research, HUD audit, cross-device audit, guardrails audit).
- **PlayCanvas asset index:** curated from [Kavex/GameDev-Resources](https://github.com/Kavex/GameDev-Resources) in `gamedev-resources/` + [`docs/GAMEDEV_RESOURCES.md`](docs/GAMEDEV_RESOURCES.md). Optional CC0 installs: `bash tools/gamedev-resources/install-free-packs.sh`.

## Testing

```bash
npm run test:guardrails   # limits + safeFact + wiring checks
npm run test:thin         # thin programming auditor (auth, parsing, client API wiring)
npm run test:os           # full gate including guardrails + thin auditor
```

## Thin programming auditor

`npm run test:thin` is the **static agent** that hunts implementation holes before they ship:

- Private Netlify handlers missing session checks or safe `JSON.parse` on bodies
- Live `/api/stocks` (Finnhub) callable without a signed-in session
- Client `/api/*` calls that omit `authHeaders()`
- Missing scheduled functions, `.env` in gitignore, secrets referenced from client code
- Dangerous DOM patterns in the app shell

Policy lists live in `shared/thinProgrammingPolicy.ts` — update when you add routes.

## Weekly auditor (Sunday → Monday overnight)

Two layers keep IRIS fully functional:

| Layer | When | What |
|-------|------|------|
| **Netlify** `weekly-audit-scheduled` | Monday **08:00 UTC** (midnight **Pacific**, PST) | Production smoke (env, Blobs, accounts), efficiency suggestions, optional email to `WEEKLY_AUDIT_EMAIL` |
| **GitHub** `.github/workflows/weekly-audit.yml` | Monday **08:45 UTC** (~12:45 AM Pacific) | Full `npm run test:os` |

Optional: set GitHub secrets `WEEKLY_AUDIT_INGEST_URL` (your site `/api/weekly-audit-ingest`) and `WEEKLY_AUDIT_SECRET` (matches Netlify `WEEKLY_AUDIT_SECRET`) so CI results appear in the Team module.

Latest report: **Team → Weekly auditor** card, or `GET /api/weekly-audit` when signed in.
