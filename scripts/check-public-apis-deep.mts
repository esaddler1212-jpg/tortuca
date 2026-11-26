/** public-apis curation — npm run test:public-apis-deep */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicApisContextForIris } from "../shared/publicApisIrisBridge.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

let n = 0;
const ok = (name: string, cond: boolean) => {
  n++;
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

const apis = JSON.parse(read("gamedev-resources/tortuca-public-apis.json")) as {
  catalogVersion: number;
  alreadyInTortuca: unknown[];
  entries: unknown[];
  backlog: unknown[];
};

ok("deep dive doc", fs.existsSync(path.join(root, "docs/DEEP_DIVE_PUBLIC_APIS.md")));
ok("catalog v2", apis.catalogVersion === 2);
ok("wired pulse+stocks", apis.alreadyInTortuca.length >= 8);
ok("backlog revenue picks", apis.backlog.some((b: { id?: string }) => b.id === "fred"));
ok("seller-fee in entries", apis.entries.some((e: { id?: string }) => e.id === "seller-fee"));
ok("iris bridge", publicApisContextForIris().includes("Finnhub"));
ok("App wires publicApis context", read("src/App.tsx").includes("publicApisContextForIris"));

console.log(`\nPublic APIs deep checks passed (${n}).`);