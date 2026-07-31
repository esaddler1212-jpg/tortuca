# Tortuca

**Tortuca** is a short-film streaming platform inspired by Netflix, Hulu, and Disney+ — with auth, subscriptions, upload/CDN playback, and rights gating.

## Features

| Area | What you get |
|------|----------------|
| **Streaming UI** | Hero, rows, browse, search, title + watch pages |
| **Auth (Clerk)** | Sign-in/up, account page, protected `/admin` and `/my-list` |
| **Sync** | My List + watch progress via Netlify Database APIs |
| **Video** | Admin MP4 upload → Netlify Blobs, range streaming at `/api/stream/[slug]`, HLS via `hls.js` when `hlsManifestUrl` is set |
| **Business** | Stripe Checkout + webhooks, Premium gating, regional availability per title |

## Stack

- Next.js 15 · React 19 · TypeScript · Tailwind
- [Clerk](https://clerk.com) · [Stripe](https://stripe.com)
- [Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-database/) (Postgres + Drizzle)
- [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) for uploaded masters

## Quick start

```bash
cp .env.example .env.local
# Fill in Clerk + Stripe keys (see below)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without env vars, the app still runs using the static demo catalog in `src/lib/catalog.ts`.

## Environment setup

### Clerk (auth)

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy **Publishable** and **Secret** keys into `.env.local`.
3. Add your user ID to `ADMIN_USER_IDS` to access `/admin`.

### Netlify Database (catalog + sync)

On Netlify, `NETLIFY_DB_URL` is injected at deploy. Locally:

```bash
npm run db:migrate
```

After deploy, open `/admin` and click **Seed database from demo catalog**.

### Stripe (Premium)

1. Create a recurring **Price** in Stripe.
2. Set `STRIPE_PRICE_ID_PREMIUM`.
3. Webhook endpoint: `https://<your-site>/api/stripe/webhook` for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Set `STRIPE_WEBHOOK_SECRET`.

### Video pipeline

1. Sign in as admin → `/admin`.
2. Upload an MP4 for a film **slug** (must exist in DB after seed).
3. Playback serves from `/api/stream/<slug>` with byte-range support.
4. For HLS, set `hlsManifestUrl` on a film (Mux, Cloudflare Stream, etc.).

## Cursor Cloud Agents

Startup install failed previously because `main` only contained `README.md` while the install hook ran `npm install` before `package.json` existed.

### 1. Merge the app to `main`

Cloud environments clone the default branch. **`main` must include `package.json` and `package-lock.json`** or every new agent pod will fail install.

### 2. Point the environment install command at the guarded script

In **Cursor → Cloud Agents → Environments → your tortuca environment → Setup**, set **Install command** to:

```bash
bash scripts/cloud-install.sh
```

Or paste this inline (same behavior):

```bash
set -euo pipefail
cd "${CURSOR_WORKSPACE:-/workspace}"
if [ -f package.json ]; then
  if [ -f package-lock.json ]; then npm ci; else npm install; fi
else
  echo "No package.json on this branch — skipping npm install."
fi
```

### 3. Rebuild the environment

After merging to `main`, trigger an environment rebuild so the next agent run starts with dependencies pre-installed.

`scripts/cloud-install.sh` is idempotent: it exits `0` when `package.json` is missing (no false startup failure) and uses `npm ci` when a lockfile is present.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run db:generate` | New migration from `db/schema.ts` |
| `npm run db:migrate` | Apply migrations locally |
| `bash scripts/cloud-install.sh` | Cloud Agent install hook |

## Deploy

`netlify.toml` is included. Connect the repo on Netlify, set env vars from `.env.example`, and deploy. Migrations in `netlify/database/migrations/` apply automatically on deploy.
