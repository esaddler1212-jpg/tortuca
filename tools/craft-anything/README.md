# Craft Anything (pinned toolchain)

Vendored install path for [Craft Anything](https://github.com/storytold/craft-anything) — evidence-first study of websites, apps, and games, exposed as **MCP + CLI** for Cursor agents.

City Nights workflow: [`docs/CITY_NIGHTS_CRAFT_ANYTHING.md`](../../docs/CITY_NIGHTS_CRAFT_ANYTHING.md).

## Install (Linux x86_64 / arm64)

```bash
bash tools/craft-anything/install.sh
bash tools/craft-anything/install.sh --cursor   # also wire Cursor MCP
npm run craft:doctor
```

The CLI binary is **not** committed (`bin/` is gitignored). Version pin: `VERSION`.

## Cursor MCP

After `--cursor`, `~/.cursor/mcp.json` should contain a `craft-anything` server pointing at:

`tools/craft-anything/bin/craft-anything-cli` with args `["mcp"]`.

Team template: [`.cursor/mcp.json.example`](../../.cursor/mcp.json.example).

Restart Cursor after setup. Agents should read the **`craft-anything` skill** (`list_toolsets` / `enable_toolset` for **browser** and **javascript** when studying web games).

## Rebuild / full Study→Build loop

The **rebuild** flow needs a signed-in coding agent (`craft-anything-cli doctor` → `ai detect`). Tortuca agents normally use **investigation-only** mode: capture evidence → markdown findings in `drive-world/research/findings/`, then implement in PlayCanvas by hand.

## Responsible use

Only study targets you own, have licensed, or that are **public documentation / demos** you are allowed to inspect. Do not use Craft Anything to rip commercial game assets into Tortuca.
