# Alfred

**Alfred** is your personal command center (Batman’s butler, not the butler’s name). It reads email and calendar, tracks weather and todos, and—through the **Woodhouse protocol**—shows the status of **every app you register**.

## Features

- **Today command center** — one screen: leave-by time, unified actions, timeline, apps, markets, inbox
- **School bell schedules** — Wednesday early release, minimum days, grade-aware (via Family Purpose / Woodhouse)
- **Morning ritual** — wake-up modal: daily quote, leave-by preview, one-tap workout log
- **Over-commitment warning** — flags packed days before you overextend
- **Evening wrap** — day summary + tomorrow preview after configurable hour
- **Suggested bedtime** — lights-out and wind-down from tomorrow’s schedule and wake alarm
- **Wind-down nudge** — in-app banner + push when it’s time to start your evening routine
- **Overnight delta** — “Since you last checked…” briefing banner (email, tasks, markets, apps)
- **Command bar** — natural-language commands: tasks, workouts, leave-by, bedtime, shopping, time blocks
- **Fitness tracker** — log arms, body, legs, or cardio; weekly counts; afternoon suggestion if you skip the morning
- **Daily motivation** — a fresh quote each day (classic wisdom + Alfred flair)
- **Morning digest email** — scheduled Gmail briefing with quote, weather, leave-by, tasks (Settings → enable)
- **Push notifications** — leave-by (10 min), wind-down, and urgent reminders (PWA + VAPID keys)
- **Weekly review** — Sunday evening rollup: tasks, school schedule, Woodhouse apps, meal prep
- **Live commute** — Google Maps Distance Matrix when addresses are set
- **Shopping & meal prep** — checklist groceries; check off to build pantry; Alfred suggests recipes you can make Sunday
- **Woodhouse dashboard** — one card per app: metrics, summary, online/offline
- **Weather & sunset** — [Open-Meteo](https://open-meteo.com/)
- **To-do list** — browser storage + optional cloud sync
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

Enable **Netlify Blobs** for Google OAuth and optional cloud sync.

### Environment variables

See `.env.example` for:

- **Google OAuth** — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Google Maps** (live commute) — `GOOGLE_MAPS_API_KEY`
- **Push notifications** — `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto:you@example.com)
- **Finnhub** (live stocks) — `FINNHUB_API_KEY`
- **Woodhouse nodes** — `WOODHOUSE_NODES`

### Scheduled functions

Netlify runs these automatically when deployed:

| Function | Schedule | Purpose |
|----------|----------|---------|
| `morning-digest` | Hourly | Email briefing at your briefing hour |
| `reminder-check` | Every 10 min | Push: leave-by, wind-down, urgent tasks |

Morning digest requires Gmail **send** scope — reconnect Google in Settings after enabling.

### Install on your phone (PWA)

Alfred is a **Progressive Web App** — no App Store needed. Once deployed on **HTTPS** (Netlify):

**iPhone (Safari)**
1. Open your Alfred URL
2. Tap **Share** (square with arrow)
3. Tap **Add to Home Screen**
4. Alfred opens full-screen with the green HUD icon

**Android (Chrome)**
1. Open your Alfred URL
2. Tap **Install app** when prompted, or Menu → **Add to Home Screen** / **Install**

Enable **push notifications** in Settings after install for leave-by and wind-down alerts.

Requires **HTTPS** — works automatically on Netlify, not on plain `localhost` from another device.

In **Settings → Sleep & bedtime**:

| Setting | Default | Purpose |
|---------|---------|---------|
| Target sleep | 7.5 h | Hours before wake for lights-out |
| Wind-down buffer | 30 min | Start evening routine before lights-out |
| Morning routine | 45 min | Prep time before leave-by (early wake) |
| Weekend wake | 08:00 | Used when tomorrow has no commitments |

## License

MIT
