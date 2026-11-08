# Cherry-pick map: cobalt → Tortuca / Iris

## Do not merge

| cobalt piece | Why |
|--------------|-----|
| `api/` service (AGPL) | Running as a networked downloader on Netlify would trigger AGPL obligations; host separately |
| `web/` Svelte UI | Different stack; cobalt.tools is not a product skin for IRIS |
| Using `api.cobalt.tools` | [Forbidden without permission](https://github.com/imputnet/cobalt/blob/main/docs/api.md) |
| Client-side FFmpeg workers | Heavy; mobile Safari limits |

## Ported / referenced in Tortuca

- **`shared/httpClipboard.ts`** — paste public http(s) links (Hub feeds, future “save reference” flows)
- **Hub → Feed editor** — “Paste URL” (clipboard read requires user gesture)

## Future (self-hosted sidecar)

For **Tortuga / ECS** production:

1. Run a **private** cobalt API ([`docs/run-an-instance.md`](https://github.com/imputnet/cobalt/blob/main/docs/run-an-instance.md)) on Woodhouse or a VPS
2. Call it only from authenticated Netlify functions (never expose API keys client-side)
3. Store outputs in your DAM / Drive — **not** Netlify Blobs by default
4. Iris voice: “save that link” → add Hub memo + optional function proxy (explicit product approval)

## Patterns worth reading in upstream clone

- `web/src/lib/task-manager/` — queue + worker scheduling (if IRIS adds client-side transcode)
- `web/src/lib/download.ts` — `http:`/`https:` guard before `window.open`
- `docs/protect-an-instance.md` — Turnstile + rate limits (mirror for any public proxy you run)

## License note

- Repo default: **AGPL-3.0**
- `packages/api-client`: **MIT** (thin client; still talks to **your** instance)
