# God's Eye (local globe) — Tortuca companion

This folder does **not** ship the [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) app inside the IRIS repo (heavy `node_modules`, `.env` keys, caches). You **clone upstream on your machine** (e.g. iMac) and run it there. IRIS only stores a **URL** in **Vitals → Bay Area Pulse → Link God's Eye globe** (`shared/godsEye.ts`).

## Quick start (iMac as server)

1. **Requirements:** Node **24.14+** or **26.x** (see upstream README). Run `npm run doctor` after install.

2. **Clone and install:**

   ```bash
   cd gods-eye
   ./bootstrap.sh
   ```

   **Update** an existing clone: `GODS_EYE_PULL=1 ./bootstrap.sh`

   Or manually:

   ```bash
   git clone https://github.com/bilawalsidhu/gods-eye-view.git
   cd gods-eye-view
   npm ci
   npm run doctor
   ```

3. **Run the dev server** (same command for both setups below):

   ```bash
   cd gods-eye/gods-eye-view
   npm run dev -- --host 0.0.0.0 --port 4173
   ```

   `--host 0.0.0.0` makes the app reachable **from other devices** on the network interfaces you allow (LAN and/or VPN — not the whole internet unless you forward ports).

---

## Same Wi‑Fi (home LAN)

Use this when iPhone/iPad and the iMac are on **the same home network**.

1. **Find the iMac’s LAN address**
   - **IP:** macOS → **System Settings → Network → Wi‑Fi → Details** (e.g. `192.168.1.42`), or run `ipconfig getifaddr en0` in Terminal.
   - **`.local` (Bonjour):** sometimes `http://your-imac-name.local:4173` works from other Apple devices; if it fails, use the numeric IP.

2. **Firewall:** macOS may block incoming connections the first time Node listens. Allow **Node** (or your terminal app) when prompted, or add an inbound allow rule for **TCP 4173** (System Settings → Network → Firewall → Options).

3. **In IRIS on each phone/tablet:** save e.g. `http://192.168.1.42:4173` — **not** `localhost` (on the phone, localhost is the phone).

4. **Mixed content note:** IRIS on Netlify is **HTTPS**. Safari often still opens **HTTP** God’s Eye in a **new tab** from a link; if anything blocks it, use **Tailscale + HTTPS** below or a small HTTPS reverse proxy.

---

## Not on the same Wi‑Fi (remote / cellular)

Pick **one** of these; **Tailscale** is the usual default (private, no public port forward).

### Option A — Tailscale (recommended)

1. Install [Tailscale](https://tailscale.com) on **iMac** and **iPhone/iPad**; sign in to the same tailnet.
2. On the iMac, run God’s Eye as above (`--host 0.0.0.0 --port 4173` — it will also bind on the Tailscale interface).
3. Find the iMac’s **Tailscale IP**: Tailscale app on the Mac or `tailscale ip -4`.
4. In IRIS, save **`http://100.x.y.z:4173`** (replace with that IP). Works from **LTE** as long as Tailscale is connected on the phone.

**Stable URL:** enable [MagicDNS](https://tailscale.com/kb/1081/magicdns/) in the admin console and use `http://imac-hostname.tailscale.ts.net:4173` if your tailnet allows it (check Tailscale docs for current hostname rules).

### Option B — HTTPS in front (fixes strict mixed-content)

If a browser won’t open **HTTP** God’s Eye from **HTTPS** IRIS, terminate **TLS** on the Mac (e.g. **Caddy** or **nginx**) with a local cert or Tailscale **Serve** / **Funnel** (see Tailscale docs — Funnel exposes a port to the internet only if you explicitly want that).

### Option C — Deploy a static build

Build God’s Eye for production per upstream README, host on **Netlify / Cloudflare Pages** (or similar) behind **HTTPS**, and paste that **https://** URL into IRIS. No need for the phone to reach your home IP.

---

## Connection check (“agent”)

On the **iMac** (or any machine that can reach the globe), after the server is running:

```bash
cd gods-eye
./check-connection.sh
./check-connection.sh "http://192.168.1.42:4173"
./check-connection.sh "http://$(tailscale ip -4 2>/dev/null || echo 100.x.y.z):4173"
```

Or from the repo root:

```bash
npm run gods-eye:check -- "http://YOUR_IP:4173"
```

The script tries **HTTP** to your URL, prints **status + round-trip time**, and suggests fixes if it fails or is slow (firewall, wrong host, Tailscale relay, mixed content).

---

## IRIS URL field (one device, one string)

Each device stores its own URL (`localStorage`). Typical combos:

| You are… | IRIS God’s Eye URL example |
|----------|----------------------------|
| iMac only (same machine) | `http://localhost:4173` |
| iPhone, iMac on same Wi‑Fi | `http://192.168.x.x:4173` |
| iPhone on LTE, iMac at home | `http://100.x.y.z:4173` (Tailscale) |
| Anywhere, no VPN | `https://your-globe.example.com` (deployed) |

---

## Keys and privacy

- Keys live only in **`gods-eye-view/.env`** after you set them in the app. Never commit them to Tortuca.
- Follow `.claude/skills/gods-eye-view/SKILL.md`: skip layers you don’t need; no Family Purpose / student data.

## Start next time

```bash
cd gods-eye/gods-eye-view
nvm use 24   # if you use nvm
npm run dev -- --host 0.0.0.0 --port 4173
```

## Ignore list

`gods-eye/gods-eye-view/` is **gitignored** so the clone never lands in Tortuca commits.
