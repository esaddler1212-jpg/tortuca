# Tortuca DJ

A **private-library DJ app** for your browser. Build a personal catalog from your **Spotify Liked Songs**, attach **your own audio files**, and mix on two decks with real overlapping playback (Web Audio API).

Spotify is used **only** to read your likes (title, artist, BPM, artwork)—not for streaming. You supply the actual music files (rips, purchases, downloads you own).

## Requirements

- Modern browser with IndexedDB
- Your audio files (MP3, WAV, FLAC, OGG, M4A)
- Optional: [Spotify Developer](https://developer.spotify.com/dashboard) app to sync liked songs

## Setup

1. **Optional Spotify import:** Create a dashboard app, add redirect URI `http://localhost:5173/callback`, set `VITE_SPOTIFY_CLIENT_ID` in `.env`.
2. Install and run:

```bash
cp .env.example .env   # only if using Spotify import
npm install
npm run dev
```

3. Open http://localhost:5173
4. **Connect Spotify** → **Sync Spotify likes** (builds your catalog)
5. **Add audio files** — name files like `Artist - Title.mp3` to auto-match imported likes
6. Load **ready** tracks onto Deck A / B and mix

## Privacy

- Library metadata and audio blobs stay in **IndexedDB on your device**
- No backend; nothing is uploaded to Tortuca or Spotify when you add files
- Spotify OAuth only fetches your liked-track list when you click sync

## Workflow

| Step | What happens |
|------|----------------|
| Sync likes | Imports song names, artists, BPM, art from Spotify |
| Add files | Matches filenames to likes; unmatched files become standalone library entries |
| DJ | Two decks, crossfader, simultaneous local playback |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |

## Legal note

Only add audio you have the right to use. Tortuca does not download music from Spotify.
