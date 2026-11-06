# God's Eye (local globe) — Tortuca companion

This folder does **not** ship the [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) app inside the IRIS repo (heavy `node_modules`, `.env` keys, caches). You **clone upstream on your machine** (e.g. iMac) and run it there. IRIS only needs a **saved URL** in **Vitals → Bay Area Pulse → Link God's Eye globe** (`shared/godsEye.ts`).

## Quick start (iMac as server)

1. **Requirements:** Node **24.14+** or **26.x** (see upstream README). Run `npm run doctor` after install.

2. **Clone and install** (from this directory):

   ```bash
   cd gods-eye
   ./bootstrap.sh
   ```

   To **update** an existing clone without prompts: `GODS_EYE_PULL=1 ./bootstrap.sh`

   Or manually:

   ```bash
   git clone https://github.com/bilawalsidhu/gods-eye-view.git
   cd gods-eye-view
   npm ci
   npm run doctor
   ```

3. **Same machine only (Safari on the iMac):**

   ```bash
   npm run dev
   ```

   Open `http://localhost:4173`.

4. **iPhone / iPad on the same Wi‑Fi** — bind the dev server to the LAN and use the iMac’s IP:

   ```bash
   npm run dev -- --host 0.0.0.0 --port 4173
   ```

   On each mobile device, in IRIS set God’s Eye to e.g. `http://192.168.1.42:4173` (replace with your iMac’s address). **Do not** use `localhost` on the phone — that means the phone itself.

5. **Away from home:** use [Tailscale](https://tailscale.com) on iMac + phone, then save `http://<tailscale-ip>:4173` in IRIS.

6. **HTTPS:** IRIS is served over `https://`. If mixed-content blocks `http://` links, put the globe behind HTTPS (Caddy/nginx on the Mac, or deploy the static build to a host with TLS).

## Keys and privacy

- Configure providers in the God’s Eye app (**POWER UP → Provider Settings**). Keys live in **that** clone’s `.env` only — never commit them here.
- Follow `.claude/skills/gods-eye-view/SKILL.md`: skip surveillance-style layers you don’t need; no Family Purpose / student data.

## Start next time

```bash
cd gods-eye/gods-eye-view   # after bootstrap
nvm use 24                  # if you use nvm
npm run dev -- --host 0.0.0.0 --port 4173
```

## Ignore list

The cloned repo `gods-eye/gods-eye-view/` is gitignored so caches and secrets never land in Tortuca commits.
