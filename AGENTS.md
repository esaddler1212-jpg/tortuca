# ECS Network Platform

npm-workspaces monorepo for the ECS Network. See `README.md` for the full
overview, stack, env reference, and deployment notes. This file captures
durable, non-obvious guidance for working in the repo.

## Layout & services

| Workspace | Role | Dev port |
| --- | --- | --- |
| `apps/easy-supply-co` | E-commerce (Shopify + Stripe) | 3001 |
| `apps/ecs-network` | Marketing site (blog + contact) | 3002 |
| `apps/tortuca` | Admin dashboard + backend API routes | 3003 |
| `packages/shared` (`@ecs/shared`) | Supabase/Shopify clients, auth, types, UI | n/a |
| `supabase/` | SQL migration + seed for the shared DB | n/a |

## Commands

Standard commands live in the root `package.json` and each workspace's
`package.json` (see `README.md`). In short: `npm install` at the root, then
`npm run dev` (all three apps via `concurrently`) or `npm run dev:store` /
`dev:network` / `dev:tortuca`. Also `npm run build`, `npm run lint`,
`npm run typecheck` (each runs across all workspaces).

There is currently **no automated test suite**; verification is
`npm run typecheck` + `npm run lint` + `npm run build`, plus manual browser
checks of the flows above.

## Cursor Cloud specific instructions

- Dependencies are installed by the startup update script (`npm install` at the
  repo root). npm workspaces symlink `@ecs/shared` into each app.
- Everything boots with **no environment variables**. Each integration degrades
  gracefully when its keys are absent (Shopify → sample catalog; Supabase → sample
  blog + auth disabled notice; Stripe → checkout returns a 501 "not configured"
  message; Tortuca → in-memory store). To enable an integration, copy that app's
  `.env.example` to `.env.local` and fill it in.
- `@ecs/shared` is consumed as **TypeScript source** via Next's
  `transpilePackages: ['@ecs/shared']` (set in every app's `next.config.mjs`).
  Editing shared source hot-reloads in the running apps — no build step for the
  package.
- `NEXT_PUBLIC_*` vars referenced with `process.env` inside `@ecs/shared` are
  inlined by each consuming app's Next build, so shared client code reads them
  correctly. Server-only vars (e.g. `SUPABASE_SERVICE_ROLE_KEY`) must only be
  used from server code.
- Server-only modules — `@ecs/shared/server` and `apps/tortuca/lib/store.ts`
  (the latter uses `import 'server-only'`) — must NOT be imported into client
  components. When a client component needs a type from one of them, use
  `import type { ... }` so the runtime module is never bundled.
- Tortuca's admin uses an **in-memory store** when Supabase is not configured;
  created posts/data reset when the dev server restarts. This is expected in
  local dev and lets the admin CRUD work offline.
- The `packages/shared` standalone `typecheck` needs Node types — its
  `tsconfig.json` sets `"types": ["react", "node"]` and it depends on
  `@types/node`. Keep both if you touch that config.
- Next.js is pinned to the patched **14.2.x** line (App Router). Stay on 14.2.x
  patches rather than jumping to 15/16 unless intentionally migrating.
- The Supabase schema/seed live in `supabase/`; apply with the Supabase CLI
  (`supabase start` + `supabase db reset`) or by running
  `supabase/migrations/0001_init.sql` in a hosted project's SQL editor.
