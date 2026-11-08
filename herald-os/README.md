# Herald OS → IRIS cherry-pick

[Herald OS](https://github.com/iamlukethedev/Herald-OS) is an **agent-native desktop OS** (Electron + Hermes Agent). It does **not** run inside the IRIS Netlify PWA.

We **do not vendor** the full tree. Clone locally when comparing UX:

```bash
npm run herald:bootstrap   # → herald-os/herald-upstream/
```

## What we ported (MIT)

| Herald source | IRIS |
|---------------|------|
| `speech-text.ts` | `shared/speechText.ts` — TTS sanitize, `chunkForSystemVoice`, stop/noise STT |
| `intents.ts` | `shared/voiceIntents.ts` — navigation fast path (no `/api/ask`) |
| `use-async.ts` | `src/hooks/useGuardedAsync.ts` — stale fetch guard |
| Voice pipeline | `useVoiceOutput`, `useConversation`, `useSpeechInput` |

## What stays on the Mac / Linux image

- Hermes JSON-RPC gateway, OS bridge plugin, permissions, missions, automations
- Electron shell, wake word, menu bar

See [`CHERRY_PICK.md`](./CHERRY_PICK.md) for future ideas (reminders UX, status panel patterns).

## Test

```bash
npm run test:speech
```
