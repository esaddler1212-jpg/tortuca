---
name: gods-eye-view
description: Set up E's "God's Eye" 3D live-data globe (bilawalsidhu/gods-eye-view) on a Chromebook, a newer computer, or the planned server, and link it to IRIS's Bay Area Pulse. Use when E says "set up God's Eye", "install the gods eye protocol", "run God's Eye on my Chromebook", or "we have the computing space now".
---

# God's Eye View: setup playbook

E wants the full **God's Eye View** globe (live flights, ships, quakes, fires,
weather, satellites on a 3D Earth) running locally once there's a machine that
can handle it. IRIS already has the light version: the **Bay Area Pulse**
(`src/components/PulsePanel.tsx`) using keyless feeds. This skill installs the
heavy version and connects the two.

Upstream: https://github.com/bilawalsidhu/gods-eye-view (last reviewed at commit
`0d1a681`, 2026-10-31). **Re-read its README before installing**: setup steps,
Node versions and keys change. Where this file and the README disagree, the
README wins; note the difference to E.

## Step 0: Talk to E first

Ask (one message, short):
1. Which machine: the **Chromebook**, a newer computer, or the rented server
   from `docs/SERVER_PLAN.md`?
2. Just for E on that machine, or shared on the home network?
3. Which extras E wants (each needs a key, see Step 4). Default: none.

## Step 1: Check the machine can handle it

The globe is a CesiumJS 3D app with live data: it needs a real GPU-accelerated
browser and memory to spare.

| Need | Minimum | Comfortable |
|---|---|---|
| RAM | 8 GB | 16 GB |
| Free disk | 5 GB (repo + `node_modules` + map cache) | 10 GB+ |
| CPU | 64-bit Intel/AMD or ARM, 4 cores | newer i5/Ryzen 5/M-series |
| Browser | Chrome with WebGL 2 (check `chrome://gpu`) | hardware acceleration on |

### Chromebook specifics

1. Settings → **About ChromeOS** → note the version and the device model. Check
   **Settings → Advanced → Developers → Linux development environment**. If that
   option doesn't exist, the Chromebook can't run it locally: stop and use the
   server or another machine (see "If the machine can't do it").
2. Turn Linux on. Give it **at least 10 GB** of disk (it can be resized later in
   the same menu).
3. In the Linux terminal, check resources:
   ```bash
   free -h          # want 8 GB+ total on the Chromebook
   df -h ~          # want 5 GB+ free
   uname -m         # x86_64 or aarch64 both work
   ```
4. In Chrome, open `chrome://gpu` and confirm **WebGL2: Hardware accelerated**.
   If it says software only, the globe will be too slow; stop and pick another
   machine.
5. With 4 GB RAM total, don't try it: tell E it'll crawl, and suggest the server
   route instead.

Report what you found to E before installing.

## Step 2: Pick the install path

| Machine | Path |
|---|---|
| Chromebook (Linux on) | **Terminal (Path B)**. Docker on Crostini works but is heavier; skip it |
| Mac / Windows / Linux desktop | **Pinokio (Path A)** is easiest; Terminal also fine |
| Server (Coolify / Docker) | **Docker (Path C)**, with the sharing rules in Step 5 |

### Path A: Pinokio (one-click)
Install Pinokio 8.2+ from https://pinokio.computer, search "God's Eye View",
press **Install**, then **Start**. Pinokio's LAN and Cloudflare sharing are off
for this launcher on purpose.

### Path B: Terminal
Needs **Node.js 24.x (24.14.0+) or 26.x**. Not 25: the doctor warns about it.
```bash
# Node via nvm (no sudo needed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 24 && nvm use 24 && node -v      # expect v24.14+ 

git clone https://github.com/bilawalsidhu/gods-eye-view.git
cd gods-eye-view
npm ci
npm run doctor      # fix anything it flags before going on
npm run dev
```
Open **http://localhost:4173**. On a Chromebook, open it in regular Chrome
(ChromeOS forwards `localhost` from Linux automatically).

### Path C: Docker
```bash
git clone https://github.com/bilawalsidhu/gods-eye-view.git
cd gods-eye-view
env UID=$(id -u) GID=$(id -g) docker compose up -d
```
The port is published to `127.0.0.1:4173` only. Everything it saves stays in the
clone: `.env` (keys), `.gev-cache/`, `.gev-logs/`. Back up that folder to back
up everything. After a `git pull` that changes dependencies:
`docker compose down -v && docker compose up --build`.
Voice under Docker needs an OpenAI API key (no ChatGPT sign-in, no local MCP).

