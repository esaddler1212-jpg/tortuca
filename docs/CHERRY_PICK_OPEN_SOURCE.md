# Open-source cherry-picks (Tortuca / IRIS)

Curated forks and clones — **not** vendored into the PWA unless noted.

| Project | Doc | Tortuca touchpoint | Status |
|---------|-----|-------------------|--------|
| **Sure** (`we-promise/sure`) | [`DEEP_DIVE_SURE_ASTRYX.md`](./DEEP_DIVE_SURE_ASTRYX.md) | `sure-summary` API, `shared/sureIrisBridge.ts`, `tools/sure/` | Bridge shipped; VPS install manual |
| **Astryx** (`meta/astryx`) | [`DEEP_DIVE_SURE_ASTRYX.md`](./DEEP_DIVE_SURE_ASTRYX.md) | `tools/astryx-pilot/README.md` | Patterns only; pilot later |
| **Medusa** (`medusajs/medusa`) | [`DEEP_DIVE_MEDUSA.md`](./DEEP_DIVE_MEDUSA.md) | `shared/medusaIrisBridge.ts`, `tools/medusa/` | Shopify-first; Medusa doc + Iris hint only |
| **MAYA Sentinel** (`MAYA-Platform/MAYA-Sentinel`) | [`DEEP_DIVE_MAYA_SENTINEL.md`](./DEEP_DIVE_MAYA_SENTINEL.md) | `tools/maya-sentinel/`, `shared/mayaSentinelIrisBridge.ts` | Local ZIP scan before install (not in PWA) |
| **Dust Orb v2** ([Ship Notes](https://aqualang89.github.io/shipnotes-components/components/dust-orb/)) | [`DEEP_DIVE_DUST_ORB.md`](./DEEP_DIVE_DUST_ORB.md) | `CoreRing` ≥833px, `public/vendor/dust-orb/` | Default iPad landscape + desktop |
| **public-apis** | [`DEEP_DIVE_PUBLIC_APIS.md`](./DEEP_DIVE_PUBLIC_APIS.md) | `gamedev-resources/tortuca-public-apis.json` | Pulse/Stocks wired; Revenue backlog |
| Summer Engine / City Nights | [`SUMMER_ENGINE_TEMPLATES.md`](./SUMMER_ENGINE_TEMPLATES.md), [`CITY_NIGHTS_CRAFT_ANYTHING.md`](./CITY_NIGHTS_CRAFT_ANYTHING.md) | `drive-world/` | PlayCanvas ports |
| Open Generative AI workshops | [`CREATIVE_WORKSHOPS.md`](./CREATIVE_WORKSHOPS.md) | `workshops/` | MuAPI local only |

**Workflow:** explore in `/tmp` or `tools/*/`, **zip + [MAYA Sentinel](https://github.com/MAYA-Platform/MAYA-Sentinel)** on your machine for unknown repos (`bash tools/maya-sentinel/zip-repo-for-scan.sh`), write findings to `docs/`, add thin adapters in `shared/` + session-gated Netlify handlers, run `npm run test:os` before PR.