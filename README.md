# tortuca

This repository holds unrelated projects that share a scratch remote. Each app has
its own README, build, and (typically) its own Netlify site.

## Projects

| Project | Path | Purpose |
|---------|------|---------|
| **Alfred** | repo root | Personal command center — email, calendar, weather, Woodhouse app dashboard |
| **Family Purpose** | [`family-purpose/`](family-purpose/) | Student check-ins, mentoring group sign-in, debriefs, BOYS curriculum API |
| **BOYS Student** | [`boys-student/`](boys-student/) | Student-facing monthly curriculum app (class code login) |
| **Alfred × OpenJarvis** | [`alfred-jarvis/`](alfred-jarvis/) | Local AI assistant (OpenJarvis) personalized as Alfred: briefings, ECS ops, research, career |
| **God's Eye** | [`gods-eye/`](gods-eye/) | Local 3D globe ([upstream](https://github.com/bilawalsidhu/gods-eye-view)): run on Mac; link from IRIS Pulse — [same Wi‑Fi + remote](gods-eye/README.md) |
| **JARVIS-OS-V.2** | [`jarvis-os-v2/`](jarvis-os-v2/) | Local Gemini Jarvis ([upstream](https://github.com/MAL19INDUSTRIES/JARVIS-OS-V.2)): clone + [cherry-pick only](jarvis-os-v2/CHERRY_PICK.md) — not Iris |
| **Herald OS** | [`herald-os/`](herald-os/) | Agent-native desktop ([upstream](https://github.com/iamlukethedev/Herald-OS)): [cherry-pick](herald-os/CHERRY_PICK.md) — speech/TTS helpers only in Iris |
| **City Nights** | [`drive-world/`](drive-world/) | Open-world Bay Area night driving (PlayCanvas) — **separate Netlify site**; see [`docs/CITY_NIGHTS_DEPLOY.md`](docs/CITY_NIGHTS_DEPLOY.md) |
| **Battleworld** (Flight Nemulator) | [`flight-nemulator/`](flight-nemulator/) | Homage crossover planet (PlayCanvas) — **separate Netlify site**; see [`docs/BATTLEWORLD.md`](docs/BATTLEWORLD.md) |
| **Tortuca Console** | [`games-hub/`](games-hub/) | PlayStation-style home for **City Nights** + **Flight Nemulator** (`npm run build:all` in `games-hub/`) |

**Local toolchains** (shallow clone, not shipped): [ACE-Step](tools/ace-step/) music, [Game Studios](tools/claude-code-game-studios/) Claude Code skills, [UnrealClaude](tools/unreal-claude/), [Audio2Face-3D](tools/audio2face-3d/) — index [`docs/UPSTREAM_GAME_TOOLCHAIN.md`](docs/UPSTREAM_GAME_TOOLCHAIN.md).

### Alfred (repo root)

**Alfred / IRIS** is your personal command center on **alfred2** (and locally): Iris voice + HUD home (four corner gauges, bottom tabs Today · Vitals · Inbox · Plan, **More** for Team · Woodhouse · Research · Hub · Meals · Drafts · ECS), Gmail/calendar, Woodhouse app status, **Bay Area Pulse digital map** (no raster tiles), server-side commute sync, Iris specialist team (one per module) with **duplicate delegate prevention** (Woodhouse on Team), and cross-device data in Netlify Blobs. Home uses the core ring and Iris voice — no separate “awaiting command” text box.

**iPad:** Add [IRIS to your Home Screen](https://developer.apple.com/documentation/webkit/promoting_apps_with_smart_app_banners) like any PWA; the UI treats **portrait as a wide phone** (comfortable tap targets, wider main column) and **landscape at ~833px+** as tablet/desktop (two-column Today with Iris talk beside “Do today” when the voice deck is open).

```bash
npm install
npm run dev
npx netlify dev   # Woodhouse aggregator + Google OAuth
npm run test:os   # build + time + iris + research + HUD/OS audit + guardrails + thin auditor (see docs/IRIS_MAX_CAPACITY_AUDIT.md)
# or: npm run build && npm run test:time && npm run test:iris && npm run test:research && npm run test:audit
```

Deploy from the **repo root** (default `netlify.toml`). See [WOODHOUSE.md](./WOODHOUSE.md)
for the Woodhouse integration spec and `.env.example` for environment variables.

**Business Researcher** (IRIS): panel on the main console runs sourced market/ops briefs via
`POST /api/business-research` (requires `ANTHROPIC_API_KEY` + Google connect). Reports land in
**Hub → Memos**; Claude-tagged plan tasks have a **Research** chip.

### Family Purpose

Standalone web app for logging student check-ins, running the mentoring group
sign-in, and sending daily debriefs. Hosts the BOYS curriculum API used by the
student app.

See [`family-purpose/README.md`](family-purpose/README.md).

Deploy as a **separate Netlify site** with base directory `family-purpose`.

### BOYS Student App

Students join with a class code (`PURPOSE-A`, `PURPOSE-B`, or `PURPOSE-C`), enter
name and grade, and submit monthly warm-up and exit ticket responses.

See [`boys-student/README.md`](boys-student/README.md).

Deploy as a **separate Netlify site** with base directory `boys-student` and
`VITE_BOYS_API_URL` set to your Family Purpose site URL.

## License

MIT
