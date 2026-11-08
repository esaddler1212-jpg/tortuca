/**
 * Chromebook · iPhone · iPad layout contract — static audit.
 * Run: npm run test:devices
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

let checkCount = 0;
const ok = (name: string, cond: boolean) => {
  checkCount++;
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
  return cond;
};

const indexHtml = read("index.html");
const manifest = read("public/manifest.webmanifest");
const tailwind = read("tailwind.config.js");
const indexCss = read("src/index.css");
const appTs = read("src/App.tsx");
const hudNav = read("src/components/hud/HudNav.tsx");
const hudHeader = read("src/components/hud/HudHeader.tsx");
const deck = read("src/components/hud/HudHomeCommandDeck.tsx");

// ── PWA shell (iPhone + iPad Home Screen, Chromebook install) ─────────
ok("viewport viewport-fit=cover", /viewport-fit=cover/.test(indexHtml));
ok("apple-mobile-web-app-capable", indexHtml.includes("apple-mobile-web-app-capable"));
ok("manifest linked", indexHtml.includes('href="/manifest.webmanifest"'));
ok("manifest standalone display", manifest.includes('"display": "standalone"'));
ok("manifest orientation any (iPad landscape + Chromebook)", manifest.includes('"orientation": "any"'));

// ── Breakpoint contract: lg === 833px (iPad landscape command deck) ───
ok("tailwind lg breakpoint 833px", /lg:\s*["']833px["']/.test(tailwind));
ok("index.css 833px iris dock height", indexCss.includes("@media (min-width: 833px)"));
ok("deck hidden below lg, grid at lg", deck.includes("hidden lg:grid"));

// ── iPhone safe area + no zoom on focus picker ─────────────────────────
ok("safe-top on header", hudHeader.includes("safe-top"));
ok("tab bar safe-area padding", hudNav.includes("env(safe-area-inset-bottom)"));
ok("iOS 16px inputs max-width 767", indexCss.includes("@media (max-width: 767px)") && indexCss.includes("font-size: 16px"));
ok("focus select 16px", hudHeader.includes("fontSize: 16"));
ok("tab targets min-h 52", hudNav.includes("min-h-[52px]"));
ok("header touch min-h 44 focus", hudHeader.includes("min-h-[44px]"));

// ── Home layout: phone stack vs iPad deck (no duplicate core at lg) ─────
ok("combo home: mobile stack lg:hidden", appTs.includes('className="space-y-4 lg:hidden"'));
ok("combo home: deck core only at lg", appTs.includes("HudHomeCommandDeck") && deck.includes("{core}"));
ok("main scroll pad hud-with-tabbar", indexCss.includes(".hud-with-tabbar"));
ok("100dvh more sheet", indexCss.includes("100dvh"));

// ── Chromebook / wide: shared max width with home deck ────────────────
ok("tab bar lg max-w 1100", hudNav.includes("lg:max-w-[1100px]"));
ok("home combo max-w 1100", appTs.includes('max-w-[1100px]'));

// ── Reduce motion (accessibility + low-power devices) ─────────────────
ok("prefers-reduced-motion global", indexCss.includes("prefers-reduced-motion: reduce"));

// ── Installed PWAs pick up new deploys ─────────────────────────────────
const mainTs = read("src/main.tsx");
const netlifyToml = read("netlify.toml");
ok("app update watch module", fs.existsSync(path.join(root, "src/lib/appUpdate.ts")));
ok("main starts update watch in prod", mainTs.includes("import.meta.env.PROD") && mainTs.includes("startAppUpdateWatch()"));
ok("update watch re-checks on foreground", read("src/lib/appUpdate.ts").includes("visibilitychange"));
ok("hashed assets cached immutable", netlifyToml.includes('for = "/assets/*"') && netlifyToml.includes("immutable"));
ok("sw.js never long-cached", /for = "\/sw\.js"[\s\S]*?no-cache/.test(netlifyToml));

// ── Client fetches survive non-JSON error bodies (function timeouts) ───
ok("useStocks tolerates bad JSON", read("src/hooks/useStocks.ts").includes(".json().catch("));
ok("useStocks catches refresh errors", /catch \(e\)/.test(read("src/hooks/useStocks.ts")));
ok("channel send tolerates bad JSON", read("src/hooks/useChannels.ts").includes(".json().catch("));

const passed = !process.exitCode;
console.log(passed ? `\nCross-device audit passed (${checkCount} checks).` : `\nCross-device audit failed (${checkCount} checks run).`);
