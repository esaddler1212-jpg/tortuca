# Deploy Family Purpose on Netlify

This folder is a complete Netlify site (`netlify.toml`, app build, backup API).

## Cost

Netlify’s **free** tier is enough for one mentor: static hosting, light function use, and small backup JSON files in **Netlify Blobs**.

## Option A — GitHub (recommended)

Use this if the app lives in GitHub (e.g. repo `tortuca` with this app in `family-purpose/`).

1. Sign in at [https://app.netlify.com](https://app.netlify.com).
2. **Add new site → Import an existing project** → choose GitHub → authorize → select the repo.
3. **Build settings** — the repo root has a `netlify.toml` that sets **base directory** to `family-purpose`, so you usually do **not** need to change anything in the UI. Confirm it shows:

   | Setting | Value |
   | --- | --- |
   | Base directory | `family-purpose` (from `netlify.toml`) |
   | Build command | `npm run build` |
   | Publish directory | `dist` |

   If Netlify ignores the root config, set **Base directory** to `family-purpose` manually under **Build & deploy → Build settings**.

4. **Deploy site**. Wait for the build; you’ll get a URL like `https://something-random.netlify.app`.
5. **Site configuration → Environment variables** → add:

   | Key | Value |
   | --- | --- |
   | `FAMILY_PURPOSE_BACKUP_KEY` | A long random secret you choose (e.g. 32+ characters). **Same value** goes in the app Settings as **Backup upload key**. |

6. **Trigger deploy** again after adding the env var (or wait for the next git push).

### Chromebook setup (after deploy)

1. On your phone hotspot, open your Netlify URL in Chrome.
2. **Install** the app (Chrome menu → Install / Add to shelf).
3. **Settings** in the app:
   - **Back up automatically when the internet comes back** — on
   - **Backup upload URL** — `https://YOUR-SITE.netlify.app/api/family-purpose-backup`
   - **Backup upload key** — same secret as `FAMILY_PURPOSE_BACKUP_KEY`
   - **This Chromebook** — optional label (e.g. your name)

Leave **Backup upload URL** blank if you only want files in **Downloads** when the hotspot connects (no cloud upload).

## Option B — Netlify CLI (no GitHub)

From this directory (`family-purpose/`):

```bash
npm install
npx netlify login
npx netlify sites:create --name family-purpose-checkins   # pick a unique name
npx netlify env:set FAMILY_PURPOSE_BACKUP_KEY "your-long-secret-here"
npm run deploy:prod
```

The CLI prints your live URL. Use it in Chromebook Settings as above.

## Verify backup API

With your secret in an env var locally or on Netlify:

```bash
curl -sS -X POST "https://YOUR-SITE.netlify.app/api/family-purpose-backup" \
  -H "Content-Type: application/json" \
  -H "X-Backup-Key: your-long-secret-here" \
  -d '{"deviceLabel":"test","exportedAt":"2026-01-01T00:00:00.000Z","backup":{"format":"family-purpose-checkins","version":1,"checkIns":[]}}'
```

Expect: `{"ok":true,"id":"..."}`

Wrong key → `401`. Missing server env → `503`.

## Viewing uploaded backups

In the Netlify dashboard: **Storage → Blobs** (store name `family-purpose-backups`). Each auto-backup from the Chromebook creates an entry keyed by device label and timestamp.

## Custom domain (optional)

**Domain management** → add a domain (e.g. `checkins.yourdomain.org`). Free Netlify subdomain still works without this.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Build fails on Netlify | Confirm **base directory** is `family-purpose` if the repo is not only this app. |
| Install / offline broken | Must use **https** URL; open once on hotspot before going offline. |
| Upload always fails | Check URL ends with `/api/family-purpose-backup`, key matches env var, redeploy after setting env. |
| Only Downloads, no upload | **Backup upload URL** empty in Settings — intentional. |

## Local preview (development)

```bash
npm install
npm run dev
```

For a production-like preview with functions:

```bash
npm run build
npx netlify dev
```
