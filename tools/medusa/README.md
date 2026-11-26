# Medusa — optional Easy Supply backend

Upstream: https://github.com/medusajs/medusa (MIT core). **Tortuca does not vendor this monorepo.**

## When to use

Only after Shopify path stalls **or** you explicitly want self-hosted commerce. Until then, use Netlify **Shopify** env vars and [`docs/REVENUE_OS.md`](../../docs/REVENUE_OS.md).

## Local / VPS bootstrap (reference)

Requirements: Node **22.22+**, PostgreSQL 14+.

```bash
npx create-medusa-app@latest easy-supply-medusa
# Follow prompts; enable Stripe when ready for payments.
```

Docker: https://docs.medusajs.com/learn/installation/docker

Deploy on Woodhouse VPS (Coolify), Tailscale for admin, HTTPS for storefront only.

## Tortuca integration (future)

1. Issue a **read-only** Admin API token on the Medusa instance.
2. Set `MEDUSA_BACKEND_URL` + `MEDUSA_ADMIN_API_TOKEN` in Netlify (not implemented until cutover decision).
3. Map snapshot fields to match `shared/shopify.ts` shape so Revenue OS and Iris stay unchanged.

Deep dive: [`docs/DEEP_DIVE_MEDUSA.md`](../../docs/DEEP_DIVE_MEDUSA.md).