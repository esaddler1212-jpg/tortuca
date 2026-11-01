# Alfred × OpenJarvis

This folder sets up [OpenJarvis](https://github.com/open-jarvis/OpenJarvis) as **Alfred**, E's
personal AI chief of staff. It runs on E's iMac and stays in sync with the Alfred command
center through the [Woodhouse protocol](../WOODHOUSE.md).

| What Alfred does | How |
|---|---|
| **Morning briefing** (6:15 AM, spoken) | Calendar, Gmail, Google Tasks, Vallejo weather, and this week's ECS deadlines |
| **ECS ops monitor** (Mondays 8 AM) | Reads the Woodhouse feed and ECS docs. Lists deadlines, risks, and the top 3 moves toward $BAY and $100K/month |
| **Funding scan** (1st and 15th) | Grants and sponsors for $BAY and North Star Network |
| **Career scan** (Wednesdays 9 AM) | Program Manager roles within 35 minutes of Vallejo that meet your salary floor |
| **Research and writing** (on demand) | Sponsor pitches, grant drafts, festival research, cited from your docs and the web |

```
Alfred web app (Netlify) ──GET /api/woodhouse──▶ woodhouse_sync.py ──▶ ~/.openjarvis/knowledge
   ▲ Woodhouse nodes: Easy Supply, Family Purpose,                         │
   │ ECS roadmap ($BAY, festivals)                                         ▼
   └──────────────── same priorities ◀──────── OpenJarvis "Alfred" (briefing, agents, chat)
```

## The hardware reality (iMac 21.5", Late 2012, 8 GB)

This iMac can run Alfred, but expect the following:

- **No Apple Silicon or usable GPU.** Local models run on the CPU only. The config uses
  `qwen3.5:2b` locally for quick, private questions. Everything heavier (chat, writing, research)
  goes to Claude. That's the "local first, cloud fallback" setup you picked. Expect a few
  dollars a month in API costs at normal use.
- **macOS Catalina (10.15) is the last official macOS for this iMac.** Current Ollama builds
  require a newer macOS. You have three options:
  1. **Cloud only (easiest).** Skip Ollama. OpenJarvis detects that no local engine is running and
     sends everything to Claude. Nothing else changes.
  2. **llama.cpp.** Build `llama-server` from source (needs Xcode Command Line Tools and CMake) and
     run it on port 8080. Then set `[engine] default = "llamacpp"` in the config.
  3. **OpenCore Legacy Patcher.** This unofficial tool upgrades the iMac to a newer macOS so Ollama
     installs normally. Back up first, because it carries real risk.
- **Keep it awake for the 6:15 briefing:**
  `sudo pmset repeat wakeorpoweron MTWRFSU 06:00:00`
- **8 GB of RAM:** close Chrome tabs before running a local model.

## Setup

### 1. Get this repo onto the iMac

```bash
git clone https://github.com/esaddler1212-jpg/tortuca.git && cd tortuca/alfred-jarvis
```

### 2. Install OpenJarvis

```bash
curl -fsSL https://open-jarvis.github.io/OpenJarvis/install.sh | bash -s -- --no-bg-orchestrator
```

If the installer stops at the **Ollama** step (expected on Catalina), install it manually:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
git clone https://github.com/open-jarvis/OpenJarvis.git ~/.openjarvis/src
cd ~/.openjarvis/src && uv sync
mkdir -p ~/.local/bin && ln -sf ~/.openjarvis/src/.venv/bin/jarvis ~/.local/bin/jarvis
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
cd -   # back to tortuca/alfred-jarvis
```

### 3. Add your Claude API key

Create a key at <https://console.anthropic.com>, then run:

```bash
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.zshrc && source ~/.zshrc
```

### 4. Add your documents

Download these from Google Drive as **PDF** (OpenJarvis can't read `.docx`):

| Put in `~/.openjarvis/knowledge/ecs/` | Put in `~/.openjarvis/knowledge/career/` |
|---|---|
| ECS Network Master Blueprint (ECS NETWORK → VANTAGE) | Your current resume |
| Tortuga Productions 2027 Business Plan | (optional) job descriptions you like |
| North Star Network Business Plan | |

### 5. Find your Alfred URL

E's is **https://alfred2.netlify.app**. The steps below are for finding it again or redeploying.

Alfred (the web app at the root of this repo) runs on Netlify. To find its address:

1. Sign in at <https://app.netlify.com> and open **Sites** (or **Projects**).
2. Find the site connected to `esaddler1212-jpg/tortuca` whose base directory is the repo root.
   Family Purpose (`family-purpose-checkins`) and BOYS (`boys-with-purpose`) are separate sites.
3. The URL appears under the site name, e.g. `https://something.netlify.app`. Open
   `<that URL>/api/woodhouse` in a browser. If you see JSON starting with `"protocol":"woodhouse/v3"`,
   that's the right one.

**Not there?** Alfred isn't deployed yet. Choose **Add new site → Import an existing project →
GitHub → tortuca**, leave the base directory empty (build settings come from `netlify.toml`),
and deploy. Then set up Google sign-in with **[GOOGLE_SIGNIN.md](GOOGLE_SIGNIN.md)**.
One Google setup covers both the web app and the iMac.

### 6. Personalize

```bash
./scripts/personalize.sh      # uses https://alfred2.netlify.app; override with ALFRED_URL=...
```

This installs the config, the Alfred persona, the Woodhouse sync, the knowledge index, and the three
scheduled agents. Fill in `~/.openjarvis/personas/alfred/USER.local.md` (your salary floor and
anything else private), then run the script again.

### 7. Connect accounts and test

```bash
jarvis connect gdrive        # paste the Client ID/secret from GOOGLE_SIGNIN.md step 5
echo '{"api_key": "OWM_KEY", "location": "Vallejo,CA,US"}' > ~/.openjarvis/connectors/weather.json
jarvis doctor                # everything green?
jarvis digest --fresh        # your first briefing
jarvis scheduler start       # start the weekly agents
jarvis                       # chat with Alfred
```

A free weather key is available at <https://openweathermap.org/api>.

### Alfred's voice (Fish Audio)

OpenJarvis has no built-in Fish Audio support, so this folder adds it in
`plugins/alfred_fish_tts.py`. `personalize.sh` installs it into OpenJarvis's Python with a
one-line startup hook (`zzz_alfred_fish_tts.pth`), so OpenJarvis's own files aren't touched and
updates won't remove it. Add to `~/.zshrc`:

```bash
export FISH_API_KEY="sk-fish-..."        # from fish.audio, never commit this
export FISH_VOICE_ID="..."               # optional: a voice model id from fish.audio
# export FISH_MODEL="s2.1-pro-free"      # the default
```

Test it with `jarvis digest --fresh`. If the voice fails (bad key, out of credits), the
briefing still arrives as text.

## Things to ask Alfred

- "What's on my plate this week across ECS?"
- "Draft a one-page $BAY presenting-sponsor pitch for a Vallejo credit union."
- "Which Bay Area festivals can the $BAY Director's Cut still enter if the episodes are on YouTube?"
- "Tailor my resume for this Program Manager posting: <paste>"
- "Remember: the Vallejo pilot participant is confirmed." (Alfred saves this to memory.)

## Files

| File | Installs to | Purpose |
|---|---|---|
| `config.toml` | `~/.openjarvis/config.toml` | Models, engines, briefing schedule, tools |
| `personas/alfred/SOUL.md` | `~/.openjarvis/personas/alfred/` | Who Alfred is and how it works |
| `personas/alfred/USER.md` | same | Who E is (public-safe; private details go in `USER.local.md`) |
| `personas/alfred/MEMORY.md` | same | Standing facts and 2027 dates. Alfred appends to it, and re-running the script won't overwrite it |
| `prompts/personas/alfred.md` | `~/.openjarvis/prompts/personas/` | Morning briefing voice |
| `scripts/woodhouse_sync.py` | `~/.openjarvis/` | Pulls the Woodhouse feed into Alfred's memory |
| `plugins/alfred_fish_tts.py` | OpenJarvis's Python packages folder | Fish Audio voice (TTS backend `fish`) |
| `scripts/personalize.sh` | not installed | Runs the setup |

**Privacy:** this repo is public, so contact info, salary, and the full business plans stay off
GitHub. Keep them in `USER.local.md` and `~/.openjarvis/knowledge/`, which live only on the iMac.
