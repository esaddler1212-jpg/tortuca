# Cherry-pick map: xtool → Tortuca / Iris

**Iris primary surface:** Vite PWA (`manifest.webmanifest`, service worker, `appUpdate.ts`). **xtool does not replace that.**

xtool helps when you need **programmatic iOS device access** or **SwiftPM builds without full Xcode** — useful for a future **thin native host** around the same Netlify origin, not for merging Swift into the web bundle.

## Do not merge into the web app

| xtool piece | Why |
|-------------|-----|
| `Sources/XKit`, `XToolSupport` | Swift libraries — separate app / sidecar |
| `xtool auth`, `sdk`, codesign | Apple Developer lifecycle; secrets stay on Mac/CI |
| Developer API `patch.js` | Apple Connect schema patcher; irrelevant to `/api/ask` |
| `scripts/select-identity.sh` | macOS Keychain codesigning picker |

## Borrowed in Tortuca (companion only)

| Addition | Purpose |
|----------|---------|
| `xtool/bootstrap.sh` | Shallow clone upstream for reading docs / Swift examples |
| `xtool/ios-qa.sh` | Print PWA QA steps + optional `xtool devices` |
| `npm run test:xtool` | Ensures companion docs/scripts exist |
| Cross-device doc link | `docs/CROSS_DEVICE_AUDIT.md` notes optional native QA |

## Future native shell (not implemented)

If iOS limits (background mic, push quirks) outgrow pure PWA:

1. SwiftPM app: single `WKWebView` → `https://<your-netlify-site>/`
2. Entitlements: microphone, push (native), optional Tailscale for God's Eye LAN
3. Build/sign with **xtool** on Mac or Linux CI; install via `xtool install`

Patterns to study in upstream clone:

- `xtool devices` / `install` / `launch` — repeatable device smoke test after deploy
- Doc site Netlify config (`netlify.toml` + `Documentation/build.sh`) — **docs-only** build `ignore` pattern, not Iris production build

## Install xtool (operator)

- macOS: https://xtool.sh/documentation/xtooldocs/installation-macos  
- Linux: https://xtool.sh/documentation/xtooldocs/installation-linux  

```bash
npm run xtool:bootstrap
# After installing CLI:
xtool setup
bash xtool/ios-qa.sh
```
