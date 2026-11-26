# Deep dive: Medusa for Easy Supply / Revenue OS

Upstream: [medusajs/medusa](https://github.com/medusajs/medusa) — MIT open-core headless commerce (Postgres, Node 22+, modular products/carts/orders/payments).

Tortuca’s **Jan 1, 2027 Revenue OS** path is built around **Shopify** today (`shopify-store` API, launch checklist, Iris `shopifyContextForIris`). This doc answers whether Medusa should replace, complement, or stay on the shelf.

---

## What Medusa is

| Layer | Notes |
|-------|--------|
| **Runtime** | Node **v22.22+**, PostgreSQL, Redis optional (events/cache) |
| **APIs** | Admin + Store REST; Workflows SDK; JS client |
| **Admin UI** | Vite/React dashboard in `@medusajs/admin` |
| **Storefront** | You bring Next.js starter or custom (not bundled in Tortuca) |
| **Hosting** | Self-host (Docker), or Medusa Cloud |
| **License** | Core MIT; some enterprise packages (RBAC, audit) are commercial |

Commerce modules map cleanly to Easy Supply needs: **products, variants, inventory, carts, orders, fulfillments, Stripe payments**.

---

## Fit vs Shopify (your current stack)

| Dimension | Shopify (current) | Medusa (alternative) |
|-----------|-------------------|-------------------------|
| **Time to first sale** | Faster — hosted admin, themes, payments | Slower — VPS/DB, custom storefront |
| **Bootstrap cost** | ~$39+/mo + apps | Server ~$10–20/mo + Stripe; no platform cut on GMV |
| **Tortuca integration** | **Shipped** — `netlify/functions/_shopify.ts`, Team/Hud panels | **Not wired** — would need new proxy + snapshot types |
| **Iris context** | Live product/order read | Would mirror Shopify snapshot shape |
| **Revenue OS checklist** | `shopify_api` item is the gate | Would need parallel checklist if you switch |
| **AGPL / bundle risk** | N/A (API only) | MIT — safe as sidecar; **don’t** embed Medusa server in Netlify |

**Recommendation for Nov 2026 → Jan 2027:**

1. **Stay on Shopify** for Easy Supply until the launch checklist in [`REVENUE_OS.md`](./REVENUE_OS.md) is green and you have paid orders.
2. **Revisit Medusa** if you need: custom B2B tiers, marketplace, or **escaping transaction fees** at scale — after `$2k/mo` short target, not before.
3. **Do not run two live stores** without a kill rule (split inventory and ads).

---

## Where Medusa could live (Woodhouse)

Same pattern as **Sure**: Postgres service on the planned VPS ([`SERVER_PLAN.md`](./SERVER_PLAN.md)), Tailscale-only admin, public storefront only on `easysupply.*` domain via Coolify.

```
[Tortuca PWA] --session--> [Netlify medusa-store?] --API key--> [Medusa on VPS]
                \
                 --> [Shopify today]  (primary until cutover)
```

Future Netlify env (not required now):

| Variable | Purpose |
|----------|---------|
| `MEDUSA_BACKEND_URL` | e.g. `https://commerce.internal` (Tailscale) |
| `MEDUSA_ADMIN_API_TOKEN` | Read-only admin token for Iris snapshot |

---

## Cherry-picks without adopting Medusa

| Borrow | Why |
|--------|-----|
| **Module boundaries** (product / order / payment) | Clean n8n automations later |
| **Medusa UI** (`packages/design-system`) | Tailwind component patterns for a **standalone** Easy Supply landing page |
| **Workflows SDK** | Inspiration for “fulfill order → log Hub Money → Sure transaction” |
| **Docker install docs** | [`tools/medusa/README.md`](../tools/medusa/README.md) |

---

## Iris / guardrails

- Iris must **not** create orders or change prices without E’s OK (same as Shopify).
- Secrets only in Netlify / Coolify — see `shared/agentGuardrails.ts` (`safeFact`).
- Until `MEDUSA_*` env is set, Iris uses `medusaCommerceHintForIris()` (Shopify-primary wording only).

---

## Related docs

- [`CHERRY_PICK_OPEN_SOURCE.md`](./CHERRY_PICK_OPEN_SOURCE.md)
- [`DEEP_DIVE_SURE_ASTRYX.md`](./DEEP_DIVE_SURE_ASTRYX.md) — finance sidecar
- [`REVENUE_OS.md`](./REVENUE_OS.md) — hybrid 60/40 plan