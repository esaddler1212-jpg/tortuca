/**
 * Thin programming auditor — static checks for auth gaps, unsafe parsing,
 * missing client auth headers, and other “thin” implementation holes.
 * Run: npm run test:thin
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLIENT_FETCHES_REQUIRE_AUTH,
  PUBLIC_API_HANDLERS,
  SCHEDULED_HANDLERS,
  SESSION_REQUIRED_HANDLERS,
  STOCKS_LIVE_REQUIRES_SESSION,
  handlerSourceGuardsLiveStocks,
  handlerSourceRequiresSessionCheck,
  handlerSourceSafeJsonBody,
} from "../shared/thinProgrammingPolicy.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel: string) => fs.existsSync(path.join(root, rel));

let checkCount = 0;
const ok = (name: string, cond: boolean) => {
  checkCount++;
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

const fnDir = path.join(root, "netlify/functions");

// ── Session gates on private APIs ───────────────────────────────────────
for (const name of SESSION_REQUIRED_HANDLERS) {
  const rel = `netlify/functions/${name}.ts`;
  ok(`handler exists: ${name}`, exists(rel));
  if (exists(rel)) {
    const src = read(rel);
    ok(`${name}: session check + 401`, handlerSourceRequiresSessionCheck(src));
    ok(`${name}: safe JSON body parse`, handlerSourceSafeJsonBody(src));
  }
}

for (const name of PUBLIC_API_HANDLERS) {
  ok(`public handler exists: ${name}`, exists(`netlify/functions/${name}.ts`));
}

if (STOCKS_LIVE_REQUIRES_SESSION) {
  ok("stocks: live Finnhub path gated by session", handlerSourceGuardsLiveStocks(read("netlify/functions/stocks.ts")));
}

// ── Client ↔ API wiring ─────────────────────────────────────────────────
for (const { file, needle, headerFn } of CLIENT_FETCHES_REQUIRE_AUTH) {
  const src = read(file);
  ok(`${file} calls ${needle}`, src.includes(needle));
  ok(`${file} uses ${headerFn} for API`, src.includes(headerFn));
}

// ── Scheduled jobs present ──────────────────────────────────────────────
for (const name of SCHEDULED_HANDLERS) {
  ok(`scheduled function: ${name}`, exists(`netlify/functions/${name}.ts`));
}

// ── Secrets & dangerous patterns (src app shell) ────────────────────────
const scanSrc = (relDir: string) => {
  const base = path.join(root, relDir);
  if (!exists(relDir)) return;
  const walk = (d: string) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory() && ent.name !== "node_modules") walk(p);
      else if (/\.(tsx?|mts)$/.test(ent.name)) {
        const rel = path.relative(root, p);
        const text = fs.readFileSync(p, "utf8");
        ok(
          `${rel}: no process.env in client`,
          !/process\.env\s*\./.test(text),
        );
        ok(`${rel}: no dangerouslySetInnerHTML`, !/dangerouslySetInnerHTML/.test(text));
      }
    }
  };
  walk(base);
};
scanSrc("src");

ok(".gitignore ignores .env", read(".gitignore").includes(".env"));

ok("netlify.toml api redirect", read("netlify.toml").includes('from = "/api/*"'));

ok("AGENTS.md documents thin auditor", read("AGENTS.md").includes("test:thin"));

const userData = read("netlify/functions/user-data.ts");
ok("user-data PUT wraps JSON.parse in try", /try\s*\{[\s\S]*JSON\.parse\s*\(\s*event\.body/.test(userData));

const passed = !process.exitCode;
console.log(passed ? `\nThin programming audit passed (${checkCount} checks).` : `\nThin programming audit failed (${checkCount} checks run).`);
