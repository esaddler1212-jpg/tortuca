#!/usr/bin/env node
/**
 * Production smoke for https://vantagegames1.netlify.app (launcher + embedded console builds).
 * Browser path: npm run smoke:vantagegames1:browser (needs drive-world deps + CHROME_PATH).
 */
const BASE = (process.env.VANTAGEGAMES_URL || 'https://vantagegames1.netlify.app').replace(/\/$/, '');
const results = [];
const check = (name, ok, detail) => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const paths = [
  { path: '/', must: /Vantage|Console|Games/i },
  { path: '/console/', must: /city-nights|City Nights|Battleworld|flight/i },
  { path: '/console/city-nights/', must: /City Nights|Tap to start/i },
  { path: '/console/flight-nemulator/', must: /Battleworld|Tap|flight/i }
];

for (const row of paths) {
  const url = `${BASE}${row.path}`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    check(`${row.path} HTTP ${res.status}`, res.ok && row.must.test(text), url);
  } catch (e) {
    check(`${row.path} fetch`, false, String(e));
  }
}

console.log('smoke:vantagegames1 (HTTP) done — run smoke:vantagegames1:browser for tap-start QA');
process.exit(results.every(Boolean) ? 0 : 1);