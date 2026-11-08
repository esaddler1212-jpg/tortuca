# Herald OS → IRIS cherry-pick

[Herald OS](https://github.com/iamlukethedev/Herald-OS) is an **agent-native desktop OS** (Electron + Hermes Agent). It does **not** run inside the IRIS Netlify PWA.

We **do not vendor** the full tree. Clone locally when comparing UX:

```bash
git clone --depth 1 https://github.com/iamlukethedev/Herald-OS.git /tmp/herald-os
```

## What we ported (MIT)

| Herald source | IRIS |
|---------------|------|
| `apps/desktop/src/lib/voice/speech-text.ts` | `shared/speechText.ts` — TTS sanitize, sentence chunker, stop/noise STT helpers |
| Voice pipeline idea | `useVoiceOutput` calls `sanitizeForSpeech` before `speechChunks` |

## What stays on the Mac / Linux image

- Hermes JSON-RPC gateway, OS bridge plugin, permissions, missions, automations
- Electron shell, wake word, menu bar

See [`CHERRY_PICK.md`](./CHERRY_PICK.md) for future ideas (reminders UX, status panel patterns).

## Test

```bash
npm run test:speech
```
