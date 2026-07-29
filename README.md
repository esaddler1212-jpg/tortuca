# Alfred

**Alfred** is a personal assistant web app (in the spirit of Batman’s butler): daily weather and sunset times, a to-do list, your schedule, and a Gmail inbox summary when you connect Google.

## Features

- **Daily briefing** — Morning-style summary with weather, sunset, tasks, email, and next calendar item
- **Weather & sunset** — Powered by [Open-Meteo](https://open-meteo.com/) (no API key); set your city in Settings
- **To-do list** — Stored in your browser
- **Schedule** — Google Calendar (when connected) plus local events you add in the app
- **Email** — Recent Gmail inbox messages (read-only) when Google is connected

## Quick start

```bash
npm install
npm run dev          # UI only (weather/todos work; Google needs Netlify dev)
npx netlify dev      # Full stack including OAuth and Gmail/Calendar APIs
```

Open the URL shown in the terminal (typically `http://localhost:8888` with Netlify dev).

## Deploy on Netlify

1. Push this repo and create a Netlify site (build command: `npm run build`, publish directory: `dist`).
2. Enable **Netlify Blobs** (used for OAuth token storage per session).
3. Set environment variables:
   - `GOOGLE_CLIENT_ID` — OAuth 2.0 client ID (Web application)
   - `GOOGLE_CLIENT_SECRET` — OAuth client secret
4. In [Google Cloud Console](https://console.cloud.google.com/):
   - Enable **Gmail API** and **Google Calendar API**
   - Create OAuth credentials with authorized redirect URI:  
     `https://<your-site>.netlify.app/api/auth-callback`  
     (and `http://localhost:8888/api/auth-callback` for local dev)

## Privacy

- Google tokens are stored server-side in Netlify Blobs, keyed by a random session ID in your browser.
- Todos and local calendar events stay in `localStorage` on your device.
- Weather requests go directly from your browser to Open-Meteo.

## License

MIT
