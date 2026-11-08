# xtool → IRIS (companion)

[xtool](https://github.com/xtool-org/xtool) is an **MIT** cross-platform **Swift / iOS build & deploy** toolchain (Xcode replacement for SwiftPM apps on Linux, macOS, Windows). IRIS stays a **Netlify PWA**; xtool is for **optional native shells**, device install QA, and future thin iOS wrappers.

```bash
npm run xtool:bootstrap    # shallow clone → xtool/xtool-upstream/ (gitignored)
bash xtool/ios-qa.sh       # PWA checklist + optional `xtool devices` (Mac)
```

## When Iris uses xtool

| Goal | Tool |
|------|------|
| Daily use on iPhone/iPad | Safari **Add to Home Screen** + `npm run test:devices` |
| Landscape command deck / orb | PWA manifest + CSS (`docs/CROSS_DEVICE_AUDIT.md`) |
| Sideload a **native** WKWebView shell later | `xtool dev` / `xtool install` on a SwiftPM project |
| Linux CI for iOS binaries | `XKit` / upstream SwiftPM (not in this repo) |

See [`CHERRY_PICK.md`](./CHERRY_PICK.md).
