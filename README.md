# ECS Network Platform

Multi-site platform for **ECS Network** on a shared backend (**Tortuca**). It is
an npm-workspaces monorepo containing two customer-facing Next.js 14 sites and a
Next.js admin/backend app, plus a shared package for cross-app logic and UI.

```
ecs-network-platform/
├─ apps/
│  ├─ easy-supply-co/   # E-commerce (Shopify + Stripe)      → :3001
│  ├─ ecs-network/      # Marketing site (blog + contact)    → :3002
│  ├─ tortuca/          # Admin dashboard + backend APIs     → :3003
│  └─ daily-brief/      # Personal daily dashboard ("Jarvis") → :3004
├─ packages/
│  └─ shared/           # Supabase/Shopify clients, auth, types, UI components
└─ supabase/            # SQL migrations + seed for the shared database
```

### Daily Brief

`apps/daily-brief` is a no-voice personal dashboard that gives a daily
breakdown by aggregating several sources:

- **ECS data** — orders awaiting approval and open contact submissions pulled
  live from the Tortuca backend API.
- **Trackers** — counters you add/increment (e.g. songs written, sessions).
- **Tasks** — daily to-dos you add and check off.
- **Calendar** — today's events from your phone calendar's iCal/ICS feed
  (`CALENDAR_ICS_URL`); parsed by a dependency-free ICS parser.
- **Priority email** — a provider interface with a sample fallback (Gmail via
  OAuth is the intended real source).

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **E-commerce:** Shopify Storefront API
- **Payments:** Stripe Checkout
- **Hosting:** Vercel (one project per app)

## Prerequisites

- Node.js >= 18.18
- npm (workspaces)

## Quick start

```bash
npm install          # install all workspaces
npm run dev          # run all three apps concurrently
```

Then open:

- Easy Supply Co → http://localhost:3001
- ECS Network    → http://localhost:3002
- Tortuca admin  → http://localhost:3003
- Daily Brief    → http://localhost:3004

Run a single app instead:

```bash
npm run dev:store     # easy-supply-co
npm run dev:network   # ecs-network
npm run dev:tortuca   # tortuca
npm run dev:brief     # daily-brief
```

### Works without any credentials

Every integration is **optional** for local development. When keys are absent
the apps fall back gracefully:

| Integration | Missing → behavior |
| --- | --- |
| Shopify | Store shows a bundled sample catalog |
| Supabase | Blog shows sample posts; auth is disabled with a notice |
| Supabase (admin) | Tortuca / Daily Brief use an in-memory store (CRUD still works, resets on restart) |
| Stripe | Checkout returns a clear "not configured" message |
| Calendar (ICS) | Daily Brief shows a sample schedule |
| Gmail | Daily Brief shows sample priority email |

## Environment variables

See `.env.example` (root) for the full reference, and each app's own
`.env.example`. Copy the relevant one to `.env.local` inside each app:

```bash
cp apps/easy-supply-co/.env.example apps/easy-supply-co/.env.local
cp apps/ecs-network/.env.example    apps/ecs-network/.env.local
cp apps/tortuca/.env.example        apps/tortuca/.env.local
```

Key variables:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — server-only (API routes, admin). Never expose.
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Database (Supabase)

Schema and seed live in `supabase/`. With the Supabase CLI + Docker:

```bash
supabase start
supabase db reset   # applies migrations/0001_init.sql + seed.sql
```

Or run `supabase/migrations/0001_init.sql` against a hosted project via the SQL
editor. Tables: `profiles`, `posts`, `contact_submissions`, `orders`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run all four apps concurrently |
| `npm run build` | Build every app |
| `npm run lint` | Lint every app |
| `npm run typecheck` | Type-check every workspace |
| `npm run test` | Run unit tests where present (e.g. daily-brief ICS parser) |

## Deployment (Vercel)

Create **one Vercel project per app**, all pointing at this repo:

1. Set the project **Root Directory** to the app (e.g. `apps/easy-supply-co`).
2. Vercel auto-detects Next.js. The monorepo install runs at the repo root.
3. Add the environment variables for that app in the Vercel dashboard.
4. Point custom domains: `easy-supply-co.com`, `ecs-network.com`, and an admin
   subdomain for Tortuca.
