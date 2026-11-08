# IRIS improvements research

Ranked ideas from upstream projects, Anthropic docs, and this repo’s audits. **Default:** implement only what keeps Iris on Netlify + Claude guardrails.

## Tier 1 — High ROI, in-repo or started

| Idea | Source | Status / action |
|------|--------|-----------------|
| **Prompt caching** on stable system blocks | [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) | `PERSONA` + `teamContextForIris()` use `cache_control: ephemeral`; watch **Team → Usage** cache % |
| **Voice navigation fast path** | Herald `intents.ts` | Shipped: `shared/voiceIntents.ts` |
| **TTS sanitize + chunk** | Herald `speech-text.ts` | Shipped: `chunkForSystemVoice`, noise STT filter |
| **Stale fetch guard** | Herald `use-async.ts` | Shipped: `useGuardedAsync` (extend to Hub feed) |
| **Vendor code split** | Vite best practice | Shipped: `lucide`, `date-fns`, `leaflet` chunks |
| **Module chunk prefetch** | Existing `lazyModules.tsx` | On `focusModule` prefetch — verify on slow 3G |
| **PWA deploy reload** | Internal | `appUpdate.ts` on visibility |
| **Clipboard URL paste (Hub)** | [cobalt](https://github.com/imputnet/cobalt) web pattern | `shared/httpClipboard.ts`; self-hosted cobalt API optional for Tortuga B-roll |

## Tier 2 — Product UX (no new backend stack)

| Idea | Source | Notes |
|------|--------|-------|
| **Gauge context expansion** | HUD persona doc, sci-fi HUD patterns | Tap corner gauge → open module with one enlarged metric |
| **FRIDAY motion pass** | `friday-tony-stark-demo`, `data-voice-persona` | Faster scan on voice dock only (CSS) |
| **Barge-in polish** | Friday MCP / LiveKit patterns | `useConversation` cancel + `speakRun` already; tune relisten delay on iPhone |
| **Install / standalone nudges** | PWA | `InstallAppBanner`; iOS push requires standalone (`usePushNotifications`) |
| **Pre-warm cache at login** | Anthropic cookbook | Optional `max_tokens: 0` ping after Google sign-in (cost tradeoff) |

## Tier 3 — Optional sidecars (not merged into PWA)

| Project | Helps Iris how |
|---------|----------------|
| [**Herald OS**](https://github.com/iamlukethedev/Herald-OS) | Desktop Hermes; cherry-picked voice only — see `herald-os/` |
| [**JARVIS-OS-V.2**](https://github.com/MAL19INDUSTRIES/JARVIS-OS-V.2) | Local Gemini; patterns in `jarvis-os-v2/CHERRY_PICK.md` |
| [**Atticus-mac**](https://github.com/SaarthurR/atticus-mac) | Mac wake + tools; complementary to PWA |
| [**xtool**](https://github.com/xtool-org/xtool) | Native iOS shell if PWA limits bite — `xtool/CHERRY_PICK.md` |
| **God's Eye** | Pulse globe host; Tailscale + LAN |
| **OpenJarvis / alfred-jarvis** | ECS desktop research, not replacement for `/api/ask` |

## Tier 4 — Larger bets (explicit approval)

| Idea | Risk |
|------|------|
| **Streaming `/api/ask` SSE** + incremental TTS | New handler contract, mobile Safari |
| **Herald-style streaming audio WebSocket** | Netlify WS limits, cost |
| **Tool Search / deferred tools** | Anthropic beta; changes tool surface |
| **Full Three.js orb** | Bundle + GPU; keep 2D filament default |
| **n8n / Voicebox marketplace agents** | AGENTS.md — optional only |

## Anthropic efficiency checklist (for `/api/ask` changes)

1. Keep **tools + stable system** prefix byte-identical across turns.
2. Put **“Right now”** and memory **after** cached blocks.
3. Avoid timestamps in cached system text.
4. Monitor `cache_read_input_tokens` in usage store.
5. Specialist hops: keep `IRIS_MAX_HOPS` low; dedupe delegates (already).

## Team audit findings (Nov 8, 2026)

| Finding | Status |
|---------|--------|
| Every context-reading specialist matched the `IRIS modules (open with open_module)` registry line (it lists every domain's keywords), so their reports echoed the module list instead of real data | Fixed: `specialistExcerpt` skips the registry line |
| With no domain match, specialists fell back to the first 12 context lines, so Courier could report Today items as inbox findings | Fixed: reports "nothing on file" and points E to the module |
| Woodhouse ignored the `delegateHistory` it received and summarized an empty list unless the context happened to contain a Delegates line | Fixed: uses the real history |
| Context-only specialists added extra model hops | **Done:** Iris answers from Right now; `consult_specialist` tool is **scout** and **scribe** only (Team roster unchanged in UI) |
| Caching the conversation across hops (a third `cache_control` breakpoint on the latest message) only pays off on multi-hop turns; single-hop turns would pay the 1.25× cache write for nothing | Deferred: check the hops-per-turn mix in Settings → Iris usage first |

Regression checks: `npm run test:audit` (specialist domain excerpts, Woodhouse history).

## Where to track

- Implementation status: this file + [`IRIS_MAX_CAPACITY_AUDIT.md`](./IRIS_MAX_CAPACITY_AUDIT.md)
- Weekly production health: **Team → Weekly auditor**
- External code review packet: [`DEEPSEEK_IRIS_CODE_REVIEW.md`](./DEEPSEEK_IRIS_CODE_REVIEW.md)
