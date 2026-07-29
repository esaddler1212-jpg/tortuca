# Tortuca

**Tortuca** is a short-film streaming platform inspired by Netflix, Hulu, and Disney+. It focuses on stories under twenty minutes: festival picks, genre rows, search, title detail pages, and playback.

## Features (MVP)

- **Home** — Featured hero, horizontal content rows (trending, festival favorites, genres)
- **Title pages** — Synopsis, cast, play and My List actions
- **Watch** — Full-screen-friendly HTML5 video player
- **Browse & Search** — Genre chips and keyword search over the catalog
- **My List** — Client-side saves (ready to wire to accounts later)

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- Deploy-ready for [Netlify](https://www.netlify.com/) via `netlify.toml`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roadmap ideas

| Area | Next steps |
|------|------------|
| **Auth & profiles** | Sign-in, kid profiles, watch history (e.g. Clerk + database) |
| **Catalog** | CMS or admin API for films, HLS transcoding, CDN |
| **Subscriptions** | Stripe billing, free tier vs premium |
| **Recommendations** | Similar titles, “because you watched…” |
| **Mobile / TV** | React Native or TV apps, continue watching |

Catalog data lives in `src/lib/catalog.ts` as sample titles with demo video URLs. Replace with your own assets and a real media pipeline when you are ready to go live.
