# Revenue OS — E's hybrid path to freedom

This doc is the operating spec for Iris, Hub Money, Scout presets, and the Revenue panel. Code: `shared/revenueOs.ts`.

## Targets (locked)

| Horizon | Monthly target | Notes |
|---------|----------------|--------|
| **Short** | **$2,000** | First freedom milestone |
| **Long** | **$10,000** | Scale phase |
| **Split** | **60% Easy Supply** · **40% Thumbnails** | **$1,200 / $800** at $2k |
| **Time** | **11–15 hrs/week** (90 days) | Don't exceed without a kill rule |
| **Capital** | **Bootstrap** — under **~$200/mo** ads/tools | No heavy spend without OK |

**Ramp honesty:** Shopify is **not-ready**. Weeks 1–8 are **thumbnail-led** (often 70–80% service income) while the launch checklist runs. Move toward **60/40** after the store can sell and fulfill.

## Thumbnail service (40% wedge)

Productized offer — pick one public package:

| Package | Price | Deliverable | Clients/mo for $800 |
|---------|-------|-------------|---------------------|
| Starter | $75 | 3 thumbs · 1 revision | ~11 |
| **Standard (default)** | **$125** | 5 thumbs · 1 revision · 48–72h | **~6–7** |
| Pro | $200 | 10 thumbs + style sheet | 4 |

Log income in Hub → Money as category **Thumbnails**.

## Shopify / Easy Supply (60% wedge)

Log product income as **Easy Supply**.

Launch checklist (toggle in Hub → Money → Revenue OS):

1. Hero product photos  
2. 1–2 live SKUs with variants  
3. Inventory verified  
4. Shipping + policies  
5. Shopify API connected (Netlify)  
6. Payout/bank ready  
7. Soft launch (organic)

`shopifyReadiness()` in the app mirrors API + catalog health.

## Iris behavior

- Morning brief includes **one** revenue line when Hub has money data (`revenueOsBriefLine`).
- Ask context includes `revenueContextForIris` (targets, MTD split, checklist, bootstrap rule).
- Scout preset **Thumbnail pricing** in Research (competitive template).
- **Never** auto-spend, publish listings, or buy ads over bootstrap cap without explicit approval.

## Kill rules

- Max **2** active income experiments (thumbnails + Easy Supply).
- Side idea gets **14 days** to show a signal (inquiry, sale, or booked call) or archive.
- If weekly hours exceed **15** for two weeks, raise prices or cut scope — don't add channels.

## Path to $10k/mo (later)

Typical shape: **~$6–7k product** + **~$2–3k service/recurring**, or one scaled product line with audience. Trading is **optional satellite** — not the core freedom loop.

## Related

- `shared/shopify.ts` — store snapshot + readiness  
- `docs/SERVER_PLAN.md` — 24/7 n8n when webhooks outgrow Netlify cron  
- Settings → log thumbnail gigs; Team → Revenue OS strip mirrors Hub