# Alfred server plan (on hold)

Alfred today runs on **Netlify** (web + iPhone app, scheduled functions) and the
**iMac** (Open Jarvis briefings). Some tools need a computer that's on 24/7 with
Docker, which neither can provide. This is the plan for that one server, so it's
ready to go when we turn it on.

> Status: **planned, not started.** Nothing here costs money until step 1.

---

## What goes on it

| Phase | App | What it adds to Alfred | Memory |
|---|---|---|---|
| 0 | **Coolify** | One-click installs, HTTPS, updates and backups for everything below | ~0.5 GB |
| 1 | **n8n** | Automation backbone: Gmail → Drive filing, Spotify logging for 2EASY, Easy Supply orders → Money, scheduled sponsor follow-ups | ~0.5–1 GB |
| 2 | **Twenty CRM** | Pipeline for jobs, the North Star board, partners/sponsors and $BAY subjects | ~1.5–2 GB (with Postgres + Redis) |
| 3 | **GPT Researcher** | "Research this" button on any task or goal → a sourced report in a few minutes | ~1 GB |
| 4 | **browser-use** | Automates sites that have no API (portals, forms, submission pages) | ~1–1.5 GB (runs a browser) |
| later | changedetection.io (full) | Watches pages that need JavaScript, with screenshots (upgrade to Alfred's Watch tab) | ~0.5 GB |
| later | **Postiz** | Schedule posts for $BAY, 2EASY and Easy Supply across IG, TikTok, YouTube and more (needs Postgres + Redis) | ~1–1.5 GB |
| later | **Pipecat** | Faster, interruptible real-time voice for Iris (streams audio instead of browser speech) | ~0.5–1 GB |
| later | **Kokoro TTS** | A more natural voice for Iris, generated on the server (82M-parameter open model) | ~1 GB |
| later | **Graphiti** (full) | Upgrade Iris's memory-lite to a knowledge graph of people, projects and dates (needs Neo4j/FalkorDB) | ~1–2 GB |
| later | **OpenMAIC** | North Star lesson builder (you build lessons; students don't log in) | ~1 GB + Postgres |
| later | **Paperclip** | Agents that work Claude-ready tasks around the clock (costs Claude credits) | ~1–2 GB + Postgres |

**Total (first four):** about 5–6 GB in use, so rent **8 GB of memory** for headroom. Adding the "later" apps means moving up to a 16 GB server.

**Not on this server:** ComfyUI and Maestro need an NVIDIA GPU (rent a GPU machine by the hour when there's a video to make); openWakeWord and Home Assistant belong on a device at home (a newer computer or a Raspberry Pi). Already covered without a server: web search and page reading (Iris uses Claude's built-in tools instead of SearXNG/crawl4ai), document reading (Claude reads PDFs; no Docling needed), push alerts (IRIS has them; ntfy only as a backup), and Remotion videos (rendered on request in a Claude Code session).

## Server to rent

- **Size:** 4 vCPU · 8 GB RAM · 80+ GB disk · Ubuntu 24.04 LTS
- **Where:** Hetzner Cloud (cheapest, US-West region in Hillsboro), or DigitalOcean / Vultr (simpler signup). Pick a US-West region for speed from Vallejo.
- **Cost:** roughly **$10–20/month**, plus a domain (~$12/year) if you don't already have one. Check current prices at signup; they change.
- **Backups:** turn on the host's automatic snapshots (usually +20%), and point Coolify's backups at a Backblaze B2 or Cloudflare R2 bucket (pennies/month).

### Domain names (example: `ecsnetwork.com`)

| Subdomain | App |
|---|---|
| `coolify.<domain>` | Coolify dashboard |
| `n8n.<domain>` | n8n |
| `crm.<domain>` | Twenty |
| `research.<domain>` | GPT Researcher (private; Alfred calls it, not the public) |

Manage DNS in Cloudflare (free). Coolify issues HTTPS certificates automatically.

---

## Setup steps (when we start)

### Step 1: Rent and lock down the server (≈30 min, E does this, Claude walks through it)
1. Create the server (Ubuntu 24.04, 8 GB). Add your **SSH key** during creation; no password login.
2. Point `coolify.<domain>` (and the other subdomains) at the server's IP in Cloudflare.
3. Firewall: allow only ports **22, 80, 443** (and 8000 just for the first Coolify login).

### Step 2: Install Coolify (≈10 min)
```bash
ssh root@<server-ip>
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
Open `http://<server-ip>:8000`, create the admin account, set the domain to
`coolify.<domain>`, then close port 8000.

### Step 3: n8n (≈20 min + Alfred wiring)
- Coolify → New resource → **n8n** (one-click). Domain `n8n.<domain>`.
- n8n credentials to create: **Google** (new OAuth client just for n8n; don't reuse Alfred's), **Spotify** (free developer app), **Shopify** if Easy Supply runs there.
- **Alfred wiring** (Claude builds):
  - `POST /api/n8n-inbound`: n8n sends results into Alfred (new to-dos, money entries, alerts), signed with a shared secret (`N8N_SHARED_SECRET` in Netlify + n8n).
  - "Run workflow" buttons in Alfred call n8n webhooks (`N8N_BASE_URL` in Netlify).
- First workflows: Gmail attachments → Drive folders · Spotify recently-played → 2EASY log · weekly sponsor follow-up drafts · new order → Money.

### Step 4: Twenty CRM (≈20 min + Alfred wiring)
- Coolify → New resource → **Twenty** (one-click, includes Postgres + Redis). Domain `crm.<domain>`.
- Pipelines: **Jobs**, **North Star board & partners**, **Sponsors**, **$BAY subjects** (one per city).
- **Alfred wiring:** Twenty API key in Netlify (`TWENTY_API_KEY`, `TWENTY_URL`) → a **Pipeline** card in Vantage (deals by stage, follow-ups due) and follow-ups on Do today.
- Keep student data **out** of the CRM (Family Purpose stays separate).

### Step 5: GPT Researcher (≈20 min + Alfred wiring)
- Coolify → Docker image `gptresearcher/gpt-researcher`. Private (no public domain needed; Alfred calls it).
- Keys: an LLM key (Anthropic or OpenAI) + **Tavily** search key (free tier available).
- **Alfred wiring:** a **Research** button on plan tasks and goals → report saved to Memos and optionally Drive.

### Step 6: browser-use (≈30 min, after the others are stable)
- Runs as a small Python service with a headless browser; needs an LLM key.
- Use only for sites without an API (e.g., checking a submission portal status). Every run that submits or changes something goes through the **Agent desk → Needs your OK** approval first.

---

## Keys and where they live

| Key | Lives in | Never in |
|---|---|---|
| Coolify admin password | Your password manager | Chat, git |
| n8n Google/Spotify credentials | n8n's encrypted credential store | Netlify, git |
| `N8N_SHARED_SECRET`, `N8N_BASE_URL` | Netlify env + n8n | git |
| `TWENTY_API_KEY`, `TWENTY_URL` | Netlify env | git |
| LLM + Tavily keys | GPT Researcher / browser-use env in Coolify | Netlify, git |

Gitleaks (CI) blocks any of these from landing in the repo. Paste keys only into
those dashboards, never into chat.

## Monthly cost estimate

| Item | Approx. |
|---|---|
| Server (8 GB) | $10–20 |
| Snapshots / backups | $2–4 |
| Domain | ~$1 |
| LLM + search usage (research, browser-use) | $5–20, capped with provider limits |
| **Total** | **≈ $20–45/month** |

Add these to Alfred's **Plan → Month → AI spend** budget so they're tracked.

## When to turn it on

Good triggers to start Step 1:
- North Star partner/sponsor outreach ramps up (Twenty earns its keep), or
- $BAY pre-production starts and city/subject tracking gets real, or
- You catch yourself doing the same Gmail → Drive → spreadsheet shuffle weekly (n8n).

Until then, Alfred's built-in versions cover it: Feed, Watch, Money, Gym, Memos,
the Agent desk, and the prompt generator.
