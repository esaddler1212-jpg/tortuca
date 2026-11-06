# IRIS codebase review (DeepSeek and other external reviewers)

Use this document as the **single handoff** when you want an external model (e.g. DeepSeek) to review how **Iris** is implemented in this repo. Paste or attach this file plus the paths below; do not paste API keys or `.env` contents into chat.

## What Iris is here

- **Iris** is the voice/text chief of staff for **Alfred** (PWA at repo root). The UI is React + Vite in `src/`. Server logic for Iris lives in **Netlify Functions** under `netlify/functions/`.
- **Primary entry:** `POST /api/ask` — authenticated, rate-limited, forwards to Claude via `runIris` in `netlify/functions/_iris.ts`.
- **Supporting APIs:** business research (`business-research.ts`, `_businessResearch.ts`), memory (`iris-memory.ts`), usage (`iris-usage.ts`, `_irisUsage.ts`), specialists/delegates (`_irisSpecialists.ts`).

## Authoritative policy (read first)

- `AGENTS.md` — guardrails: auth, cost caps, context truncation, memory `safeFact`, delegate deduping, refusal handling, privacy (no student PII in context), secrets.
- **`shared/agentGuardrails.ts`** — numeric limits and helpers (single source of truth for caps).

## Files to prioritize for a security + correctness review

| Area | Paths |
|------|--------|
| Ask handler | `netlify/functions/ask.ts` |
| Iris core (tools, prompts, Claude loop) | `netlify/functions/_iris.ts` |
| Specialists / delegates / Scout | `netlify/functions/_irisSpecialists.ts` |
| Usage / limits | `netlify/functions/_irisUsage.ts`, `netlify/functions/iris-usage.ts` |
| Memory | `netlify/functions/iris-memory.ts` (+ `safeFact` usage via guardrails) |
| Business research | `netlify/functions/business-research.ts`, `netlify/functions/_businessResearch.ts` |
| Session / shared helpers | `netlify/functions/_shared.ts`, `netlify/functions/session.ts` |
| Team / activity | `shared/irisTeam.ts`, `shared/irisTeamActivity.ts` |
| Ask context (what the client sends) | `src/lib/askContext.ts`, `shared/irisContext.ts` |
| Client → `/api/ask` | search for `/api/ask` and `authHeaders` under `src/` |

## Automated checks already in the repo

- `npm run test:os` — full gate: `build` + time + iris + research + HUD audit + guardrails + thin programming auditor + weekly auditor.
- `npm run test:guardrails` — limits + `safeFact` wiring.
- `npm run test:thin` — static checks for missing session gates, unsafe `JSON.parse`, client calls without `authHeaders`, etc.
- `npm run test:iris` — Iris brain contract tests against a mock Anthropic API (`scripts/check-iris.mts`).

## Review prompt (copy for DeepSeek)

```
You are reviewing the Iris AI stack in a TypeScript monorepo (React client + Netlify Functions).
Read docs/DEEPSEEK_IRIS_CODE_REVIEW.md and AGENTS.md, then the files listed in the "Files to prioritize" table.

Goal: find security defects, auth bypasses, injection risks, data leaks (especially PII), and logic bugs in limits/tool handling.

Constraints from the product:
- /api/ask and /api/business-research require a valid Google session.
- Limits and truncation must align with shared/agentGuardrails.ts.
- Memory must use safeFact; no credentials or long digit strings stored.
- Spoken replies must not leak raw URLs or markdown when that is stripped in _iris / ask path.
- No secrets in client bundles (scan client files for process.env misuse).

Output format:
1) Executive summary (max 8 bullets)
2) Critical / High / Medium / Low findings with file:line references where possible
3) False positives you considered
4) Suggested tests or npm scripts to add
Do not request or assume real API keys.
```

## After the review

- If DeepSeek suggests new invariants, add them to `shared/thinProgrammingPolicy.ts` or `scripts/check-agent-guardrails.mts` and run `npm run test:os`.
