# public-apis catalog — Tortuca workflow

Upstream: https://github.com/public-apis/public-apis (index only — do not vendor the README into git).

## Sync pin

```bash
npm run gamedev-resources:sync
```

Updates `gamedev-resources/upstream-pin.json` with the latest shallow clone commit.

## Curate

Edit `gamedev-resources/tortuca-public-apis.json`:

- `alreadyInTortuca` — production wiring
- `entries` — approved future use
- `backlog` — Iris/Revenue ideas needing proxy design
- `avoidInClient` — policy blocks

## Deep dive

[`docs/DEEP_DIVE_PUBLIC_APIS.md`](../../docs/DEEP_DIVE_PUBLIC_APIS.md)