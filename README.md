# Alfred

**Alfred** is your personal command center (Batman’s butler, not the butler’s name). It reads email and calendar, tracks weather and todos, and—through the **Woodhouse protocol**—shows the status of **every app you register**.

## Features

- **Today command center** — one screen: leave-by time, unified actions, timeline, apps, markets, inbox
- **School bell schedules** — Wednesday early release, minimum days, grade-aware (via Family Purpose / Woodhouse)
- **Evening wrap** — day summary + tomorrow preview after configurable hour
- **Add email to tasks** — one tap from inbox snippets
- **Woodhouse dashboard** — one card per app: metrics, summary, online/offline
- **Weather & sunset** — [Open-Meteo](https://open-meteo.com/)
- **To-do list** — browser storage
- **Schedule** — Google Calendar + local events + Woodhouse `calendar` items
- **Email** — Gmail (read-only OAuth)
- **Markets** — AI & drone watchlist, tech IPO radar (Finnhub; demo without API key)

## Woodhouse — backend for your apps

Woodhouse is how new apps talk to Alfred without custom UI work.

1. **Your app** implements `GET /api/woodhouse/snapshot` → [`woodhouse/node/v1`](WOODHOUSE.md)
2. **Alfred** registers the app URL and polls `GET /api/woodhouse` → `woodhouse/v3` aggregate

Full spec: **[WOODHOUSE.md](./WOODHOUSE.md)**

### Register apps

**Settings → Woodhouse apps** (saved in the browser), or Netlify env:

```bash
WOODHOUSE_NODES='[{"id":"easy-supply-co","displayName":"Easy Supply Co.","nodeType":"commerce","baseUrl":"https://..."},{"id":"family-purpose","displayName":"Family Purpose","nodeType":"education","baseUrl":"https://..."}]'
```

Legacy env vars (`WOODHOUSE_EASY_SUPPLY_URL`, `WOODHOUSE_FAMILY_PURPOSE_URL`) still work.

## Quick start

```bash
npm install
npm run dev
npx netlify dev   # Woodhouse aggregator + Google OAuth
```

## Deploy on Netlify

Build: `npm run build` · Publish: `dist` · Functions: `netlify/functions`

Enable **Netlify Blobs** for Google OAuth and optional Family Purpose backups.

## License

MIT
