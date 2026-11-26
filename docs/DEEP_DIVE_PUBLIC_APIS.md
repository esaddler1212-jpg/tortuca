# Deep dive: public-apis/public-apis

**Upstream:** [public-apis/public-apis](https://github.com/public-apis/public-apis) — community catalog (3,000+ APIs in README; not a library).  
**Tortuca slice:** [`gamedev-resources/tortuca-public-apis.json`](../gamedev-resources/tortuca-public-apis.json) + sync pin in [`upstream-pin.json`](../gamedev-resources/upstream-pin.json).

The repo is a **index**, not code you install. Value = finding **no-auth / CORS-friendly** feeds and knowing what needs a **Netlify proxy + session gate**.

---

## How Tortuca already uses public APIs

| Area | API | Where |
|------|-----|--------|
| **Pulse / Sentinel** | USGS earthquakes | `netlify/functions/_pulse.ts` |
| | NWS `api.weather.gov` alerts | `_pulse.ts` |
| | Open-Meteo air quality | `_pulse.ts` |
| | Open-Meteo weather + geocoding | `_pulse.ts`, `src/lib/weather.ts` |
| | Caltrans D4 CCTV JSON | `_pulse.ts` |
| | ADSB.lol flights | `_pulse.ts` |
| | WFIGS wildfires (ArcGIS) | `_pulse.ts` |
| **Money / Team** | Finnhub quotes + IPO calendar | `netlify/functions/stocks.ts` (session + env key) |
| **Games** | FreeToGame, GamerPower, JokeAPI, Open5e, 3DTexel, NASA POWER | flight-nemulator manifest |
| **Commerce** | Shopify Admin API | `_shopify.ts` (not from catalog — first-party) |

Everything above obeys **AGENTS.md**: keys in Netlify only, no secrets in Iris memory.

---

## Selection rules (unchanged)

From `tortuca-public-apis.json`:

1. **Browser/PWA:** `Auth: No`, `HTTPS: Yes`, `CORS: Yes` when called from client.
2. **Server-only:** Aviation weather, FRED, NewsAPI, Clearbit — new `netlify/functions/*` proxy + session (like `stocks`).
3. **Scout / research:** may use paid keys (Tavily) in `business-research`; catalog suggests *free* complements.
4. **Never client:** trademarked character APIs (Marvel, Comic Vine) — stay in `avoidInClient`.

---

## High-value picks for your goals (Nov 2026 → Revenue OS)

### Revenue OS · thumbnails · Easy Supply

| API (catalog) | Why | Wiring |
|---------------|-----|--------|
| [**Seller Fee**](https://seller-fee-api.narwhalapis.workers.dev) | Etsy/Stripe/PayPal/Gumroad fee breakdown — thumbnail pricing | Server proxy; Iris “net after fees” |
| [**Logoapi**](https://logoapi.sh/docs) | Client logos on portfolio mockups | Client OK (no key); cache in Blobs optional |
| [**MarketAux**](https://www.marketaux.com/) | Stock-tagged news sentiment | Proxy + key; complements Finnhub |
| [**Funding Signals**](https://fundingsignals.net/docs) | Recently funded companies — sponsor leads | Scout preset; server proxy |
| [**Pick an Agency**](https://www.pickanagency.com/developers) | Agency search — thumbnail B2B | Scout only; rate limit |

### Iris · Pulse · commute (mostly done)

| API | Why |
|-----|-----|
| **US Weather** (NWS) | Already wired |
| **Open-Meteo Ensemble** | Longer horizon for commute planning — optional `_pulse` |
| [**AviationWeather**](https://www.aviationweather.gov/dataserver) | God's Eye / flight context — **proxy only** (in catalog) |
| [**Transitland**](https://www.transit.land/documentation/datastore/api-endpoints) | If you expand Bay commute beyond Google | Key + proxy |

### Money · macro (optional, not Jan-critical)

| API | Why |
|-----|-----|
| [**FRED**](https://fred.stlouisfed.org/docs/api/fred/) | CPI / rates for spoken “macro context” | `FRED_API_KEY` + session proxy |
| [**Fiscal Data Treasury**](https://fiscaldata.treasury.gov/api-documentation/) | Public debt/treasury — low priority |
| **Finnhub** | Already wired for watchlist |

### North Star · ECS · content

| API | Why |
|-----|-----|
| [**Chronicling America**](http://chroniclingamerica.loc.gov/about/api/) | Historic newspapers — $BAY research |
| [**Spaceflight News**](https://spaceflightnewsapi.net) | Space lane for Pulse / vitals Easter eggs |
| [**The Calendar**](https://the-calendar.net/api/) | Static JSON holidays — backup to federal holiday logic |

### Games (existing catalog entries)

Keep `tortuca-public-apis.json` game rows; see [`GAMEDEV_RESOURCES.md`](./GAMEDEV_RESOURCES.md).

---

## What to skip (noise for IRIS)

- Long tail of **crypto exchanges** (100+ entries) — you have Finnhub; avoid quota burn.
- **Banking / payment onboarding** (Plaid-like) — use Shopify/Sure, not random aggregators.
- **APILayer promos** at top of README — not vetted; treat as ads.
- **MCP server table** in README — use only after MAYA Sentinel scan + your own auth (see Sure/Medusa deep dives).

---

## Workflow

```bash
# Refresh upstream commit pin (does not commit README into Tortuca)
npm run gamedev-resources:sync

# Validate catalogs
npm run test:gamedev-resources
npm run test:public-apis-deep
```

Research loop:

1. Search upstream README by category (`Finance`, `Business`, `Weather`, `Government`).
2. If integrating: add row to `tortuca-public-apis.json` with `target`: `iris-proxy` | `client` | `scout-only` | `flight-nemulator`.
3. Session-gate new Netlify handlers; extend `thinProgrammingPolicy.ts`.
4. Add Scout preset in `shared/businessResearch.ts` if research-facing.

---

## Iris behavior

`shared/publicApisIrisBridge.ts` adds ask context: prefer **already-wired Pulse/Stocks**; new catalog APIs only via **Netlify proxy** after E approves keys.

---

## Related

- [`CHERRY_PICK_OPEN_SOURCE.md`](./CHERRY_PICK_OPEN_SOURCE.md)
- [`REVENUE_OS.md`](./REVENUE_OS.md) — thumbnail + Shopify
- [`DEEP_DIVE_MAYA_SENTINEL.md`](./DEEP_DIVE_MAYA_SENTINEL.md) — before trusting a new API SDK repo