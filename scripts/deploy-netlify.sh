#!/usr/bin/env bash
# Deploy Family Purpose + BOYS student app to Netlify.
# Requires: NETLIFY_AUTH_TOKEN in the environment.
set -euo pipefail

if [[ -z "${NETLIFY_AUTH_TOKEN:-}" ]]; then
  echo "ERROR: Set NETLIFY_AUTH_TOKEN (Netlify → User settings → Applications → Personal access tokens)"
  exit 1
fi

export NETLIFY_AUTH_TOKEN
CLI=(npx --yes netlify-cli@23)

FP_SITE_NAME="${FP_SITE_NAME:-family-purpose-checkins}"
BOYS_SITE_NAME="${BOYS_SITE_NAME:-boys-with-purpose}"

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

echo "=== Deploying BOYS Student (${BOYS_SITE_NAME}) ==="
cd "../boys-student"
npm ci
export VITE_BOYS_API_URL="${VITE_BOYS_API_URL:-$FP_URL}"
echo "VITE_BOYS_API_URL=${VITE_BOYS_API_URL}"
npm run build
"${CLI[@]}" link --name "$BOYS_SITE_NAME" 2>/dev/null || "${CLI[@]}" sites:create --name "$BOYS_SITE_NAME"
"${CLI[@]}" env:set VITE_BOYS_API_URL "$VITE_BOYS_API_URL" --context production --context deploy-preview
"${CLI[@]}" deploy --prod --dir=dist --message "Deploy BOYS student app from CI/agent"

BOYS_URL="$("${CLI[@]}" status --json | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).url')"
echo ""
echo "Done."
echo "  Family Purpose: ${FP_URL}"
echo "  BOYS Student:   ${BOYS_URL}"
echo ""
echo "Next: In Family Purpose → Settings, set BOYS class code (PURPOSE-A/B/C) and backup upload URL/key."
