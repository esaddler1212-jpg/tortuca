#!/usr/bin/env bash
# Deploy Family Purpose + VantageGames (vantage-games/) to Netlify — not Alfred.
# Requires: NETLIFY_AUTH_TOKEN in the environment.
set -euo pipefail

if [[ -z "${NETLIFY_AUTH_TOKEN:-}" ]]; then
  echo "ERROR: Set NETLIFY_AUTH_TOKEN (Netlify → User settings → Applications → Personal access tokens)"
  exit 1
fi

export NETLIFY_AUTH_TOKEN
CLI=(npx --yes netlify-cli@23)

FP_SITE_NAME="${FP_SITE_NAME:-family-purpose-checkins}"
VANTAGE_GAMES_SITE_NAME="${VANTAGE_GAMES_SITE_NAME:-vantagegames1}"

echo "=== Deploying Family Purpose (${FP_SITE_NAME}) ==="
cd "$(dirname "$0")/../family-purpose"
npm ci
npm run build
"${CLI[@]}" link --name "$FP_SITE_NAME" 2>/dev/null || "${CLI[@]}" sites:create --name "$FP_SITE_NAME" --account-slug "$( "${CLI[@]}" api getCurrentUser | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).slug' )"
if [[ -n "${FAMILY_PURPOSE_BACKUP_KEY:-}" ]]; then
  "${CLI[@]}" env:set FAMILY_PURPOSE_BACKUP_KEY "$FAMILY_PURPOSE_BACKUP_KEY" --context production --context deploy-preview
fi
"${CLI[@]}" deploy --prod --dir=dist --message "Deploy Family Purpose from CI/agent"

FP_URL="$("${CLI[@]}" status --json | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).url')"
echo "Family Purpose URL: ${FP_URL}"

echo "=== Deploying VantageGames (${VANTAGE_GAMES_SITE_NAME}) ==="
cd "../vantage-games"
npm ci
npm run build:with-console
"${CLI[@]}" link --name "$VANTAGE_GAMES_SITE_NAME" 2>/dev/null || "${CLI[@]}" sites:create --name "$VANTAGE_GAMES_SITE_NAME"
"${CLI[@]}" deploy --prod --dir=dist --message "Deploy VantageGames from CI/agent"

VG_URL="$("${CLI[@]}" status --json | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).url')"
echo ""
echo "Done."
echo "  Family Purpose:   ${FP_URL}"
echo "  VantageGames:     ${VG_URL}"
echo ""
echo "Next: Family Purpose → Settings for BOYS class code only if you still use the Group tab."
