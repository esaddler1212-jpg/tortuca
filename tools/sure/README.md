# Sure (finance ledger) — Woodhouse sidecar

Upstream: https://github.com/we-promise/sure (AGPL-3.0). **Do not copy Rails source into this repo.**

## Quick start (VPS + Tailscale)

1. On the planned server ([`docs/SERVER_PLAN.md`](../../docs/SERVER_PLAN.md)), install Coolify or raw Docker.
2. Use upstream `compose.example.yml` from the Sure repo; set strong secrets and a **read-only API key** for Netlify.
3. Expose HTTPS only on Tailscale (or VPN); set `SURE_API_URL` in Netlify to that base URL.
4. In Sure UI, create income categories **Easy Supply** and **Thumbnails** (see `shared/sureIrisBridge.ts`).

## Netlify (Tortuca)

| Env | Notes |
|-----|-------|
| `SURE_API_URL` | No trailing slash |
| `SURE_API_KEY` | Scope: **read** only |

Iris reads totals via `GET /api/sure-summary` (session required). MCP write access stays on your desktop agent with `MCP_API_TOKEN` — not in the PWA.

## MCP (optional, local agent)

See upstream `docs/hosting/mcp.md`. Suggested read-only questions for Revenue OS:

- Uncategorized expenses this month
- Budget vs actual for a custom “Business” budget
- Income statement for the quarter

Full deep dive: [`docs/DEEP_DIVE_SURE_ASTRYX.md`](../../docs/DEEP_DIVE_SURE_ASTRYX.md).