## Step 3: First run, no keys

Most layers are free with no signup: flights (OpenSky anonymous, adsb.lol),
earthquakes (USGS), satellites (CelesTrak), weather/radar/lightning (NOAA,
Open-Meteo), wildfire perimeters, launches, transit. Start here. Zoom to the
**Bay Area / Vallejo** and confirm flights, quakes and weather draw.

## Step 4: Keys (only what E asked for)

Add keys in the app: **POWER UP → Provider Settings**. They're saved to `.env`
in the clone, which is git-ignored.

| Key | Adds | Cost |
|---|---|---|
| Cesium ion | Photorealistic 3D cities + terrain | Free for personal, non-commercial use |
| NASA FIRMS | Live active fires | Free |
| AISStream | Live ships (SF Bay, Mare Island Strait) | Free signup |
| TomTom | Live traffic congestion colors | Free tier |
| Mapillary | Street-level photos | Free |
| OpenSky | More flight polling | Free, optional |
| Google Maps | Direct Google 3D tiles, place search, Street View | **Metered**: billing on, restrict the key, set a budget alert |
| OpenAI | Voice + AI summary in the HUD | **Metered**: the app caps API-key spend at $5 |

Rules (same as IRIS):
- E pastes keys **into the app or `.env` themselves**. Never ask for keys in chat,
  never write them into this repo or any commit. Gitleaks CI will block it.
- Prefer Cesium ion over a direct Google key (free route to the same 3D tiles).
- For metered keys: confirm with E, set provider-side quotas and add the cost to
  IRIS **Plan → Month → AI spend**.

## Step 5: Guardrails

- **Local only by default.** It binds to localhost. Don't expose it to the
  network unless E asks. If E does (home network only):
  `npm run dev -- --host 0.0.0.0 --port 4173`, plus
  `GEV_KEY_SETUP_TRUSTED_PEERS=none` for Docker. Warn E: anyone on that
  network can use their configured keys. Put keys in `.env` by hand and set
  provider quotas first. Never put it on the public internet without an
  authentication proxy in front of it.
- **Skip the surveillance layers.** Leave **Mapped ALPR Cameras** and public
  CCTV/traffic-camera views off. Not something E needs, and E works with
  students and families in Vallejo.
- **No student or Family Purpose data** goes anywhere near it. It's a public-data
  map, nothing more.
- Don't run code from the clone in this IRIS repo or the cloud sandbox; install
  only on E's machine or server.

## Step 6: Connect it to IRIS

Small change in this repo (open a PR, E merges):
1. Add a `VITE_GODS_EYE_URL` setting (default empty). Example:
   `http://localhost:4173` or the server's private address.
2. In `src/components/PulsePanel.tsx`, when it's set, show an **"Open God's Eye"**
   link in the header. When empty, show nothing.
3. Optional: Iris can say "Want me to open the globe?" when E asks about
   flights, ships or quakes. It only opens the link, it never reads the globe's
   data or keys.
4. Run `npm run test:time` and `npm run build`, then screenshot the Pulse panel at
   phone width.

## Step 7: Check it works

- [ ] `npm run doctor` passes (Path B), or the container is healthy (Path C)
- [ ] Globe loads at `http://localhost:4173` and spins smoothly
- [ ] Flights, quakes and weather show over the Bay Area with no keys
- [ ] Each added key's layer turns on (Provider Settings shows it set)
- [ ] ALPR/CCTV layers are off
- [ ] Not reachable from another device (unless E asked for home-network sharing)
- [ ] `git status` in the IRIS repo shows no keys; `.env` exists only in the clone
- [ ] IRIS Pulse shows the "Open God's Eye" link (if Step 6 was done)

Tell E what's on, what's off, what each key costs, and how to start it next time
(`cd gods-eye-view && nvm use 24 && npm run dev`, or Pinokio → Start).

## If the machine can't do it

- **Server route:** add God's Eye to `docs/SERVER_PLAN.md` "later" (~1–2 GB RAM,
  Docker). Keep it private: reach it over a VPN like Tailscale, not a public
  domain.
- **Until then:** the IRIS Bay Area Pulse covers quakes, weather, air quality and
  alerts with no install.
