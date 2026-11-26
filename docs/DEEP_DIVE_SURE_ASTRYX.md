# Deep dive: Sure + Astryx for Tortuca / Revenue OS

Two upstream repos evaluated for **what to plug in vs what to document-only**. Neither replaces Netlify + Hub Money for Jan 1, 2027 activation; they extend the **Woodhouse VPS** plan and optional UI polish.

| Repo | License | Role for us |
|------|---------|-------------|
| [we-promise/sure](https://github.com/we-promise/sure) | AGPL-3.0 | Self-hosted **ledger** (transactions, budgets, net worth, goals) |
| [meta/astryx](https://github.com/meta/astryx) | MIT | **Design system** (React 19, StyleX, 150+ components) |

See also [`CHERRY_PICK_OPEN_SOURCE.md`](./CHERRY_PICK_OPEN_SOURCE.md) and [`REVENUE_OS.md`](./REVENUE_OS.md).

---

## Sure — personal finance sidecar

### What it is

Community fork of Maybe Finance: **Rails + Postgres + Redis**, Docker/Kubernetes, full UI for households (“families”). Strong fit for **cash truth** and tax prep while Hub Money stays the **Revenue OS speedometer** (MTD thumbnails vs Easy Supply).

**High-value surfaces for IRIS:**

| Surface | Why |
|---------|-----|
| REST `GET /api/v1/transactions` | Filter by date/category; reconcile payouts |
| `GET /api/v1/balance_sheet`, `get_income_statement` | Month-close sanity checks |
| Assistant **function tools** (`app/models/assistant/function/*`) | 50+ tools: budgets, bills, rules, imports |
| **MCP** `POST /mcp` | External agents (Claude Desktop, custom) with OAuth or `MCP_API_TOKEN` + `MCP_USER_EMAIL` — see upstream `docs/hosting/mcp.md` |
| OpenAPI | `docs/api/openapi.yaml` — regenerate from RSpec |

### Legal / architecture guardrails

- **AGPL:** Do **not** ship Sure inside the Tortuca Vite bundle or expose it as a public Netlify route without a compliant deployment. Run it as a **separate service** on your VPS ([`SERVER_PLAN.md`](./SERVER_PLAN.md)).
- **Secrets:** `SURE_API_KEY` (read scope) and any MCP token live in **Netlify env** / Coolify only — never Iris `safeFact`, never client code.
- **Write tools:** MCP can import statements and edit transactions. Use **read-only API keys** for the Netlify proxy; keep write MCP for you + Claude Desktop on Tailscale.

### Tortuca wiring (shipped)

| Piece | Path |
|-------|------|
| Category map Thumbnails / Easy Supply | `shared/sureIrisBridge.ts` |
| Session-gated read-only summary | `netlify/functions/sure-summary.ts` → `GET /api/sure-summary` |
| Client poll (30m) | `src/hooks/useSureSummary.ts` |
| Iris ask extras | `sureContextForIris()` in `App.tsx` |
| Woodhouse registry slot | `DEFAULT_WOODHOUSE_NODES` id `sure-ledger` |
| Bootstrap | `tools/sure/README.md` |

**Env (Netlify):**

| Variable | Purpose |
|----------|---------|
| `SURE_API_URL` | Tailscale or VPN URL, e.g. `https://sure.your-tailnet` |
| `SURE_API_KEY` | Sure API key with **`read`** scope |

Hub Money remains authoritative for **$2k/mo Revenue OS** until you automate n8n sync (phase 2).

### Phased rollout (aligned Jan 2027)

1. **Now (prep):** Clone upstream; stand up Docker on planned VPS; create categories matching `SURE_REVENUE_CATEGORY_HINTS`.
2. **Post go-live:** Log Shopify payouts + thumbnail PayPal/Venmo in Sure weekly; Iris reads account totals via `/api/sure-summary`.
3. **Later:** n8n `Easy Supply order → Sure transaction`; MCP read tools in a **local** Claude skill (not Netlify) for “uncategorized this week”.

---

## Astryx — Meta design system

### What it is

Open-source DS used at scale inside Meta: `@astryxdesign/core`, themes, CLI `astryx init`, **AGENTS.md** generator for human + agent workflows. Built on **React 19** and StyleX; consumers override with `className` (Tailwind-friendly).

**Tortuca today:** Vite + React **19** (`package.json`) + custom **cyan reactor HUD** (Iris orb, `hud-*` classes). That is intentional product identity.

### Fit assessment

| Option | Verdict |
|--------|---------|
| Replace entire HUD with Astryx | **Defer** — large migration, clashes with orb/cinema skin before revenue launch |
| Add `@astryxdesign/core` to main `package.json` now | **Defer** — dual theming risk on every panel |
| Greenfield **admin / Revenue dashboard** slice | **Pilot** Q2 2027 — see `tools/astryx-pilot/README.md` |
| Copy **patterns** (data tables, form density, agent docs) | **Yes** — documentation only for 2026 |

**Cherry-pick ideas (no install required):**

- Templates for **metric dashboards** (Revenue OS bars already mirror this).
- CLI habit of committing **agent guidance** next to UI — we already have `AGENTS.md`; optional `astryx init` only inside a pilot folder.
- Accessibility and keyboard patterns when rebuilding a single panel.

### Pilot rule

Any Astryx pilot must be **scoped** (`tools/astryx-pilot/` or separate route), neutral theme, and must not change global Tailwind tokens or Iris orb CSS.

---

## Decision summary

| Need | Use |
|------|-----|
| $2k/mo tracking, Jan prep checklist | **In-repo** Revenue OS |
| Bank/credit truth, budgets, tax export | **Sure** on VPS |
| Faster polished forms/tables later | **Astryx pilot**, not full swap |
| 24/7 automation | **n8n** (SERVER_PLAN phase 1) feeding Sure + Hub |

Questions for a future pass: shared OAuth between Sure and Google login (today: separate); whether thumbnail invoices should live in Sure **merchant** tags or Hub memos only.