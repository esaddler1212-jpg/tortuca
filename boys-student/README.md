# Battleworld portal

Static **Netlify site** that ships the Flight Nemulator build under `/flight-nemulator/`. Use this instead of the Alfred (`alfred2`) preview when you only want the game.

This package path is still `boys-student/` so an existing Netlify site (e.g. `boys-with-purpose`) can keep **Base directory** = `boys-student` after you change the build command in the UI.

## Deploy on Netlify

1. **Base directory:** `boys-student`
2. **Build command:** `npm ci && npm run build:all` (also set in `netlify.toml`)
3. **Publish:** `dist`
4. No Family Purpose or Alfred env vars required.

Production URL example: re-point `boys-with-purpose.netlify.app` or create `battleworld.netlify.app`.

## Local dev

```bash
# Launcher only (links to /flight-nemulator/ — run build:all first for a full local bundle)
cd boys-student
npm install
npm run build:all
npm run preview
```

For game-only iteration: `cd ../flight-nemulator && npm run dev`.

## What changed

The former **BOYS student** curriculum app (class code login) was removed from this folder. BOYS APIs remain on the **Family Purpose** site if you still use the Group tab there; this deploy is **game-only**.
