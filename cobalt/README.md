# cobalt → IRIS (companion)

[cobalt](https://github.com/imputnet/cobalt) saves **public** video/audio from URLs ([cobalt.tools](https://cobalt.tools)). The monorepo is mostly **AGPL-3.0** — we **do not** embed the API or Svelte app in the Netlify PWA.

```bash
npm run cobalt:bootstrap   # → cobalt/cobalt-upstream/ (gitignored)
```

## What helps IRIS today

| Piece | IRIS |
|-------|------|
| Clipboard link read (`text/uri-list`) | `shared/httpClipboard.ts` — Hub feed URL paste |
| API design (session, rate limits) | Reference if you self-host for Tortuga B-roll |
| `@imput/cobalt-client` | **MIT** stub package in upstream; use only with **your** instance |

See [`CHERRY_PICK.md`](./CHERRY_PICK.md).

## Ethics (upstream)

Cobalt does not cache content; users must only download **public** media they may use. ECS/Tortuga reference clips belong in your own rights workflow — not on Iris servers by default.
