#!/usr/bin/env bash
# Refresh docs/playcanvas-org-repos.json from the PlayCanvas GitHub org.
# Requires: gh CLI (public org list works without auth; higher rate limits with auth).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/playcanvas-org-repos.json"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

gh api "orgs/playcanvas/repos?per_page=100&type=all" --paginate >"$TMP"
jq --arg fetched "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -s 'add | sort_by(.name) | {
    fetched_at: $fetched,
    org: "playcanvas",
    source: "https://github.com/orgs/playcanvas/repositories",
    count: length,
    repos: map({
      name,
      url: .html_url,
      clone_url: .clone_url,
      description: (.description // ""),
      language,
      stars: .stargazers_count,
      archived,
      fork,
      topics,
      default_branch,
      license: (.license.spdx_id // null),
      pushed_at
    })
  }' "$TMP" >"$OUT"

echo "Wrote $OUT ($(jq '.count' "$OUT") repos)"
