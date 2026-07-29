# Easy Supply Co. — Command Center

Shopify operations dashboard for **Easy Supply Co.**: approve orders, track store performance, and plan marketing toward **$5,000/month** in sales. Built as a **Woodhouse protocol** store node — ready to sync snapshots into your Alfred personal assistant stack.

## Features

- **Pulse** — Month-to-date revenue, order count, AOV, $5k goal progress, revenue chart, health signals, top products
- **Orders** — Approve, hold, or reset orders; writes `woodhouse:approved` / `woodhouse:held` tags in Shopify
- **Growth** — Marketing idea backlog with estimated monthly lift vs. your revenue gap
- **Woodhouse** — `GET /api/woodhouse/snapshot` returns a compact JSON payload for Alfred / future automation

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Without Shopify credentials, the app runs on **realistic demo data**.

## Connect Shopify

1. In Shopify Admin → **Settings → Apps and sales channels → Develop apps**, create a custom app.
2. Grant **read_orders**, **write_orders** (for approval tags), and **read_products** if you extend analytics later.
3. Copy the Admin API access token and store domain.
4. Set environment variables (local: `.env` loaded by Netlify Dev; production: Netlify site env):

   - `SHOPIFY_STORE_DOMAIN` — e.g. `easy-supply-co.myshopify.com`
   - `SHOPIFY_ADMIN_ACCESS_TOKEN` — Admin API access token

5. For production: `npm run build` and deploy on Netlify (`netlify.toml` included).

## Woodhouse protocol (v1)

Alfred (or any orchestrator) can poll:

```http
GET /api/woodhouse/snapshot
```

Response includes `protocol: "woodhouse/v1"`, key metrics, pending order IDs, and `priorityActions`. Wire this into your broader business apps as you build them.

## Repo

Part of the **tortuca** monorepo vision — individual apps that sync to a central assistant. This app is the Shopify slice for Easy Supply Co.
