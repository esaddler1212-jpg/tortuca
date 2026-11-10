# IRIS Mac wake-word sidecar (Tier A)

Thin **Atticus-class** companion: always-on menu-bar mic that talks to your deployed IRIS `/api/ask` with your existing `X-Alfred-Session` cookie/token — no screen capture by default.

## Status

Scaffold only. Production build would use:

- macOS `AVAudioEngine` or [openWakeWord](https://github.com/dscripka/openWakeWord) for "Hey Iris"
- Herald fast-path: local regex → HUD deep link before `/api/ask`
- Session from Keychain (same as browser OAuth session id)

## Quick manual test

1. Sign in to IRIS in Chrome on the Mac and copy session id from DevTools → Application → local storage (`alfred-session`).
2. `export IRIS_URL=https://your-site.netlify.app IRIS_SESSION=...`
3. Run `./ask-once.sh "what's on today"` (see script below).

## Files

- `ask-once.sh` — one-shot curl to `/api/ask` for smoke tests.

## Privacy

Do not enable screen OCR unless E opts in. Follow `AGENTS.md` student-privacy rules on any context you send.
