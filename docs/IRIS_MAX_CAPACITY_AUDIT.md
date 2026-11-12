# IRIS max-capacity audit (UI + OS)

**Last run:** November 2026 (agent + `npm run test:os` on `main`)

## Executive summary

| Layer | Status | Evidence |
|-------|--------|----------|
| **Build + types** | Green | `npm run build` |
| **OS logic** | Green | `test:time` (school, pulse, gym, delegates, …) |
| **Iris API** | Green | `test:iris` (tools, memory, speech, specialists) |
| **HUD registry** | Green | `test:audit` (~90+ wiring checks) |
| **Cross-device** | Green | `test:devices` (PWA, 833px deck, safe areas) |
| **Security / thin** | Green | `test:guardrails`, `test:thin` (321 checks) |
| **Weekly ops** | Green | Team auditor + GitHub `test:os` cron |
| **Lint (Alfred root)** | Green | 0 errors (warnings only in subprojects) |

**Verdict:** IRIS is **ship-ready at full gate**. Remaining work is **product polish and research-backed optimizations**, not broken core paths.

## What “max capacity” means here

1. **Every HUD module** has a specialist, speech alias, and lazy chunk (or inline shell).
2. **Voice** — prime on tap, noise filter, Herald chunking, navigation fast path (no model for “open inbox”).
3. **Server** — session-gated APIs, `agentGuardrails` caps, duplicate delegate blocking, prompt cache on stable system blocks.
4. **Cross-device** — one PWA; iPad landscape command deck at `lg: 833px`.
5. **Ops** — push + wind-down cron, commute schedule, weekly auditor, PWA auto-reload on deploy.

## Manual QA (5 minutes)

Do once per release on **iPhone** and **Chromebook or iPad landscape**:

1. Home → tap core → speak → hear reply (or filler on slow ask).
2. **“Open plan”** → instant module switch (fast path).
3. Today / Vitals / Inbox / Plan tabs + **More** → Team, Woodhouse, Research load without blank shell.
4. Settings → Iris usage loads; refresh does not flash stale totals.
5. Background app 1+ min → return → should pick up new build (`appUpdate`).

Details: [`CROSS_DEVICE_AUDIT.md`](./CROSS_DEVICE_AUDIT.md), [`HUD_ORB_LANTERN_AUDIT.md`](./HUD_ORB_LANTERN_AUDIT.md).

## Automated gate

```bash
npm run test:os
```

CI: `.github/workflows` Alfred verify + gitleaks; Netlify deploy on `main`.

## Known limits (by design)

| Item | Note |
|------|------|
| Main JS chunk ~540KB | Vendor split (`vite.config.ts`); Pulse map already async |
| Pulse/flight APIs | Public read endpoints (no PII); session still required for ask |
| God's Eye 3D | Local Mac host; lantern ritual in `gods-eye/` |
| Desktop agents | Herald / JARVIS-OS / xtool = companions only |

## Research backlog

Prioritized improvements (detail in [`IRIS_IMPROVEMENTS_RESEARCH.md`](./IRIS_IMPROVEMENTS_RESEARCH.md)):

1. Prompt cache breakpoints (team context cached ✅; monitor hit rate in Usage)
2. Optional `defer_loading` on rare tools (Anthropic tool search pattern)
3. Gauge → module “context expansion” (persona UI doc)
4. Streaming TTS / speak-as-you-go (Herald `SpeakStream` — needs server audio path)
5. More `useGuardedAsync` on heavy panels (Hub feed, Woodhouse status)

## Related

- [`AGENTS.md`](../AGENTS.md) — guardrails
- [`IRIS_PERSONA_UI.md`](./IRIS_PERSONA_UI.md) — JARVIS/FRIDAY/Ultron skins
- [`herald-os/CHERRY_PICK.md`](../herald-os/CHERRY_PICK.md) — voice efficiency ports
