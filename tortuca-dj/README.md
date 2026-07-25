# Tortuca DJ

A browser-based DJ-style app for your **Spotify playlists**: two decks, BPM/key info, headphone cue previews, and crossfades between tracks.

## Requirements

- [Spotify Premium](https://www.spotify.com/premium/) (required for full-length playback via the Web Playback SDK)
- A [Spotify Developer](https://developer.spotify.com/dashboard) application

## Setup

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Under **Settings**, add a **Redirect URI**:
   - `http://localhost:5173/callback`
   - Add your production URL the same way when you deploy (e.g. `https://your-site.netlify.app/callback`).
3. Copy the **Client ID** into `tortuca-dj/.env`:

```bash
cp .env.example .env
# Edit .env and set VITE_SPOTIFY_CLIENT_ID=your_client_id
```

4. Install and run:

```bash
cd tortuca-dj
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), connect Spotify, pick a playlist, load tracks onto Deck A and B, then play and mix.

## How it works

- **Playlists** are loaded with the Spotify Web API (read-only).
- **Full tracks** play through the [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk) on one stream at a time (Spotify’s model).
- **Cue preview** uses Spotify’s 30-second `preview_url` when available, so you can listen on the idle deck before you crossfade.
- **Crossfade** lowers volume, starts the other deck’s track, then brings volume back up.

## Scripts

| Command        | Description        |
|----------------|--------------------|
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm run preview` | Preview build   |

## License

MIT
