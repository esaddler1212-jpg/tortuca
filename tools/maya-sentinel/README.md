# MAYA Sentinel — scan before you install

Upstream: https://github.com/MAYA-Platform/MAYA-Sentinel (MIT). **Not vendored** in Tortuca — install on your Mac or iMac for local use only.

## Install once

```bash
git clone https://github.com/MAYA-Platform/MAYA-Sentinel.git
cd MAYA-Sentinel
python3 -m py_compile src/maya_lens/*.py maya_lens_server.py  # sanity
```

Requirements: Python **3.11–3.13**, no pip deps.

## UI

```bash
python maya_lens_server.py
# http://127.0.0.1:5182/ — loopback only; do not expose publicly
```

## CLI (good for Tortuca cherry-picks)

```bash
python maya_lens_server.py --scan /path/to/repo.zip --mode ai-surface
python maya_lens_server.py --scan /path/to/repo.zip --mode supply-chain
```

Modes: `safety`, `phishing`, `supply-chain`, `ai-surface`, `exfil`, `archive`.

## Zip a git clone (this repo helper)

From Tortuca root, after cloning e.g. Medusa or Sure to `/tmp/foo`:

```bash
bash tools/maya-sentinel/zip-repo-for-scan.sh /tmp/foo
# → /tmp/foo-sentinel-scan.zip (excludes node_modules, .git objects bulk)
```

Then scan that ZIP in Sentinel.

## When Tortuca agents cherry-pick

| Repo type | Suggested mode |
|-----------|----------------|
| Agent / MCP / skills | `ai-surface` |
| Node/Rails commerce or finance | `supply-chain` + `safety` |
| Random GitHub ZIP from social | `archive` + `phishing` first |

Deep dive: [`docs/DEEP_DIVE_MAYA_SENTINEL.md`](../../docs/DEEP_DIVE_MAYA_SENTINEL.md).