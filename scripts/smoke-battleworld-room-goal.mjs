#!/usr/bin/env node
/**
 * Live smoke: GET + POST /api/battleworld-room-goal on a Tortuca deploy (not vantagegames1).
 *
 *   BATTLEWORLD_ROOM_GOAL_URL=https://alfred2.netlify.app/api/battleworld-room-goal node scripts/smoke-battleworld-room-goal.mjs
 *
 * Play QA for family remains on vantagegames1 — this only checks the Blobs-backed API.
 */
const base = (
  process.env.BATTLEWORLD_ROOM_GOAL_URL ??
  (process.env.ALFRED_API_BASE
    ? `${process.env.ALFRED_API_BASE.replace(/\/$/, "")}/api/battleworld-room-goal`
    : "https://alfred2.netlify.app/api/battleworld-room-goal")
).replace(/\/$/, "");

const weekId = `smoke-${new Date().toISOString().slice(0, 10)}`;

async function main() {
  if (process.env.SMOKE_SKIP_LIVE === "1") {
    console.log("SKIP smoke:room-goal (SMOKE_SKIP_LIVE=1)");
    return;
  }
  const getUrl = `${base}?weekId=${encodeURIComponent(weekId)}`;
  const getRes = await fetch(getUrl);
  if (!getRes.ok) throw new Error(`GET ${getRes.status}`);
  const before = await getRes.json();
  console.log("GET ok", before);

  const postRes = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weekId, delta: 1 }),
  });
  if (!postRes.ok) throw new Error(`POST ${postRes.status}`);
  const posted = await postRes.json();
  console.log("POST ok", posted);

  const get2 = await fetch(getUrl);
  const after = await get2.json();
  const tallyOk =
    typeof after.tally === "number" && after.tally >= (Number(before.tally) || 0) + 1;
  if (!tallyOk) throw new Error(`tally did not increase: ${JSON.stringify(after)}`);
  console.log("PASS battleworld-room-goal smoke", { base, weekId, after });
}

main().catch((err) => {
  console.error("FAIL", err.message ?? err);
  process.exit(1);
});