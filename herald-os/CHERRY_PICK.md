# Cherry-pick map: Herald OS → Tortuca / Iris

Herald OS is **MIT**. Hermes Agent upstream is separate — Iris keeps **Claude** on `/api/ask` with `AGENTS.md` guardrails.

## Do not merge

| Herald piece | Why |
|--------------|-----|
| Full Electron shell | IRIS is a PWA |
| `herald-os-bridge` Python tools | Desktop-only; Family Purpose data stays server-gated |
| Hermes gateway / JSON-RPC client | Duplicate of Iris stack |
| Linux session / niri / greetd | Out of scope |

## Ported in Tortuca

- **`shared/speechText.ts`** — from `speech-text.ts` (sanitize, chunker, `isStopPhrase`, `isNoiseTranscript`)
- **`useVoiceOutput`** — sanitizes model markdown before `speechSynthesis`
- **`useSpeechInput`** — drops noise transcripts

## Worth studying later (no code yet)

| Herald idea | Iris analogue |
|-------------|----------------|
| `docs/manual/reminders.md` | Push + `reminder-check` cron; natural-language "remind me in 20m" via `/api/ask` tool |
| Notifications panel | HUD urgent line + Team weekly auditor |
| Status panel / system meter widgets | Vitals + Woodhouse node health |
| `bindBridgeSetupNotice` | Degraded HUD when Woodhouse offline (Ultron skin) |
| Missions / automations | Plan module + morning digest |
| Voice office / wake | Optional Mac sidecar only (Atticus / Herald); not mobile PWA |

## Upstream install (reference)

macOS: Hermes install script + Herald DMG from [releases](https://github.com/iamlukethedev/Herald-OS/releases).
